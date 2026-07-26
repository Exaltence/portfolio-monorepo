---
description: 'Complete tech stack reference: tools, versions, and roles for the portfolio monorepo'
applyTo: '**'
---

# Tech Stack

> Reference only — no behavioral rules. See domain-specific instruction files for patterns and constraints.

## Core

### Platform

- **Monorepo:** Nx — workspace management, code generation, caching, and task orchestration
- **Framework:** Angular v22 — standalone components, signals, built-in control flow (`@if`, `@for`, `@switch`); `OnPush` is the implicit default change detection; zoneless; no NgModules
- **Language:** TypeScript — strict mode
- **Dependency Injection:** `inject()` for DI; `@Service()` decorator for tree-shakeable root singletons; `injectAsync()` for lazy on-demand services

### Data & Reactivity

- **State Management:** NgRx Signal Store — signal-based reactive state
- **Forms:** Angular Signal Forms (`@angular/forms/signals`) — stable in v22; signal-based, type-safe field access, schema-based validation
- **HTTP / Async:** `httpResource()` / `resource()` / `rxResource()` — stable in v22; native signal-based reactive reads; `HttpClient` for mutations (POST/PUT/DELETE)
- **Reactivity:** Angular Signals as the primary reactivity model; RxJS at integration boundaries only

### Rendering

- **Client rendering:** Hash-based SPA deployed to GitHub Pages — no SSR active
- **Hydration (reference only):** `provideClientHydration()` enables incremental hydration + automatic event replay by default in v22; not exercised by the current client-only SPA deployment

### Styling

- **Styling:** SCSS — component and global styles

## Testing

- **Unit:** Vitest via `@nx/angular:unit-test`, Angular TestBed, jsdom
- **E2E:** Playwright with Nx AI Test Agents (planner, generator, healer)

## Build & Tooling

- **Build:** `@angular/build` (esbuild-based); SWC for fast TS transpilation in test runs
- **Package Manager:** npm
- **Linting:** ESLint (flat config) with `angular-eslint`, `typescript-eslint`, and `@ngrx/eslint-plugin`
- **Formatting:** Prettier — enforced across all file types
- **SCSS Linting:** Stylelint with `stylelint-config-standard-scss`
- **Git Hooks:** Lefthook — pre-commit: Prettier + ESLint auto-fix + unit tests; commit-msg: Commitlint; pre-push: lint + build + e2e
- **Commits:** Commitlint with `@commitlint/config-conventional`
- **CI/CD:** GitHub Actions
- **Deployment:** GitHub Pages with hash-based routing

## Version Reference

| Tool         | Version |
| ------------ | ------- |
| Angular      | 22.x    |
| Nx           | 23.x    |
| TypeScript   | 6.x     |
| NgRx Signals | 21.x    |
| RxJS         | 7.8.x   |
| Vitest       | 4.x     |
| Playwright   | 1.60.x  |
| ESLint       | 9.x     |
| Prettier     | 3.x     |
| Stylelint    | 17.x    |
| Lefthook     | 2.x     |
| jsdom        | 27.x    |
| SWC          | 1.x     |
