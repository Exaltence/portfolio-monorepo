---
description: 'Testing strategies for NgRx Signals Stores using Vitest, TestBed, store mocking, and the unprotected utility'
applyTo: '**/*.store.spec.ts'
---

# NgRx Signal Store Testing (Vitest + Angular TestBed, v21+)

> **Scope:** Unit testing patterns for NgRx Signal Stores — state, computed, methods, rxMethod, signalMethod, custom features, store mocking, and integration testing. This file does NOT cover: general component/service testing (`angular-testing.instructions.md`), store creation patterns (`ngrx-signals.instructions.md`), or TypeScript typing/formatting (`typescript.instructions.md`).

> **Note:** Comments inside code blocks in this file are instructional annotations for context only. Do not reproduce them in generated code — this project forbids inline code comments and JSDoc (see `typescript.instructions.md` §10).

---

## 1. Forbidden Patterns

These patterns MUST NOT appear in any generated or modified store test code.

### Zone.js & Async

- ❌ `fakeAsync` / `tick` / `flush` from `@angular/core/testing` — zone.js is not installed; use `TestBed.tick()`, `await expect.poll()`, or `vi.useFakeTimers()`
- ❌ `provideZonelessChangeDetection()` in test providers — zoneless is the default in Angular v21; adding it is redundant
- ❌ `fixture.detectChanges()` as primary change detection trigger — use `await fixture.whenStable()`
- ❌ `fixture.autoDetectChanges(true)` — not part of established patterns; use `await fixture.whenStable()`

### Typing & Mocking

- ❌ `any` in mocks, stubs, or test fixtures — use explicit interfaces or type annotations
- ❌ Untyped mock store objects (`{ method: vi.fn() }` without type annotation) — use `Pick<InstanceType<typeof Store>, 'members'>` or explicit interfaces
- ❌ `protectedState: false` on stores to make testing easier — use the `unprotected` utility instead
- ❌ Spying on store methods under test (e.g., `vi.spyOn(store, 'increment')`) — always call actual public methods directly for state assertions; complex orchestration logic must live in separate services that can be mocked. Note: `vi.fn()` for methods in a **mock store replacement** provided to a component test is allowed (see §8)

### Imports & DOM

- ❌ Importing runtime globals (`describe`, `it`, `expect`, `vi`) from `'vitest'` — pre-configured as globals; type-only imports (`import { type Mock } from 'vitest'`) are permitted only when a Vitest utility type is explicitly needed in a type annotation
- ❌ Deep imports into library internals — import from barrel `index.ts` only
- ❌ `debugElement.queryAll(By.css(...))` — use `fixture.nativeElement as HTMLElement` + `querySelector` / `querySelectorAll`

---

## 2. Test Pattern Decision Table

| Need                                           | Pattern                                                                         | Why                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| Instantiate a `providedIn: 'root'` store       | `TestBed.inject(MyStore)`                                                       | No providers needed                              |
| Instantiate a locally-provided store           | `TestBed.configureTestingModule({ providers: [MyStore] })`                      | Must register manually                           |
| Patch protected state for testing computed     | `patchState(unprotected(store), { ... })`                                       | State is protected by default                    |
| Assert async result from rxMethod/signalMethod | `await expect.poll(() => store.value()).toBe(x)`                                | Zoneless-compatible; no fakeAsync                |
| Flush synchronous signal effects               | `TestBed.tick()`                                                                | Flushes pending effects in zoneless mode         |
| Pass a Signal to signalMethod in test          | `TestBed.runInInjectionContext(() => store.method(signal))`                     | Requires injection context for effect scheduling |
| Mock a store dependency (service)              | `{ provide: Service, useValue: mockService }` in providers                      | Isolates store from real service                 |
| Mock the entire store in a component test      | `{ provide: MyStore, useValue: typedMockStore }`                                | Isolates component from real store               |
| Test rxMethod with sync Observable             | `store.method(of(values))` — assert immediately                                 | Synchronous emission completes inline            |
| Test rxMethod with async Observable            | `store.method(scheduled([values], asyncScheduler))` + `await expect.poll(...)`  | Simulates async emission                         |
| Test time-dependent store logic                | `vi.useFakeTimers()` / `vi.advanceTimersByTimeAsync(ms)` / `vi.useRealTimers()` | Controls timing without zone.js                  |

