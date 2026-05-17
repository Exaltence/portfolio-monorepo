---
description: 'Testing patterns for Angular v21+ using Vitest with TestBed via @angular/build:unit-test builder for components, services, directives, and pipes'
applyTo: '**/*.spec.ts'
---

# Angular Testing Guidelines (Vitest + Angular TestBed, v21+)

> **Scope:** Unit testing patterns for components, services, directives, and pipes using Vitest + Angular TestBed. This file does NOT cover: NgRx Signal Store testing (`ngrx-signals-testing.instructions.md`), component architecture or DI (`angular.instructions.md`), DDD layering or naming (`architecture.instructions.md`), or TypeScript typing/formatting (`typescript.instructions.md`).
>
> **Structure:** §1 Forbidden patterns → §2 Decision table → §3–§6 Test patterns by type (service, component, directive, pipe) → §7 DOM & change detection → §8 Mocking → §9 Routing.

> **Note:** Comments inside code blocks in this file are instructional annotations for context only. Do not reproduce them in any code — this project forbids inline code comments and JSDoc in all code (see `typescript.instructions.md` §10).

---

## 1. Forbidden Patterns

These patterns MUST NOT appear in any generated or modified test code.

### Test Runner & Framework

- ❌ Jasmine spies (`jasmine.createSpy`, `spyOn` from jasmine) — use `vi.fn()` and `vi.spyOn()`
- ❌ Jest globals or matchers (`jest.fn`, `jest.mock`) — use Vitest equivalents
- ❌ Karma test runner — use Vitest via `@angular/build:unit-test`
- ❌ Importing runtime globals (`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`) from `'vitest'` — pre-configured as globals via `"types": ["vitest/globals"]` in `tsconfig.spec.json`; type-only imports (`import { type Mocked } from 'vitest'`) are still required for utility types

### Zone.js & Change Detection

- ❌ `fakeAsync` / `tick` / `flush` from `@angular/core/testing` — zone.js is not installed; use `vi.useFakeTimers()` and `vi.runAllTimersAsync()`
- ❌ `provideZonelessChangeDetection()` in test providers — zoneless is the default in Angular v21; adding it is redundant
- ❌ `fixture.detectChanges()` as the primary change detection trigger — use `await fixture.whenStable()`

### Typing & Mocking

- ❌ `any` in mocks, stubs, or test fixtures — use `Mocked<T>` from `vitest` or explicit interfaces
- ❌ Untyped mock objects (`{ method: vi.fn() }` without type annotation) — use `Mocked<T>` for type-safe stubs
- ❌ `provideHttpClient()` in test providers — use `provideHttpClientTesting()` only (see `angular.instructions.md` §12)

### Inputs & State

- ❌ `component.myInput.set(value)` for signal inputs — inputs are read-only externally; use `fixture.componentRef.setInput('myInput', value)`
- ❌ Deep imports in test files — import from library barrels only (see `typescript.instructions.md` §3)

---

## 2. Test Pattern Decision Table

| Need                                             | Pattern                                                                | Why                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| Trigger change detection after state change      | `await fixture.whenStable()`                                           | Zoneless-compatible; waits for all pending async tasks          |
| Set a signal `input()` on a component under test | `fixture.componentRef.setInput('name', value)`                         | Signal inputs are read-only externally                          |
| Set a `model()` or local `signal()`              | `component.value.set(v)` or `component.value.update(fn)`               | Writable signals allow direct mutation                          |
| Mock a service dependency                        | `Mocked<T>` stub + `{ provide: T, useValue: stub }`                    | Type-safe, no `any`                                             |
| Spy on a method call                             | `vi.spyOn(instance, 'method')`                                         | Non-destructive — preserves original unless overridden          |
| Mock an entire module                            | `vi.mock('./path')`                                                    | Hoisted to top of file; replaces all exports                    |
| Test time-dependent logic                        | `vi.useFakeTimers()` / `vi.runAllTimersAsync()` / `vi.useRealTimers()` | Controls `setTimeout`, `Promise` timing without zone.js         |
| Provide routing context                          | `provideRouter([])` in test providers                                  | Satisfies `ActivatedRoute`, `Router`, `RouterLink` dependencies |
| Test HTTP services                               | `provideHttpClientTesting()` + `HttpTestingController`                 | No real network calls; verify request/response pairs            |

