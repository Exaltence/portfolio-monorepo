---
description: 'Angular v21+ constraints: standalone components, signals, OnPush, modern control flow, DI patterns, library-type behavioral rules, and forbidden legacy patterns'
applyTo: '**/*.ts, **/*.html, **/*.scss'
---

# Angular Constraints & Patterns (v21+)

> **Scope:** Component architecture, DI, signals & reactivity, data fetching, routing, templates, directives, pipes, and styling. This file does NOT cover: NgRx Signal Store patterns (`ngrx-signals.instructions.md`), Signal Forms (`angular-signal-forms.instructions.md`), or test setup (`angular-testing.instructions.md`). Naming conventions live in `architecture.instructions.md` §1. TypeScript typing/formatting live in `typescript.instructions.md`.

> Angular v21: Zoneless change detection is the default (`provideZonelessChangeDetection()`). ZoneJS is not installed. `provideHttpClient()` is no longer required in test providers — only use `provideHttpClientTesting()` for HTTP testing.

---

## 1. Forbidden Patterns

These patterns MUST NOT appear in any generated or modified code:

- ❌ `standalone: true` in decorators (default since v19 — setting it is redundant)
- ❌ `CommonModule`, `RouterModule`, `FormsModule`, `ReactiveFormsModule` imports — import standalone symbols directly (`RouterOutlet`, `RouterLink`, etc.)
- ❌ `@Input()` / `@Output()` decorators — use `input()` / `output()` functions
- ❌ `@ViewChild` / `@ViewChildren` / `@ContentChild` / `@ContentChildren` decorators — use signal queries (`viewChild`, `viewChildren`, `contentChild`, `contentChildren`)
- ❌ `@HostBinding` / `@HostListener` — use `host` object in decorator metadata
- ❌ Constructor-based injection — use `inject()` function
- ❌ `any` type — use `unknown` when type is genuinely unknown
- ❌ `ngOnChanges` — use `computed()` or `linkedSignal()` for derived/resettable state
- ❌ `async` pipe — use `toSignal()` to bridge Observables into template-consumed signals
- ❌ Class-based guards / resolvers / interceptors — use functional equivalents
- ❌ `subscribe()` in components — use `toSignal()`, `resource()`, or `effect()`
- ❌ `mutate()` on signals — use `update()` or `set()`
- ❌ `*ngIf` / `*ngFor` / `*ngSwitch` — use `@if` / `@for` / `@switch`
- ❌ `ngClass` / `ngStyle` — use `[class.name]` / `[style.prop]` bindings
- ❌ `NgModules` for new features — always standalone
- ❌ `::ng-deep` — use component encapsulation or global theme files
- ❌ Arrow functions in templates (not supported)
- ❌ Assuming globals like `new Date()` in templates

---

## 2. Component Architecture

### Decorator Requirements

Every `@Component` decorator MUST include:

```typescript
@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {}
```

Rules:

- `changeDetection: ChangeDetectionStrategy.OnPush` — mandatory on ALL components (serves as a compatibility safeguard and makes signal-based notifications explicit, even though the app runs zoneless)
- `selector` — element selector with project prefix (`app` for `apps/portfolio`)
- External template (`.component.html`) and styles (`.component.scss`) — always; no inline templates
- Do NOT set `standalone: true` — it is the default

### Property Organization

Order members consistently:

1. Injected dependencies (`private readonly`)
2. Inputs
3. Outputs
4. Signal queries
5. Local state (`private`)
6. Derived state (`protected` for template, `readonly` for public API)
7. Methods

```typescript
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  private readonly userApi = inject(UserApiService);

  readonly userId = input.required<string>();

  readonly saved = output<void>();

  readonly nameInput = viewChild.required<ElementRef>('nameInput');

  private readonly editing = signal(false);

  protected readonly displayName = computed(() =>
    this.userApi.nameFor(this.userId()),
  );

  protected save(): void {
    this.saved.emit();
  }
}
```

### Access Modifiers

- `private readonly` — injected services and internal state signals
- `readonly` — inputs, outputs, models, queries (Angular-managed)
- `protected` — any member accessed only in the template
- `public` (implicit) — only for true public component API consumed by parent code

### Lifecycle Hooks

- Implement interface explicitly: `implements OnInit, OnDestroy`
- Keep hook bodies minimal — delegate to named methods
- Prefer `afterNextRender` / `afterRender` over `ngAfterViewInit` for DOM access

---

## 3. Library-Type Behavioral Rules

Components and services behave differently depending on which Nx library type they reside in. See `architecture.instructions.md` for the full DDD layout.

