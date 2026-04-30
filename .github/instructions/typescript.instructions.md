---
description: 'TypeScript coding standards including strict typing, formatting rules, naming conventions, error handling, and testing patterns'
applyTo: '**/*.ts'
---

> **Note:** Comments inside code blocks in this file are instructional annotations for context only. Do not reproduce them in generated code — see Section 10.

## 1. Core Principles

- **Strong Typing:**
  - Always use explicit types, interfaces, and generics.
  - Avoid `any` and implicit `any`. Prefer `unknown` when the type is genuinely unknown.
  - Use type inference where safe, but be explicit for public APIs.

  ```typescript
  interface User {
    id: string;
    name: string;
  }

  function getUser(id: string): User {
    /* ... */
  }
  ```

- **Strict Mode:**
  All projects enforce the following compiler options:

  ```json
  {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true
  }
  ```

  Angular compiler options also enforced: `strictInjectionParameters`, `strictInputAccessModifiers`, `strictTemplates`.

- **Single Responsibility:** Each file, class, or function has one well-defined purpose.

- **Rule of One:** Each file defines only one entity (component, service, model, etc.).

- **Naming:**
  - Types and interfaces: `PascalCase` (e.g., `UserProfile`)
  - Variables and functions: `camelCase` (e.g., `getUserProfile`)
  - Constants: `UPPER_CASE` (e.g., `MAX_RETRIES`)

  > Angular-specific suffixes (`Component`, `Service`, `Directive`, `Pipe`) are defined in `angular.instructions.md`.

## 2. TypeScript Patterns

- **`interface` vs `type`:**
  Use `interface` for object shapes — it is extendable and idiomatic. Use `type` for unions, intersections, tuple aliases, and primitive aliases.

  ```typescript
  interface Task {
    id: string;
    title: string;
  }

  type Status = 'pending' | 'active' | 'done';
  ```

- **Unions over enums:**
  Prefer string literal unions. Enums generate runtime code and have structural typing footguns.

  ```typescript
  // Prefer
  type Direction = 'left' | 'right' | 'up' | 'down';

  // Avoid
  enum Direction {
    Left,
    Right,
    Up,
    Down,
  }
  ```

- **`readonly`:**
  Mark properties that must not be mutated after construction. Use `readonly T[]` for immutable arrays.

  ```typescript
  interface Config {
    readonly apiUrl: string;
    readonly allowedRoles: readonly string[];
  }
  ```

- **`as const`:**
  Use for literal narrowing on fixed-value config objects and tuples.

  ```typescript
  const ROUTES = ['home', 'about', 'contact'] as const;
  type Route = (typeof ROUTES)[number];
  ```

- **Generics:**
  Always constrain type parameters with `extends` when the shape is known. Do not add type parameters that are not referenced in the return type or a second parameter — unused generics add noise without safety.

  ```typescript
  // Constrained — preferred
  function getProperty<T extends object, K extends keyof T>(
    obj: T,
    key: K,
  ): T[K] {
    return obj[key];
  }

  // Unconstrained with no return-type value — avoid
  function logValue<T>(value: T): void {
    console.log(value);
  }
  // Prefer: function logValue(value: unknown): void
  ```

- **Error typing in `catch`:**
  With `strict: true`, caught errors are typed as `unknown`. Always narrow before use; never cast to `any`. Always handle the non-`Error` case — never silently swallow it.

  ```typescript
  try {
    await fetchData();
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    throw error;
  }
  ```

## 3. Module Exports

Every library exposes its public API exclusively through `src/index.ts`. Deep imports into `lib/` internals bypass Nx module boundaries and are forbidden.

```typescript
// Allowed — public API via index
import { TaskStore } from '@portfolio-monorepo/portfolio/data';

// Forbidden — deep import bypassing module boundary
import { TaskStore } from '@portfolio-monorepo/portfolio/data/src/lib/state/task.store';
```

## 4. Formatting

- **Tab width:** 2 spaces
- **Print width:** 80 characters
- **Semicolons:** Always
- **Quotes:** Single for TypeScript; double for HTML
- **Trailing commas:** All
- **Bracket spacing:** Spaces inside object brackets
- **Arrow parens:** Always
- **End of line:** LF

```typescript
const users: User[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

const getUser = (id: string): User | undefined => {
  return users.find((u) => u.id === id);
};
```

## 5. Linting

Code must pass all checks from the active rule sets before committing:

- `@eslint/js` (recommended)
- `typescript-eslint` (recommended + stylistic)
- `@nx/enforce-module-boundaries` — enforces domain and type tag boundaries
- `eslint-config-prettier` — disables rules that conflict with Prettier

App-level configs extend the base with additional rule sets:

- `angular-eslint` — Angular template and component rules (via `@nx/eslint-plugin` Angular configs)
- `@ngrx/eslint-plugin` — Signal Store and operators rules (`ngrx.configs.signals`, `ngrx.configs.operators`)

## 6. File Size

- Maximum 400 lines per file
- Split by responsibility when approaching the limit

## 7. Error Handling

```typescript
async function fetchData(): Promise<Data> {
  try {
    const response = await api.get<Data>('/data');
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`fetchData failed: ${error.message}`);
    }
    throw error;
  }
}
```

- Always narrow `unknown` before use; never silently swallow errors — log or rethrow

## 8. Testing

Scope: TypeScript-level concerns only. Angular TestBed configuration patterns and NgRx store testing belong in their respective instruction files.

- No `any` in mocks, fixtures, or test helpers — use strongly typed alternatives
- Use `ComponentFixture<T>` for typed component fixtures
- Use the AAA pattern (Arrange, Act, Assert)
- Test descriptions must be explicit about the expected behaviour

```typescript
describe('MyComponent', () => {
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MyComponent);
    await fixture.whenStable();
  });

  it('should display the title', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Expected');
  });
});
```

- Pure functions: use AAA pattern (Arrange, Act, Assert) — no TestBed needed

## 9. No Sensitive Data

Never include sensitive data (API keys, secrets, credentials) in client-side code.

## 10. Code Comments and JSDoc

Do not use inline code comments or JSDoc in TypeScript code. Use clear naming, structure, and these guidelines instead. If documentation is needed, use external markdown files.
