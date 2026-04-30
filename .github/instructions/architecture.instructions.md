---
description: 'Nx monorepo structure with DDD-based structure with domain folders, feature/ui/data/util organization, module boundaries, naming conventions, and component subfolder requirements'
applyTo: '**'
---

# Architecture

This project follows a Domain-Driven Design (DDD) approach for modularity, maintainability, and scalability.

## 1. Naming Conventions

> **Note:** For complete naming guidelines including identifiers, selectors, and patterns, see `angular.instructions.md`

### File Naming

- Use kebab-case with type suffixes:
  - ✅ `user-profile.component.ts`, `task.service.ts`, `date.util.ts`, `task.model.ts`
  - ❌ `user-profile.ts`, `task-api.ts`, `highlight.ts`
- Match file names to class names: `UserProfileComponent` → `user-profile.component.ts`
- Related files share the same base name:

  ```
  user-profile/
    user-profile.component.ts
    user-profile.component.html
    user-profile.component.scss
    user-profile.component.spec.ts
  ```

- Test files: `.spec` suffix. Playwright page objects: `.page` suffix.

### Class Naming

- Use `PascalCase` WITH type suffixes:
  - ✅ `UserProfileComponent`, `TaskApiService`, `HighlightDirective`, `DateFormatPipe`
  - ❌ `UserProfile`, `TaskApi`, `Highlight`, `DateFormat`
- **Exception:** `util` files export plain functions, not classes. No `DateFormatUtil` class — just exported functions in a `.util.ts` file.

## 2. DDD Structure

Each domain (`libs/<domain>/`) is divided into `feature/`, `ui/`, `data/`, `util/` layers with strict responsibilities.

- **Domains:**
  - Business domains live under `libs/<domain>/` (e.g., `libs/portfolio/`, `libs/shared/`).
  - Each domain contains subfolders for different layers: `feature/`, `ui/`, `data/`, `util/`.
  - `libs/tests/` houses reusable e2e helpers and page objects (no spec files). Libs here carry `type:test` and the **same domain tag as the app they support** (e.g. `domain:portfolio` for `libs/tests/portfolio-e2e/`). Spec files remain in the e2e app (`apps/portfolio-e2e/src/`). This ensures domain constraints isolate each e2e lib to only the project it belongs to.

- **Layered Folders (per domain):**
  - `feature/`: Smart container components (route-level), orchestrating domain logic and UI. They inject stores and pass data to `ui/` components.
  - `ui/`: Presentational ("dumb") components, directives, and pipes. OnPush, signal inputs/outputs only, no store/service injection.
  - `data/`: Data access layer — `models/` (interfaces/types), `infrastructure/` (HTTP clients), `state/` (NgRx Signal Stores).
  - `util/`: Pure helper functions specific to the domain.

- **Component, Directive, and Pipe Subfolders:**
  - All components, directives, pipes, and services must be placed in their own subfolders named after the construct.
  - Example: A component named `task-list.component.ts` is located at `libs/portfolio/feature/task-list/task-list.component.ts`, not directly in the `feature/` folder.

- **Lib granularity:** `feature/` and `ui/` each contain multiple Nx libs — one per component or group. `data/` and `util/` are each a **single Nx lib per domain**, containing all models, infrastructure, state, or helpers for that domain respectively.

- **Application shell:** `apps/` is an intentionally thin shell. It houses only routes, shell components (e.g. `navbar`, `sidebar`, `home`, `not-found`), and app configuration. No local data access or business logic — all domain logic lives in `libs/`.

- **Cross-domain code:**
  - App-wide infrastructure (layout, themes, app-level services, app-level components, app-level utilities) lives in `libs/shared/`.
  - Promote shared code into `libs/shared/` only when it is truly used by multiple domains.

## 3. Nx Dependency Constraints

Module boundaries enforced via `@nx/enforce-module-boundaries` using two tag dimensions: `type:*` and `domain:*`.

### Type constraints