| Library Type | Allowed                                                                                                           | Forbidden                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `feature/`   | Inject stores from `data/`, inject services, use `computed()` over store selectors, pass data to `ui/` via inputs | Direct `HttpClient` usage, raw `httpResource()` (belongs in `data/`)                  |
| `ui/`        | Local `signal()`, `computed()`, `linkedSignal()`, `input()`, `output()`, `model()`                                | Injecting ANY store or domain service, `effect()` with side effects, `httpResource()` |
| `data/`      | NgRx Signal Store, `httpResource()`, `rxMethod()`, `HttpClient` for mutations, `effect()`                         | Component references, template logic, importing from `feature/` or `ui/`              |
| `util/`      | Pure exported functions, types, constants                                                                         | Any DI (`inject()`), signals, state, Angular decorators                               |

---

## 4. Dependency Injection

```typescript
@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
}
```

Rules:

- ALWAYS use `inject()` function — never constructor parameters
- Singleton services: `@Injectable({ providedIn: 'root' })`
- Feature-scoped stores: provide via route `providers` array
- Capture all dependencies in class field initializers — never call `inject()` in lifecycle hooks, callbacks, or after `await`

---

## 5. Inputs, Outputs & Queries

### Signal Inputs

```typescript
readonly name = input.required<string>();
readonly disabled = input(false);
readonly size = input(0, { transform: numberAttribute });
```

### Signal Outputs

```typescript
readonly closed = output<void>();
readonly valueChange = output<number>();
```

### Two-Way Binding (Model)

```typescript
readonly value = model(0);

increment(): void {
  this.value.update((v) => v + 1);
}
```

### Signal Queries

```typescript
readonly header = viewChild.required<ElementRef>('header');
readonly items = viewChildren(ItemComponent);
readonly projected = contentChild<TemplateRef<unknown>>('tmpl');
```

---

## 6. Signals & Reactivity

### Local State

```typescript
private readonly count = signal(0);
protected readonly doubleCount = computed(() => this.count() * 2);
```

### Linked Signals

Use `linkedSignal()` for writable state that resets reactively from a source:

```typescript
readonly selectedId = linkedSignal(() => this.items()[0]?.id);

// Advanced form with previous value access
readonly selected = linkedSignal<Option[], Option>({
  source: this.options,
  computation: (opts, prev) =>
    opts.find((o) => o.id === prev?.value.id) ?? opts[0],
});
```

### Effects

```typescript
private readonly logEffect = effect(() => {
  const current = this.count();
  untracked(() => this.logger.log(current));
});
```

Rules:

- `set()` to replace, `update()` to transform — never `mutate()`
- Use `untracked()` inside `effect()` to read without tracking
- `effect()` is for side effects only — never derive state with it

**Prefer** — derived state via `computed()`:

```typescript
protected readonly fullName = computed(() =>
  `${this.firstName()} ${this.lastName()}`,
);
```

**Avoid** — state propagation inside `effect()` (causes glitches and unnecessary CD cycles):

```typescript
effect(() => {
  this.fullName.set(`${this.firstName()} ${this.lastName()}`);
});
```

### Observable Interop

```typescript
private readonly route = inject(ActivatedRoute);
protected readonly id = toSignal(this.route.params.pipe(map((p) => p['id'])));
```

- Use `toSignal()` to bridge RxJS → Signals (replaces `async` pipe)
- Use `toObservable()` only when feeding signal data into RxJS operators

---

## 7. Data Fetching & HTTP

### App Configuration

