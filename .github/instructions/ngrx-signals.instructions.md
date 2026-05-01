---
description: 'State management patterns using NgRx Signals Store v21+ with signalStore, withState, withMethods, withFeature, withLinkedState, entities, and rxMethod integration'
applyTo: '**/*.store.ts'
---

# NgRx Signal Store Patterns (v21+)

> **Scope:** Signal Store creation, state, computed, methods, entities, lifecycle hooks, custom features, and RxJS/signal-method integration. This file does NOT cover: component architecture or DI (`angular.instructions.md`), DDD layering or naming (`architecture.instructions.md`), testing (`ngrx-signals-testing.instructions.md`), or TypeScript typing/formatting (`typescript.instructions.md`).

> **Note:** Comments inside code blocks in this file are instructional annotations for context only. Do not reproduce them in generated code — see `typescript.instructions.md` §10.

---

## 1. Forbidden Patterns

These patterns MUST NOT appear in any generated or modified store code:

- ❌ `protectedState: false` — state is protected by default; never weaken it
- ❌ `protectedState: true` — it is the default; setting it is redundant
- ❌ `subscribe()` inside stores — use `rxMethod`, `signalMethod`, or `withHooks`
- ❌ `signalMethod` for imperative CRUD — use plain methods for static-value state updates
- ❌ `async`/`await` with Observable-based services — use `rxMethod` with `tapResponse`
- ❌ Mutable array/object operations (`push`, `splice`, `delete`) inside `patchState` — return new references
- ❌ `any` in state interfaces, method signatures, or generics
- ❌ Explicit generic on `withState` when inferable — `withState<T>({...})` only needed for union types or `inject()`-based factories
- ❌ `onInit` returning a cleanup function — use `onDestroy` for teardown
- ❌ Wrapper provider functions (`provideXxxStore()`) — stores are already injectable; avoid indirection
- ❌ `effect()` inside stores for state derivation — use `withComputed` or `withLinkedState`
- ❌ Calling `inject()` outside `withMethods`/`withProps`/`withHooks` factory context

---

## 2. Method Selection Decision Table

| Need                                            | Use                                          | Why                                                     |
| ----------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| Synchronous state update (imperative)           | Plain method + `patchState`                  | Simplest, no overhead                                   |
| Observable-based async side effect              | `rxMethod` from `@ngrx/signals/rxjs-interop` | Manages subscription lifecycle, supports RxJS operators |
| Signal-driven reactive side effect (no RxJS)    | `signalMethod` from `@ngrx/signals`          | Re-executes when passed Signal changes; smaller bundle  |
| Promise-based async (service returns `Promise`) | `async` method + `patchState`                | Valid when API is genuinely Promise-based               |
| Decoupled inter-store coordination              | Events plugin (`@ngrx/signals/events`)       | Separates "what happened" from "how to react"           |

Rules:

- Default to plain methods — only reach for `rxMethod`/`signalMethod` when their specific capabilities are needed
- `rxMethod` is superior for race-condition handling (`switchMap`, `exhaustMap`, `concatMap`)
- `signalMethod` only tracks the input Signal; signals inside the processor are untracked
- Never convert Observables to Promises just to use `async`/`await`

---

## 3. Store Structure

```typescript
import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap } from 'rxjs';
import { BookService } from './book.service';
import { Book } from './book.model';

interface BookState {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  filter: { query: string; order: 'asc' | 'desc' };
}

const initialState: BookState = {
  books: [],
  isLoading: false,
  error: null,
  filter: { query: '', order: 'asc' },
};

export const BookStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ books, filter }) => ({
    booksCount: computed(() => books().length),
    sortedBooks: () => {
      const direction = filter.order() === 'asc' ? 1 : -1;
      return books().toSorted(
        (a, b) => direction * a.title.localeCompare(b.title),
      );
    },
  })),
  withMethods((store, bookService = inject(BookService)) => ({
    updateQuery(query: string): void {
      patchState(store, (state) => ({
        filter: { ...state.filter, query },
      }));
    },
    updateOrder(order: 'asc' | 'desc'): void {
      patchState(store, (state) => ({
        filter: { ...state.filter, order },
      }));
    },
    loadByQuery: rxMethod<string>(
      pipe(
        switchMap((query) => {
          patchState(store, { isLoading: true, error: null });
          return bookService.getByQuery(query).pipe(
            tapResponse({
              next: (books) => patchState(store, { books, isLoading: false }),
              error: () =>
                patchState(store, {
                  isLoading: false,
                  error: 'Failed to load books',
                }),
            }),
          );
        }),
      ),
    ),
  })),
);
```