Rules:

- Test through the store's public API — never spy on store methods themselves
- Use `TestBed` for all store instantiation — `new` bypasses injection context
- Mock dependencies (services), not the store under test
- Use `unprotected` only when every public method that sets the target state slice also modifies other state slices read by the computed/method under test, which would make the assertion unreliable
- Follow AAA pattern (Arrange, Act, Assert) in every test

---

## 3. Basic Store Testing

### Globally Provided Store

```typescript
import { TestBed } from '@angular/core/testing';

import { MoviesStore } from './movies.store';

describe('MoviesStore', () => {
  it('should have initial movies state', () => {
    const store = TestBed.inject(MoviesStore);

    expect(store.movies()).toHaveLength(3);
  });
});
```

### Locally Provided Store

```typescript
import { TestBed } from '@angular/core/testing';

import { MoviesStore } from './movies.store';

describe('MoviesStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MoviesStore],
    });
  });

  it('should have initial movies state', () => {
    const store = TestBed.inject(MoviesStore);

    expect(store.movies()).toHaveLength(3);
  });
});
```

Rules:

- Global stores (`providedIn: 'root'`) need only `TestBed.inject(Store)` — no `configureTestingModule`
- Local stores must be registered in `providers` array
- Never add `provideZonelessChangeDetection()` — it is the default in Angular v21

---

## 4. Testing State and Computed Properties

```typescript
import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';

import { CounterStore } from './counter.store';

describe('CounterStore', () => {
  it('should have initial state and derived doubleCount', () => {
    const store = TestBed.inject(CounterStore);

    expect(store.count()).toBe(0);
    expect(store.doubleCount()).toBe(0);
  });

  it('should recompute doubleCount when count is patched via unprotected', () => {
    const store = TestBed.inject(CounterStore);

    patchState(unprotected(store), { count: 5 });

    expect(store.count()).toBe(5);
    expect(store.doubleCount()).toBe(10);
  });

  it('should update doubleCount when count changes via increment', () => {
    const store = TestBed.inject(CounterStore);

    store.increment();

    expect(store.count()).toBe(1);
    expect(store.doubleCount()).toBe(2);
  });
});
```

Rules:

- Test initial state values directly via the store's signal getters
- Use `patchState(unprotected(store), {...})` to set state when public methods don't expose needed mutations
- Verify computed signals recalculate after state changes
- Prefer calling public methods over `unprotected` when both are available

### Testing Computed Properties That Depend on External Signals

```typescript
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { ProjectsStore } from './projects.store';

describe('ProjectsStore computed from route params', () => {
  it('should derive activeProjectId from route params', () => {
    const paramMap$ = new BehaviorSubject({ get: (key: string) => '42' });

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } },
      ],
    });

    const store = TestBed.inject(ProjectsStore);

    expect(store.activeProjectId()).toBe('42');

    paramMap$.next({ get: (key: string) => '99' });
    TestBed.tick();

    expect(store.activeProjectId()).toBe('99');
  });
});
```

Rules:

- Mock external signal sources (e.g., `ActivatedRoute`, services using `toSignal`) via providers
- Use `BehaviorSubject` to control Observable-based signal sources and push new values during the test
- Call `TestBed.tick()` after updating the source to flush signal recomputations

---

## 5. Mocking Store Dependencies

```typescript
import { TestBed } from '@angular/core/testing';

import { MoviesStore } from './movies.store';
import { MoviesService } from '../infrastructure/movies.service';
import { Movie } from '../models/movie.model';

describe('MoviesStore', () => {
  const mockMoviesService: Pick<MoviesService, 'getByQuery'> = {
    getByQuery: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MoviesService, useValue: mockMoviesService }],
    });
  });

  it('should increment by the step returned by the injected service', () => {
    const mockStepService = { getStep: () => 3 };

    TestBed.configureTestingModule({
      providers: [{ provide: StepService, useValue: mockStepService }],
    });

    const store = TestBed.inject(CounterStore);
    store.increment();

    expect(store.count()).toBe(3);
  });
});
```