Rules:

- Follow the AAA pattern (Arrange, Act, Assert) in every test
- Use clear, descriptive `it(...)` descriptions that state the expected behaviour
- Group related tests with `describe` blocks
- Co-locate test files next to the source: `task-list.component.spec.ts` beside `task-list.component.ts`

---

## 3. Service Testing

```typescript
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { TaskApiService } from './task-api.service';
import { Task } from './models/task.model';

describe('TaskApiService', () => {
  let service: TaskApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskApiService, provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch tasks from the API', () => {
    let result: Task[] | undefined;
    service.getTasks().subscribe((tasks) => (result = tasks));

    const req = httpMock.expectOne('/api/tasks');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1' }, { id: '2' }]);

    expect(result).toHaveLength(2);
  });
});
```

Rules:

- Use `provideHttpClientTesting()` only — `provideHttpClient()` is not needed in Angular v21 tests
- Call `httpMock.verify()` in `afterEach` to catch unexpected requests
- Non-HTTP services with `providedIn: 'root'` need only `TestBed.inject(MyService)` — no `configureTestingModule` required

---

## 4. Component Testing

### Basic Component with Service Dependency

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { type Mocked } from 'vitest';
import { of } from 'rxjs';

import { TaskListComponent } from './task-list.component';
import { TaskApiService } from '../infrastructure/task-api.service';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let serviceMock: Mocked<TaskApiService>;

  beforeEach(async () => {
    serviceMock = {
      getTasks: vi.fn(),
      createTask: vi.fn(),
    } as Mocked<TaskApiService>;

    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [{ provide: TaskApiService, useValue: serviceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display task count after loading', async () => {
    serviceMock.getTasks.mockReturnValue(of([{ id: '1', title: 'Test' }]));
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(
      el.querySelector('[data-testid="task-count"]')?.textContent,
    ).toContain('1');
  });
});
```

### Testing Signal Inputs

**Prefer** — `setInput` for signal inputs:

```typescript
fixture.componentRef.setInput('userId', '42');
await fixture.whenStable();
```

**Avoid** — directly calling `.set()` on an input signal (read-only externally):

```typescript
component.userId.set('42');
```

Full example:

```typescript
it('should display the provided user name', async () => {
  fixture.componentRef.setInput('userName', 'Alice');
  await fixture.whenStable();

  const el = fixture.nativeElement as HTMLElement;
  expect(el.querySelector('h2')?.textContent).toContain('Alice');
});
```

### Testing Outputs

```typescript
it('should emit when save button is clicked', () => {
  const spy = vi.fn();
  component.saved.subscribe(spy);

  const btn = fixture.nativeElement.querySelector(
    '[data-testid="save-btn"]',
  ) as HTMLElement;
  btn.click();

  expect(spy).toHaveBeenCalledOnce();
});
```

Rules:

- Use `Mocked<T>` from `vitest` for all service stubs — ensures type safety
- Use `fixture.componentRef.setInput()` to set `input()` signals
- Use `.set()` / `.update()` only for `model()` and local `signal()` properties
- Use `await fixture.whenStable()` after state changes before DOM assertions
- Query DOM via `fixture.nativeElement as HTMLElement` + `querySelector` / `querySelectorAll`
- Prefer `[data-testid="..."]` selectors over CSS class or tag selectors for resilience

---

## 5. Directive Testing

Test directives with a minimal test host component.

```typescript
import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { HighlightDirective } from './highlight.directive';

@Component({
  imports: [HighlightDirective],
  template: '<div appHighlight>Test</div>',
})
class TestHostComponent {}