Rules:

- State type is always a record/object literal — arrays must be wrapped in an object
- Let TypeScript infer the state type from `initialState` — do not add `withState<T>()` redundantly
- `withComputed` factory can return either `computed(() => ...)` or plain functions (auto-wrapped in `computed`)
- `withMethods` factory receives the store instance and allows `inject()` as additional parameters
- `patchState` accepts partial state objects, updater functions `(state) => partial`, or standalone updaters
- Keep stores focused on a single domain entity or bounded context

---

## 4. Store Scoping in DDD

Stores follow the DDD layering from `architecture.instructions.md`:

| Layer      | Scope                 | Pattern                                             |
| ---------- | --------------------- | --------------------------------------------------- |
| `data/`    | Global domain state   | `signalStore({ providedIn: 'root' }, ...)`          |
| `feature/` | Route-scoped state    | Provide store in route `providers` array            |
| `feature/` | Component-local state | Provide store in `@Component({ providers: [...] })` |

Rules:

- ALL stores live in the `data/` layer of their domain — never in `feature/`, `ui/`, or `util/`
- Store _definitions_ always reside in `data/`; store _provisioning_ (providing) happens in `feature/` components or routes
- Global stores (`providedIn: 'root'`) are the default for domain data
- Component/route-scoped stores omit `providedIn` and are provided by the consuming `feature/` component
- `ui/` components NEVER inject stores — they receive data via inputs
- `feature/` components inject stores and pass data down to `ui/` via inputs

---

## 5. Entity Management

### Simple Entities (Standard `id` Property)

```typescript
import { signalStore, withMethods, patchState } from '@ngrx/signals';
import {
  withEntities,
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntity,
} from '@ngrx/signals/entities';
import { Todo } from './todo.model';

export const TodoStore = signalStore(
  { providedIn: 'root' },
  withEntities<Todo>(),
  withMethods((store) => ({
    addTodo(todo: Todo): void {
      patchState(store, addEntity(todo));
    },
    removeTodo(id: number): void {
      patchState(store, removeEntity(id));
    },
    completeTodo(id: number): void {
      patchState(store, updateEntity({ id, changes: { completed: true } }));
    },
    setAll(todos: Todo[]): void {
      patchState(store, setAllEntities(todos));
    },
  })),
);
```

Rules:

- Use `withEntities<T>()` (no config) when entity has a standard `id: string | number` property
- Entity updaters (`addEntity`, `updateEntity`, `removeEntity`, `setAllEntities`) are standalone functions passed to `patchState`
- Use plain methods for entity CRUD — `signalMethod` is unnecessary for imperative operations
- `entities` is a computed signal; `ids` and `entityMap` are state signals

### Named Collections & Custom ID

Use `entityConfig` when the entity lacks a standard `id` property OR when managing multiple collections:

```typescript
import { signalStore, withMethods, patchState, type } from '@ngrx/signals';
import {
  entityConfig,
  withEntities,
  addEntity,
  removeEntity,
} from '@ngrx/signals/entities';
import { Task } from './task.model';

const taskConfig = entityConfig({
  entity: type<Task>(),
  collection: 'task',
  selectId: (task) => task.key,
});

export const ProjectStore = signalStore(
  { providedIn: 'root' },
  withEntities(taskConfig),
  withMethods((store) => ({
    addTask(task: Task): void {
      patchState(store, addEntity(task, taskConfig));
    },
    removeTask(key: string): void {
      patchState(store, removeEntity(key, taskConfig));
    },
  })),
);
```

Rules:

- Named collections prefix signals: `taskEntities`, `taskEntityMap`, `taskIds`
- Pass config to both `withEntities(config)` and each updater call
- Private collections use `_` prefix on collection name: `collection: '_task'`
- `remove*` updaters take the raw ID directly — config is only required for named collections to identify which collection to target

---

## 6. Lifecycle Hooks

### Object Signature