Rules:

- Type mock services with `Pick<T, 'usedMethods'>` or a full explicit interface
- Provide mocks via `{ provide: RealService, useValue: mockService }` in `configureTestingModule`
- Use `vi.fn()` for methods that need call verification
- Mock only what the store actually uses — partial mocks are preferred over full `Mocked<T>`

---

## 6. Testing rxMethod with Observables

```typescript
import { TestBed } from '@angular/core/testing';
import { of, scheduled, asyncScheduler } from 'rxjs';

import { BooksStore } from './books.store';

describe('BooksStore rxMethod', () => {
  it('should process synchronous Observable emissions immediately', () => {
    const store = TestBed.inject(BooksStore);

    store.loadByQuery(of('Angular', 'RxJS'));

    expect(store.books()).toHaveLength(2);
  });

  it('should process asynchronous Observable emissions', async () => {
    const store = TestBed.inject(BooksStore);

    store.loadByQuery(scheduled(['Angular'], asyncScheduler));
    expect(store.books()).toHaveLength(0);

    await expect.poll(() => store.books()).toHaveLength(1);
  });
});
```

### Testing rxMethod Error Handling

```typescript
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';

import { MoviesStore } from './movies.store';
import { MoviesService } from '../infrastructure/movies.service';

describe('MoviesStore rxMethod error path', () => {
  it('should transition to error state when observable errors', async () => {
    const mockService: Pick<MoviesService, 'getByQuery'> = {
      getByQuery: vi.fn(() => throwError(() => new Error('Network failure'))),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: MoviesService, useValue: mockService }],
    });

    const store = TestBed.inject(MoviesStore);
    store.loadByQuery('test');

    await expect.poll(() => store.error()).toBe('Failed to load movies');
    expect(store.isLoading()).toBe(false);
  });
});
```

Rules:

- Use `of(values)` for synchronous emission — assert immediately after the call
- Use `scheduled([values], asyncScheduler)` for async emission — assert with `await expect.poll()`
- Use `throwError(() => new Error(...))` to test error paths — assert on the store's error state
- Use `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(ms)` when testing time-dependent operators (`delay`, `debounceTime`)
- Always call `vi.useRealTimers()` after `vi.useFakeTimers()` to clean up

---

## 7. Testing signalMethod

```typescript
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CounterStore } from './counter.store';

describe('CounterStore signalMethod', () => {
  it('should execute synchronously with a static value', () => {
    const store = TestBed.inject(CounterStore);

    store.increment(1);
    expect(store.count()).toBe(1);

    store.increment(2);
    expect(store.count()).toBe(3);
  });

  it('should react to Signal changes with expect.poll', async () => {
    const store = TestBed.inject(CounterStore);
    const step = signal(2);

    TestBed.runInInjectionContext(() => store.increment(step));
    expect(store.count()).toBe(0);

    await expect.poll(() => store.count()).toBe(2);

    step.set(3);
    await expect.poll(() => store.count()).toBe(5);
  });

  it('should flush synchronously with TestBed.tick()', () => {
    const store = TestBed.inject(CounterStore);
    const step = signal(5);

    TestBed.runInInjectionContext(() => store.increment(step));
    TestBed.tick();

    expect(store.count()).toBe(5);
  });
});
```

Rules:

- Static-value calls to signalMethod execute synchronously — no tick or poll needed
- Wrap Signal-based signalMethod calls in `TestBed.runInInjectionContext()` — effects require an injection context
- Use `await expect.poll(() => store.value()).toBe(x)` or `TestBed.tick()` to flush signal-driven effects
- `TestBed.tick()` is Angular's zoneless flush API — it is NOT the banned `tick()` from `fakeAsync`

---

## 8. Mocking Stores in Component Tests

### Typed Mock Store

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoviesComponent } from './movies.component';
import { MoviesStore } from '../data/state/movies.store';
import { Movie } from '../data/models/movie.model';