`provideHttpClient()` and `provideZonelessChangeDetection()` MUST be registered in the application config:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(appRoutes, withHashLocation()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

### httpResource (Preferred for Reads)

> **Note:** `httpResource` is experimental in Angular v21. Prefer it for reactive reads but be aware the API may change before stabilization.

In a `data/` layer store:

```typescript
import { httpResource } from '@angular/common/http';

// Inside a Signal Store or service in data/ layer
readonly userId = signal<string>('');
protected readonly user = httpResource<User>(() => `/api/users/${this.userId()}`);
```

Template usage (in the `feature/` component consuming the store):

```html
@if (store.user.hasValue()) {
<app-user-card [user]="store.user.value()" />
} @else if (store.user.error()) {
<app-error [message]="store.user.error()" />
} @else if (store.user.isLoading()) {
<app-spinner />
}
```

Rules:

- Place `httpResource()` calls in `data/` layer stores — not directly in components
- Use `hasValue()` guard before reading `value()` (reading value in error state throws)
- For response validation, use the `parse` option with a schema library (e.g., Zod)
- `httpResource` is for reads only — use `HttpClient` for mutations (POST/PUT/DELETE)

### HttpClient (Mutations)

```typescript
@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);

  createTask(task: NewTask): Observable<Task> {
    return this.http.post<Task>('/api/tasks', task);
  }
}
```

### Interceptors

Use functional interceptors:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthTokenService).token();
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authReq);
};
```

---

## 8. Routing

### Route Configuration

```typescript
export const appRoutes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('@portfolio-monorepo/portfolio/feature-tasks').then(
        (m) => m.TaskListComponent,
      ),
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
```

Rules:

- Use `loadComponent` for lazy-loading feature library entry components
- Import from library barrel (`index.ts`) — never deep import
- Feature-scoped providers go in route `providers` array
- Use functional guards and resolvers

### Functional Guards

```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() || router.createUrlTree(['/login']);
};
```

### Functional Resolvers

```typescript
export const taskResolver: ResolveFn<Task> = (route) => {
  const api = inject(TaskApiService);
  return api.getTask(route.paramMap.get('id')!);
};
```

---

## 9. Template Patterns

### Control Flow (Required)

```html
@if (user(); as currentUser) {
<h1>Welcome, {{ currentUser.name }}!</h1>
} @for (task of tasks(); track task.id) {
<app-task-card [task]="task" />
} @empty {
<p>No tasks found.</p>
} @switch (status()) { @case ('loading') {
<app-spinner />
} @case ('error') {
<app-error />
} @default {
<app-content />
} }
```

### Local Template Variables

```html
@let total = cart().items.length;
<span>{{ total }} items</span>
```

### Deferred Loading

```html
@defer (on viewport) {
<app-heavy-chart [data]="chartData()" />
} @loading (minimum 200ms) {
<app-skeleton />
} @placeholder {
<div class="chart-placeholder"></div>
}
```

### Binding Rules

```html
<div
  [class.active]="isActive()"
  [class.disabled]="isDisabled()"
  [style.opacity]="isActive() ? 1 : 0.5"
></div>
```

- Track expression required in every `@for` — use a unique stable identifier
- Use `@empty` block for empty collection states
- Delegate complex logic to `computed()` — templates call signals, not methods with logic

---

## 10. Directives & Pipes

### Directives

```typescript
@Directive({
  selector: '[appHighlight]',
  host: {
    '[class.highlighted]': 'active()',
    '(mouseenter)': 'activate()',
    '(mouseleave)': 'deactivate()',
  },
})
export class HighlightDirective {
  private readonly active = signal(false);

  protected activate(): void {
    this.active.set(true);
  }

  protected deactivate(): void {
    this.active.set(false);
  }
}
```

### Pipes

```typescript
@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, maxLength = 50): string {
    return value.length > maxLength
      ? `${value.substring(0, maxLength)}…`
      : value;
  }
}
```

- Pipes MUST be pure (default) unless there is an explicit reactive requirement
- Use `camelCase` for the pipe `name` property

---

## 11. Styling

- SCSS exclusively — no plain CSS
- External stylesheets always: `styleUrl: './component-name.component.scss'`
- Never use `::ng-deep` — use global theme files or CSS custom properties for cross-boundary styling
- BEM naming for custom class names: `.block__element--modifier`
- Use `@use` over `@import` for SCSS module system
- Component host styling via `:host` selector
- Support theming via CSS custom properties (`--prefix-property`)

---

## 12. Testing

> Full patterns: `angular-testing.instructions.md` (Vitest + TestBed) and `ngrx-signals-testing.instructions.md` (store testing).

Enforced rules:

- Test runner: **Vitest** — never Jest or Karma
- Co-located test files: `*.component.spec.ts` next to component
- Angular v21: use `provideHttpClientTesting()` only — `provideHttpClient()` is not needed in tests
- Use `vi.fn()` for mocks — never Jasmine spies
- E2E: Playwright only — specs live in `apps/<name>-e2e/src/`

---

## 13. Performance

- Zoneless change detection — no ZoneJS overhead; signals and events drive CD
- `@defer` blocks for below-fold / heavy content
- `@for` must always have `track` — use a unique stable property (e.g., `id`)
- `computed()` for expensive derivations (memoized automatically)
- `NgOptimizedImage` for all `<img>` elements (with `priority` on LCP images)
- CDK Virtual Scrolling for lists > 100 items

---

## 14. Accessibility

- All interactive elements MUST be keyboard-navigable
- WCAG AA minimum: color contrast, focus indicators, ARIA attributes
- Use semantic HTML elements over generic `<div>` / `<span>` with ARIA roles
- Use Angular CDK a11y utilities — import standalone symbols directly (`CdkTrapFocus` directive, `LiveAnnouncer` service via `inject()`)
- Every `<img>` must have `alt` text (or `alt=""` for decorative)
- Never bypass `DomSanitizer` without explicit security review