```typescript
import {
  signalStore,
  withState,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';

export const CounterStore = signalStore(
  withState({ count: 0 }),
  withMethods((store) => ({
    increment(): void {
      patchState(store, (state) => ({ count: state.count + 1 }));
    },
  })),
  withHooks({
    onInit(store) {
      store.increment();
    },
    onDestroy(store) {
      console.log('final count:', store.count());
    },
  }),
);
```

### Factory Signature (Shared Dependencies)

```typescript
import { inject } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';

export const UserStore = signalStore(
  withState({ users: [] as User[] }),
  withMethods((store, userService = inject(UserService)) => ({
    loadUsers(): void {
      patchState(store, { users: userService.getCached() });
    },
  })),
  withHooks((store) => {
    const logger = inject(Logger);

    return {
      onInit() {
        store.loadUsers();
      },
      onDestroy() {
        logger.info('users on destroy:', store.users().length);
      },
    };
  }),
);
```

Rules:

- `onInit` runs within the injection context — `inject()` is available
- `onInit` does NOT return a cleanup function — use `onDestroy` for teardown
- Use the factory signature when `onDestroy` needs access to injected dependencies
- Use `withHooks` for auto-loading data at store init rather than relying on component `ngOnInit`
- Delegate async work to `rxMethod`/`signalMethod` defined in `withMethods` — call them from `onInit`

---

## 7. Computed State

```typescript
import { computed } from '@angular/core';
import { signalStore, withState, withComputed } from '@ngrx/signals';

export const CartStore = signalStore(
  withState({ items: [] as CartItem[], taxRate: 0.1 }),
  withComputed(({ items, taxRate }) => ({
    itemCount: computed(() => items().length),
    subtotal: computed(() =>
      items().reduce((sum, item) => sum + item.price * item.qty, 0),
    ),
    // Plain function form — auto-wrapped in computed()
    total: () => {
      const sub = items().reduce((sum, item) => sum + item.price * item.qty, 0);
      return sub + sub * taxRate();
    },
  })),
);
```

Rules:

- `withComputed` factory returns a dictionary of `computed()` signals or plain functions
- Plain functions are automatically wrapped in `computed()` by the framework
- Computed signals depend on previously defined state, props, or other computed signals
- Use `deepComputed(() => ({...}))` from `@ngrx/signals` when the computed result is an object and consumers need deeply nested signal access (e.g., `pagination.currentPage()`)
- Use `getState(store)` to read the entire state snapshot (useful for logging/debugging)

---

## 8. Private Store Members

```typescript
import { computed } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';

export const AnalyticsStore = signalStore(
  { providedIn: 'root' },
  withState({ _rawEvents: [] as AnalyticsEvent[], _buffer: 0 }),
  withComputed(({ _rawEvents }) => ({
    eventCount: computed(() => _rawEvents().length),
    _filteredEvents: computed(() => _rawEvents().filter((e) => e.valid)),
  })),
  withMethods((store) => ({
    _flush(): void {
      patchState(store, { _buffer: 0 });
    },
    trackEvent(event: AnalyticsEvent): void {
      patchState(store, (state) => ({
        _rawEvents: [...state._rawEvents, event],
      }));
    },
  })),
);
```

Rules:

- Prefix with `_` to make state slices, computed signals, or methods private (inaccessible from outside the store)
- Private members ARE accessible within the store itself (in subsequent `withComputed`/`withMethods`/`withHooks`)
- Ensure unique names across all state, computed, and methods — collisions cause compilation errors

---

## 9. Custom Store Features

### Creating a Feature

```typescript
import { computed } from '@angular/core';
import { signalStoreFeature, withComputed, withState } from '@ngrx/signals';

type RequestStatus = 'idle' | 'pending' | 'fulfilled' | { error: string };

interface RequestStatusState {
  requestStatus: RequestStatus;
}

export function setPending(): RequestStatusState {
  return { requestStatus: 'pending' };
}

export function setFulfilled(): RequestStatusState {
  return { requestStatus: 'fulfilled' };
}

export function setError(error: string): RequestStatusState {
  return { requestStatus: { error } };
}

export function withRequestStatus() {
  return signalStoreFeature(
    withState<RequestStatusState>({ requestStatus: 'idle' }),
    withComputed(({ requestStatus }) => ({
      isPending: computed(() => requestStatus() === 'pending'),
      isFulfilled: computed(() => requestStatus() === 'fulfilled'),
      error: computed(() => {
        const status = requestStatus();
        return typeof status === 'object' ? status.error : null;
      }),
    })),
  );
}
```