describe('HighlightDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
  });

  it('should add highlighted class on mouseenter', async () => {
    await fixture.whenStable();

    const el = fixture.nativeElement.querySelector(
      '[appHighlight]',
    ) as HTMLElement;
    el.dispatchEvent(new Event('mouseenter'));
    await fixture.whenStable();

    expect(el.classList.contains('highlighted')).toBe(true);
  });
});
```

Rules:

- Always use a test host component to test directives — never instantiate directives directly
- The test host should be minimal — only enough template to exercise the directive
- The test host is standalone by default (Angular v21) — do not set `standalone: true`

---

## 6. Pipe Testing

Pipes are pure functions — test them with minimal setup.

```typescript
import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('should truncate long strings', () => {
    expect(pipe.transform('Hello World', 5)).toBe('Hello…');
  });

  it('should return short strings unchanged', () => {
    expect(pipe.transform('Hi', 5)).toBe('Hi');
  });
});
```

Rules:

- Pure pipes need no TestBed — instantiate directly with `new`
- Only use TestBed for pipes that inject dependencies via `inject()`

---

## 7. DOM Interaction & Change Detection

### Primary Pattern: `whenStable()`

```typescript
it('should update DOM after signal change', async () => {
  component.title.set('Updated');
  await fixture.whenStable();

  const el = fixture.nativeElement as HTMLElement;
  expect(el.querySelector('h1')?.textContent).toContain('Updated');
});
```

### User Input Simulation

```typescript
it('should update on user input', async () => {
  const input = fixture.nativeElement.querySelector(
    'input',
  ) as HTMLInputElement;
  input.value = 'new value';
  input.dispatchEvent(new Event('input'));
  await fixture.whenStable();

  expect(component.searchQuery()).toBe('new value');
});
```

### Click Events

**Prefer** — native element click:

```typescript
const btn = fixture.nativeElement.querySelector(
  '[data-testid="submit"]',
) as HTMLElement;
btn.click();
await fixture.whenStable();
```

**Avoid** — `triggerEventHandler` on `DebugElement` for simple clicks:

```typescript
const btn = fixture.debugElement.query(By.css('button'));
btn.triggerEventHandler('click', null);
fixture.detectChanges();
```

Rules:

- Always `await fixture.whenStable()` after state changes before reading the DOM
- Use `dispatchEvent(new Event('input'))` to notify Angular of native input value changes
- Use native `.click()` for button clicks; use `dispatchEvent` for custom DOM events
- Cast `fixture.nativeElement` to `HTMLElement` for type-safe DOM access

---

## 8. Mocking & Test Doubles

### Type-Safe Stubs with `Mocked<T>`

```typescript
import { type Mocked } from 'vitest';
import { of } from 'rxjs';

import { UserApiService } from './user-api.service';

const serviceMock: Mocked<UserApiService> = {
  getUser: vi.fn(),
  updateUser: vi.fn(),
};

serviceMock.getUser.mockReturnValue(of({ id: '1', name: 'Alice' }));
```

### Spying on Existing Methods

```typescript
const service = TestBed.inject(TaskApiService);
vi.spyOn(service, 'getTasks').mockReturnValue(of([]));
```

### Fake Timers

```typescript
it('should debounce search input', async () => {
  vi.useFakeTimers();

  component.onSearchInput('query');
  await vi.advanceTimersByTimeAsync(300);
  await fixture.whenStable();

  expect(serviceMock.search).toHaveBeenCalledWith('query');

  vi.useRealTimers();
});
```

Rules:

- Always type stubs with `Mocked<T>` — never use `any` or untyped object literals
- Reset mocks in `beforeEach` with `vi.clearAllMocks()` or `.mockReset()` when stubs are shared across tests
- Always call `vi.useRealTimers()` after `vi.useFakeTimers()` to clean up
- Prefer `vi.spyOn()` when you only need to observe or override a single method

---

## 9. Routing Dependencies

Components that use `RouterLink`, `RouterOutlet`, or inject `ActivatedRoute` / `Router` require routing context in tests.

```typescript
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
  });

  it('should render navigation links', async () => {
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('a[href]').length).toBeGreaterThan(0);
  });
});
```

Rules:

- Use `provideRouter([])` with an empty routes array to satisfy all routing dependencies
- For route parameter testing, provide actual route configs and use `RouterTestingHarness`