describe('MoviesComponent', () => {
  let fixture: ComponentFixture<MoviesComponent>;

  it('should display movies from mock store', async () => {
    const mockStore: Pick<
      InstanceType<typeof MoviesStore>,
      'movies' | 'loading' | 'load'
    > = {
      movies: signal<Movie[]>([
        { id: 1, name: 'Harry Potter' },
        { id: 2, name: 'The Dark Knight' },
      ]),
      loading: signal(false),
      load: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MoviesComponent],
      providers: [{ provide: MoviesStore, useValue: mockStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(MoviesComponent);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const movieEls = el.querySelectorAll('[data-testid="movie-item"]');
    expect(movieEls).toHaveLength(2);
  });
});
```

### Verifying Store Interactions

```typescript
it('should call load when search input changes', async () => {
  const load = vi.fn();
  const mockStore: Pick<
    InstanceType<typeof MoviesStore>,
    'movies' | 'loading' | 'load'
  > = {
    movies: signal<Movie[]>([]),
    loading: signal(false),
    load,
  };

  await TestBed.configureTestingModule({
    imports: [MoviesComponent],
    providers: [{ provide: MoviesStore, useValue: mockStore }],
  }).compileComponents();

  fixture = TestBed.createComponent(MoviesComponent);
  await fixture.whenStable();

  const input = fixture.nativeElement.querySelector(
    '[data-testid="search-input"]',
  ) as HTMLInputElement;
  input.value = 'Warner Bros';
  input.dispatchEvent(new Event('input'));
  await fixture.whenStable();

  expect(load).toHaveBeenCalledWith('Warner Bros');
});
```

Rules:

- Type mock stores with `Pick<InstanceType<typeof Store>, 'usedMembers'>` — ensures type safety without over-mocking
- Use `signal()` for state and computed properties in mocks — components read them as signals
- Use `vi.fn()` for store methods — enables call verification
- Prefer asserting on rendered state over asserting that methods were called
- Use `await fixture.whenStable()` after fixture creation and after state changes
- Query DOM via `fixture.nativeElement as HTMLElement` + `querySelector('[data-testid="..."]')`

---

## 9. Integration Testing

```typescript
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { MoviesComponent } from './movies.component';

describe('MoviesComponent integration', () => {
  it('should load and display movies from API', async () => {
    await TestBed.configureTestingModule({
      imports: [MoviesComponent],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(MoviesComponent);
    const ctrl = TestBed.inject(HttpTestingController);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector(
      '[data-testid="search-input"]',
    ) as HTMLInputElement;
    input.value = 'Warner Bros';
    input.dispatchEvent(new Event('input'));

    ctrl.expectOne('/api/movies?query=Warner%20Bros').flush([
      { id: 1, name: 'Harry Potter' },
      { id: 2, name: 'The Dark Knight' },
    ]);

    await fixture.whenStable();

    const movies = el.querySelectorAll('[data-testid="movie-item"]');
    expect(movies).toHaveLength(2);
    ctrl.verify();
  });
});
```

Rules:

- Use `provideHttpClientTesting()` only — `provideHttpClient()` is not needed in Angular v21 tests
- Call `ctrl.verify()` in `afterEach` or at the end of each test to catch unexpected requests
- Use `await fixture.whenStable()` after flushing HTTP responses before DOM assertions
- Integration tests use the real store — only mock external boundaries (HTTP, third-party services)

---

## 10. Testing Custom Store Features

```typescript
import { TestBed } from '@angular/core/testing';
import {
  signalStore,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
  patchState,
} from '@ngrx/signals';

import {
  withRequestStatus,
  setPending,
  setFulfilled,
} from './with-request-status';

describe('withRequestStatus', () => {
  const TestStore = signalStore(
    { providedIn: 'root' },
    withRequestStatus(),
    withMethods((store) => ({
      startLoading(): void {
        patchState(store, setPending());
      },
      finishLoading(): void {
        patchState(store, setFulfilled());
      },
    })),
  );

  it('should have idle status initially', () => {
    const store = TestBed.inject(TestStore);

    expect(store.isPending()).toBe(false);
    expect(store.isFulfilled()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should transition through request lifecycle', () => {
    const store = TestBed.inject(TestStore);

    store.startLoading();
    expect(store.isPending()).toBe(true);

    store.finishLoading();
    expect(store.isFulfilled()).toBe(true);
    expect(store.isPending()).toBe(false);
  });
});
```

Rules:

- Test custom features by wrapping them in a minimal `signalStore` — the "testing store" pattern
- Add helper methods to the testing store when the feature lacks public setters for state transitions
- Assert on the feature's computed signals and state, not its internal implementation
- Mark the testing store `providedIn: 'root'` for simplicity — no `configureTestingModule` needed

---

## 11. Testing Store Lifecycle Hooks

```typescript
import { TestBed } from '@angular/core/testing';

import { UserStore } from './user.store';
import { UserService } from '../infrastructure/user.service';
import { User } from '../models/user.model';

describe('UserStore onInit', () => {
  it('should load users on initialization', () => {
    const mockUsers: User[] = [{ id: '1', name: 'Alice' }];
    const mockUserService: Pick<UserService, 'getCached'> = {
      getCached: vi.fn(() => mockUsers),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: UserService, useValue: mockUserService }],
    });

    const store = TestBed.inject(UserStore);

    expect(store.users()).toEqual(mockUsers);
    expect(mockUserService.getCached).toHaveBeenCalledOnce();
  });
});
```

Rules:

- `withHooks` `onInit` runs automatically when the store is injected — no manual trigger needed
- Mock dependencies that `onInit` calls to control test data and verify invocations
- `onDestroy` runs when the store's injector is destroyed — test by destroying the `TestBed`

---

## 12. Testing Stores with withEntities

```typescript
import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { setAllEntities, updateEntity } from '@ngrx/signals/entities';
import { unprotected } from '@ngrx/signals/testing';

import { MoviesStore } from './movies.store';
import { Movie } from '../models/movie.model';

describe('MoviesStore entities', () => {
  it('should select all entities after arranging state', () => {
    const store = TestBed.inject(MoviesStore);
    const movies: Movie[] = [
      { id: 1, name: 'Harry Potter' },
      { id: 2, name: 'The Dark Knight' },
    ];

    patchState(unprotected(store), setAllEntities(movies));

    expect(store.entities()).toEqual(movies);
    expect(store.ids()).toEqual([1, 2]);
  });

  it('should select entities from a named collection', () => {
    const store = TestBed.inject(MoviesStore);
    const movies: Movie[] = [{ id: 1, name: 'Harry Potter' }];

    patchState(
      unprotected(store),
      setAllEntities(movies, { collection: 'movies' }),
    );

    expect(store.moviesEntities()).toEqual(movies);
  });

  it('should update a single entity and reflect in selectors', () => {
    const store = TestBed.inject(MoviesStore);
    const movies: Movie[] = [
      { id: 1, name: 'Harry Potter' },
      { id: 2, name: 'The Dark Knight' },
    ];

    patchState(unprotected(store), setAllEntities(movies));
    patchState(
      unprotected(store),
      updateEntity({
        id: 1,
        changes: { name: 'Harry Potter and the Goblet of Fire' },
      }),
    );

    expect(store.entityMap()[1].name).toBe(
      'Harry Potter and the Goblet of Fire',
    );
  });
});
```

Rules:

- Arrange entity state via `patchState(unprotected(store), setAllEntities([...]))` — entities are protected state
- For named collections, pass `{ collection: 'collectionName' }` as the second argument to entity updaters
- Assert on entity selectors (`entities()`, `ids()`, `entityMap()`) or their collection-prefixed variants
- Use `updateEntity`, `removeEntity`, `addEntity` from `@ngrx/signals/entities` for granular state arrangement

---

## 13. Cleanup and Teardown

Rules:

- Vitest with Angular TestBed automatically resets the testing module between tests — no manual `TestBed.resetTestingModule()` is needed
- If a test uses `vi.useFakeTimers()`, always restore with `vi.useRealTimers()` in the same test or in `afterEach`
- If a test subscribes to Observables manually (outside of `rxMethod`), unsubscribe in `afterEach` to prevent leaks
- Store effects created via `withHooks` or `signalMethod` are cleaned up automatically when the store's injector is destroyed at the end of each test
- If the store uses features that register global side effects (e.g., `withDevtools`), ensure those features are either excluded from the test store or their providers are mocked