Rules:

- Define state updaters as standalone functions (not feature methods) — enables tree-shaking and composability with `patchState`
- Features are composed via `signalStoreFeature(...)` and used inside `signalStore(...)`
- When combining multiple custom features with static input that lack generics, add an unused generic `<_>()` to prevent TypeScript compilation errors
- `withState<T>()` with an explicit generic is valid in features when the state type contains unions (e.g., `RequestStatus` above) — without it, TypeScript narrows `'idle'` to a string literal instead of the full union

### Feature with Input Constraints

```typescript
import { computed, Signal } from '@angular/core';
import {
  signalStoreFeature,
  type,
  withComputed,
  withState,
} from '@ngrx/signals';
import { EntityState } from '@ngrx/signals/entities';

export function withSelectedEntity<Entity>() {
  return signalStoreFeature(
    { state: type<EntityState<Entity>>() },
    withState({ selectedEntityId: null as string | null }),
    withComputed(({ entityMap, selectedEntityId }) => ({
      selectedEntity: computed(() => {
        const id = selectedEntityId();
        return id ? entityMap()[id] : null;
      }),
    })),
  );
}
```

### `withFeature` for Decoupled Composition

```typescript
import { computed, Signal } from '@angular/core';
import {
  signalStore,
  signalStoreFeature,
  withComputed,
  withFeature,
  withMethods,
  withState,
  patchState,
} from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

export function withBooksFilter(books: Signal<Book[]>) {
  return signalStoreFeature(
    withState({ query: '' }),
    withComputed(({ query }) => ({
      filteredBooks: computed(() =>
        books().filter((b) => b.title.includes(query())),
      ),
    })),
    withMethods((store) => ({
      setQuery(query: string): void {
        patchState(store, { query });
      },
    })),
  );
}

export const BooksStore = signalStore(
  withEntities<Book>(),
  withFeature(({ entities }) => withBooksFilter(entities)),
);
```

Rules:

- `withFeature` passes store internals as signals into a feature factory — decouples the feature from store shape
- Feature input constraints use `{ state: type<...>() }` or `{ props: type<...>(), methods: type<...>() }`
- Prefer `withFeature` over static input constraints when the feature only needs one or two signals

---

## 10. Linked State

Use `withLinkedState` when state must reactively reset from another signal but remain writable via `patchState`:

```typescript
import { linkedSignal } from '@angular/core';
import { signalStore, withLinkedState, withState } from '@ngrx/signals';

export const OptionsStore = signalStore(
  withState({ options: [] as Option[] }),
  withLinkedState(({ options }) => ({
    selectedOption: linkedSignal<Option[], Option>({
      source: options,
      computation: (newOpts, prev) =>
        newOpts.find((o) => o.id === prev?.value.id) ?? newOpts[0],
    }),
  })),
);
```

Rules:

- `withLinkedState` accepts computation functions (implicit linking) or `WritableSignal` instances (explicit linking)
- Linked state slices are updatable via `patchState` like regular state
- Use for "selection that resets when options change" patterns
- This is the store-level equivalent of Angular's `linkedSignal()`

---

## 11. Custom Store Properties (`withProps`)

```typescript
import { toObservable } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';
import { signalStore, withProps, withState } from '@ngrx/signals';

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState({ isLoading: false }),
  withProps(({ isLoading }) => ({
    isLoading$: toObservable(isLoading),
  })),
  withProps(() => ({
    notificationService: inject(NotificationService),
    logger: inject(Logger),
  })),
);
```

Rules:

- Use `withProps` for static properties, injected dependencies shared across features, and observable bridges
- `withProps` factory runs in injection context — `inject()` is available
- Do NOT use `withProps` for derived state — use `withComputed` instead
- Properties added via `withProps` are accessible in subsequent `withComputed`/`withMethods`/`withHooks`

---

## 12. RxJS Integration (`rxMethod`)