| Type           | Can Depend On                                       |
| -------------- | --------------------------------------------------- |
| `type:app`     | `type:feature`, `type:ui`, `type:data`, `type:util` |
| `type:e2e`     | `type:test`                                         |
| `type:feature` | `type:ui`, `type:data`, `type:util`                 |
| `type:ui`      | `type:data`, `type:util`                            |
| `type:data`    | `type:util`                                         |
| `type:util`    | `type:util`                                         |
| `type:test`    | `type:test`                                         |

### Domain constraints

| Domain             | Can Depend On                       |
| ------------------ | ----------------------------------- |
| `domain:shared`    | `domain:shared`                     |
| `domain:portfolio` | `domain:portfolio`, `domain:shared` |

Domain constraints prevent cross-domain pollution — `domain:portfolio` libs may use `domain:shared` libs, but never vice versa.

### Tag reference

| Tag                | Assigned to                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `type:app`         | Application projects under `apps/` (excluding e2e apps)                                                |
| `type:e2e`         | E2e application projects under `apps/` (e.g. `apps/portfolio-e2e/`)                                    |
| `type:test`        | Shared e2e helper libs under `libs/tests/`                                                             |
| `type:feature`     | Libs under `libs/<domain>/feature/`                                                                    |
| `type:ui`          | Libs under `libs/<domain>/ui/`                                                                         |
| `type:data`        | Libs under `libs/<domain>/data/`                                                                       |
| `type:util`        | Libs under `libs/<domain>/util/`                                                                       |
| `domain:portfolio` | `apps/portfolio/`, `apps/portfolio-e2e/`, libs under `libs/portfolio/` and `libs/tests/portfolio-e2e/` |
| `domain:shared`    | Libs under `libs/shared/`                                                                              |

## 4. Example Folder Structure

```text
apps/
  portfolio/
    src/
      app/
        app.component.ts
        app.component.html
        app.component.scss
        app.config.ts
        app.routes.ts
        home/
          home.component.ts
          home.component.html
          home.component.scss
          home.component.spec.ts
        navbar/
          navbar.component.ts
          navbar.component.html
          navbar.component.scss
        not-found/
          not-found.component.ts
          not-found.component.html
          not-found.component.scss
        sidebar/
          sidebar.component.ts
          sidebar.component.html
          sidebar.component.scss
  portfolio-e2e/
    playwright.config.ts
    src/
      home.spec.ts
      ...
  app-2/        # future app
    ...
libs/
  portfolio/
    data/
      src/
        index.ts
        lib/
          models/
            model-1.model.ts
            model-2.model.ts
            ...
          infrastructure/
            infrastructure-api-1.service.ts
            infrastructure-api-2.service.ts
            ...
          state/
            state.store.ts
    feature/
      feature-1/
        src/
          index.ts
          lib/
            feature-1/
              feature-1.component.ts
              feature-1.component.html
              feature-1.component.scss
              feature-1.component.spec.ts
      feature-2/
        ...
    ui/
      ui-1/
        src/
          index.ts
          lib/
            ui-1/
              ui-1.component.ts
              ui-1.component.html
              ui-1.component.scss
      ui-2/
        ...
    util/
      src/
        index.ts
        lib/
          util-1/
            util-1.util.ts
          util-2/
            ...
  shared/
    data/
      ...
    feature/
      feature-1/
        ...
      feature-2/
        ...
    ui/
      ui-1/
        ...
      ui-2/
        ...
    util/
      ...
  tests/
    portfolio-e2e/
      src/
        index.ts
        lib/
          helpers/
            helper-1.util.ts
            ...
          page-objects/
            home.page.ts
            ...
```

## 5. Key Principles

- **Feature Isolation:** Each domain is self-contained with its own features, UI, data, and utilities
- **Clear Boundaries:** Domains communicate through well-defined interfaces
- **Shared Code:** Only truly shared code lives in `libs/shared/`
- **Scalability:** The structure supports growth without reorganization
- **Discoverability:** Developers can easily find code by following the domain/layer/component pattern
