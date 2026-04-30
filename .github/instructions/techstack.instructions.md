---
description: 'Complete tech stack reference: tools, versions, and roles for the portfolio monorepo'
applyTo: '**'
---

# Tech Stack

> Reference only — no behavioral rules. See domain-specific instruction files for patterns and constraints.

## Core

- **Monorepo:** Nx — workspace management, code generation, caching, and task orchestration
- **Framework:** Angular — standalone components, signals, modern control flow; no NgModules
- **Language:** TypeScript — strict mode
- **State Management:** NgRx Signal Store — signal-based reactive state
- **Forms:** Angular Signal Forms (`@angular/forms/signals`) — schema-based validation
- **HTTP / Async:** Angular resource API for reactive data fetching; `HttpClient` for mutations
- **Reactivity:** Angular Signals as the primary reactivity model; RxJS at integration boundaries only
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
| Angular      | 21.x    |
| Nx           | 22.x    |
| TypeScript   | 5.9.x   |
| NgRx Signals | 21.x    |
| RxJS         | 7.8.x   |
| Vitest       | 4.x     |
| Playwright   | 1.59.x  |
| ESLint       | 9.x     |
| Prettier     | 3.x     |
| Stylelint    | 17.x    |
| Lefthook     | 2.x     |
| jsdom        | 27.x    |
| SWC          | 1.x     |
