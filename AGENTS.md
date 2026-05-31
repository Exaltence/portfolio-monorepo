<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

---

# Project Conventions

Portfolio monorepo — digital showcase of work and skills for employers/clients.

## Commands

| Task                 | Command                                             |
| -------------------- | --------------------------------------------------- |
| Serve app            | `npm exec nx run portfolio:serve`                   |
| Build app            | `npm exec nx run portfolio:build`                   |
| Unit tests (all)     | `npm exec nx run-many --target=test`                |
| Unit tests (project) | `npm exec nx run portfolio:test`                    |
| E2E                  | `npm exec nx run portfolio-e2e:e2e`                 |
| Lint (all)           | `npm exec nx run-many --target=lint`                |
| Affected only        | `npm exec nx affected --target=<test\|lint\|build>` |

Package manager: **npm only**. Never use pnpm/yarn/npx. Always route through `nx`.

## Stack

| Layer      | Technology                                                | Version |
| ---------- | --------------------------------------------------------- | ------- |
| Monorepo   | Nx                                                        | 22.x    |
| Framework  | Angular (standalone, signals, `@if`/`@for`/`@switch`)     | 21.x    |
| State      | NgRx Signal Store                                         | 21.x    |
| Language   | TypeScript strict mode                                    | 5.9.x   |
| Unit tests | Vitest + Angular TestBed (via `@nx/angular:unit-test`)    | 4.x     |
| E2E        | Playwright                                                | 1.60.x  |
| Styling    | SCSS (component + global)                                 | —       |
| Linting    | ESLint flat config + angular-eslint + @ngrx/eslint-plugin | 9.x     |
| Formatting | Prettier                                                  | 3.x     |
| Git hooks  | Lefthook (pre-commit: format + lint + test)               | 2.x     |

**NOT installed:** Angular Material, ng-mocks, json-server, ZoneJS.

## Architecture (Nx + DDD)

### Project layout

```
apps/
  portfolio/          # Thin shell: routes, shell components (navbar, sidebar, home, not-found), app config
  portfolio-e2e/      # Playwright specs
libs/
  <domain>/           # e.g., portfolio/, shared/
    feature/<name>/   # Smart container components (route-level). Separate Nx lib per feature.
    ui/<name>/        # Presentational components. Separate Nx lib per component/group.
    data/             # Single Nx lib: models/, infrastructure/ (HTTP), state/ (Signal Stores)
    util/             # Single Nx lib: pure helper functions
  tests/
    portfolio-e2e/    # Shared e2e page objects & helpers
```

### Dependency rules (enforced by `@nx/enforce-module-boundaries`)

**Type axis (top-down only):**
`app → feature → ui → data → util`

**Domain axis:**
`domain:portfolio → domain:portfolio | domain:shared`
`domain:shared → domain:shared`

### Tags (assign on every new project)

| Tag                | Applies to                      |
| ------------------ | ------------------------------- |
| `type:app`         | `apps/<name>/` (non-e2e)        |
| `type:e2e`         | `apps/<name>-e2e/`              |
| `type:test`        | `libs/tests/`                   |
| `type:feature`     | `libs/<domain>/feature/<name>/` |
| `type:ui`          | `libs/<domain>/ui/<name>/`      |
| `type:data`        | `libs/<domain>/data/`           |
| `type:util`        | `libs/<domain>/util/`           |
| `domain:portfolio` | All portfolio app + libs        |
| `domain:shared`    | All shared libs                 |

### Import paths

```typescript
// Correct — barrel import
import { TaskStore } from '@portfolio-monorepo/portfolio/data';

// Forbidden — deep import
import { TaskStore } from '@portfolio-monorepo/portfolio/data/src/lib/state/task.store';
```

## Conventions

### Components & DI

- Standalone only. No NgModules. No `standalone: true` (redundant since v19).
- `ChangeDetectionStrategy.OnPush` on ALL components.
- External templates (`.component.html`) and styles (`.component.scss`) always.
- `inject()` function for DI. No constructor injection.
- Selector prefix: `app` for `apps/portfolio/`.

### Signals & Reactivity

- Signals are the primary reactivity model: `input()`, `output()`, `model()`, `computed()`, `linkedSignal()`, `signal()`.
- `httpResource()` for reactive GET data fetching (in `data/` libs only).
- `HttpClient` for mutations (POST/PUT/DELETE) only.
- RxJS limited to: `rxMethod()` in stores, `toSignal()` at boundaries.
- Forbidden: `subscribe()` in components, `async` pipe, `ngOnChanges`.

### TypeScript

- No `any` — use `unknown`.
- Explicit return types on exported/public functions.
- `interface` for object shapes; `type` for unions/intersections.
- String literal unions over enums.
- `readonly` for immutable properties.

### File naming

- `kebab-case` with type suffix: `task-card.component.ts`, `task-api.service.ts`, `task.store.ts`, `task.model.ts`, `date.util.ts`
- Test files: `*.spec.ts` co-located with source.
- One entity per file.

### Testing

- Vitest globals (no imports for `describe`, `it`, `expect`, `vi`).
- `await fixture.whenStable()` for change detection (zoneless — no `fakeAsync`/`tick`).
- `fixture.componentRef.setInput('name', value)` for signal inputs.
- `vi.fn()` / `vi.spyOn()` for mocking. No Jasmine/Jest APIs.
- `provideHttpClientTesting()` only (no `provideHttpClient()` in tests).

### Git & Quality

- Lefthook pre-commit: Prettier + ESLint auto-fix + unit tests. Do not bypass (`--no-verify`).
- Commit format: Conventional Commits (enforced by Commitlint).
- No inline code comments or JSDoc unless explicitly requested.

## Detailed Guidance

Auto-applied instruction files in `.github/instructions/` (resolved by `applyTo` globs):

| File                                   | Scope                                  |
| -------------------------------------- | -------------------------------------- |
| `architecture.instructions.md`         | DDD layout, naming, boundaries         |
| `angular.instructions.md`              | Component patterns, DI, forbidden APIs |
| `angular-testing.instructions.md`      | Vitest + TestBed patterns              |
| `ngrx-signals.instructions.md`         | Signal Store creation & methods        |
| `ngrx-signals-testing.instructions.md` | Store testing                          |
| `typescript.instructions.md`           | Typing, modules, formatting            |
| `techstack.instructions.md`            | Full version reference                 |