```typescript
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { inject } from '@angular/core';
import { BookService } from './book.service';

export const SearchStore = signalStore(
  { providedIn: 'root' },
  withState({ results: [] as Book[], isLoading: false }),
  withMethods((store, bookService = inject(BookService)) => ({
    search: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => patchState(store, { isLoading: true })),
        switchMap((query) =>
          bookService.search(query).pipe(
            tapResponse({
              next: (results) =>
                patchState(store, { results, isLoading: false }),
              error: () => patchState(store, { results: [], isLoading: false }),
            }),
          ),
        ),
      ),
    ),
  })),
);
```

Rules:

- Import from `@ngrx/signals/rxjs-interop`
- `rxMethod` accepts static values, Observables, or Signals as input when called
- Subscription lifecycle is managed automatically (destroyed with the store)
- Always use `tapResponse` from `@ngrx/operators` for error handling inside `switchMap`/`exhaustMap`
- Calling `rxMethod` with a Signal in a component constructor reactively re-executes on Signal changes

---

## 13. Signal Method for Side Effects

```typescript
import { inject } from '@angular/core';
import {
  signalMethod,
  signalStore,
  withMethods,
  withProps,
} from '@ngrx/signals';

export const TrackingStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    analytics: inject(AnalyticsService),
  })),
  withMethods((store) => ({
    trackPageView: signalMethod<string>((page) => {
      store.analytics.track('page_view', { page });
    }),
  })),
);
```

Rules:

- Import from `@ngrx/signals` (not `rxjs-interop`)
- Use `signalMethod` ONLY when you need reactive re-execution on Signal changes
- For static-value calls without reactivity, a plain method is simpler and preferred
- When called from outside an injection context (e.g., `ngOnInit`), provide an explicit `injector` via config to prevent memory leaks
- `signalMethod` is `rxMethod` without RxJS — it cannot handle race conditions or backpressure

---

## 14. Events Plugin (Decision Heuristic)

The `@ngrx/signals/events` plugin adds an event-driven architecture layer (`event`, `eventGroup`, `withReducer`, `withEventHandlers`, `Dispatcher`, `injectDispatch`). Adopt it when:

- Multiple stores need to react to the same occurrence
- You need to decouple "what happened" (UI event) from "how to handle it" (state change + side effects)
- Complex inter-store coordination or micro-frontend isolation is required

For single-store, direct-call scenarios, plain `withMethods` is simpler and preferred. See the official docs at https://ngrx.io/guide/signals/signal-store/events for full patterns.

---

## 15. Component Integration

```typescript
@Component({
  selector: 'app-book-search',
  templateUrl: './book-search.component.html',
  styleUrl: './book-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BookFilterComponent, BookListComponent],
  providers: [BookSearchStore],
})
export class BookSearchComponent {
  protected readonly store = inject(BookSearchStore);

  constructor() {
    const query = this.store.filter.query;
    this.store.loadByQuery(query);
  }
}
```

Template (feature → ui data flow):

```html
@if (store.isLoading()) {
<app-spinner />
} @else {
<app-book-filter
  [query]="store.filter.query()"
  [order]="store.filter.order()"
  (queryChange)="store.updateQuery($event)"
  (orderChange)="store.updateOrder($event)"
/>
<app-book-list [books]="store.sortedBooks()" />
}
```

Rules:

- Inject stores with `inject()` — never constructor parameters
- Use `protected readonly` for store references accessed only in the template
- Trigger `rxMethod` with a Signal in the constructor for reactive data loading
- Prefer store `withHooks` `onInit` for data loading that belongs to the store lifecycle
- Component-scoped stores are provided in `providers` array and destroyed with the component
- Components in `feature/` layer inject stores; components in `ui/` layer NEVER inject stores
- `feature/` passes store signals as inputs to `ui/` components — `ui/` never accesses the store directly

---

## 16. Project Organization

- **File Location:** Store files (`*.store.ts`) live in `libs/<domain>/data/src/lib/state/`
- **Naming:** `FeatureNameStore` (PascalCase with `Store` suffix); file: `feature-name.store.ts`
- **State Interface:** Co-locate state interface in the store file (not exported unless shared)
- **Models:** Co-locate in `libs/<domain>/data/src/lib/models/` and export via `index.ts`
- **One Store Per File:** Each store has its own dedicated file
- **Public API:** Export stores through `libs/<domain>/data/src/index.ts` — no deep imports
