# Portfolio Monorepo

The source of [Shaun Vercauteren's](https://github.com/Exaltence) personal portfolio — a zoneless
Angular 22 single-page site built as an Nx monorepo with a domain-driven library layout.

**Live:** <https://exaltence.github.io/>

There is no backend. All content is served as static JSON from `apps/portfolio/public/content/` and
read through `httpResource()`, which keeps the site deployable to GitHub Pages while leaving the data
layer shaped the way a real API-backed application would be.

## Stack

| Layer      | Technology                                                | Version |
| ---------- | --------------------------------------------------------- | ------- |
| Monorepo   | Nx                                                        | 23.x    |
| Framework  | Angular (standalone, signals, zoneless)                   | 22.x    |
| State      | NgRx Signal Store                                         | 21.x    |
| Language   | TypeScript strict mode                                    | 6.x     |
| Unit tests | Vitest + Angular TestBed                                  | 4.x     |
| E2E        | Playwright (chromium, firefox, webkit)                    | 1.60.x  |
| Styling    | SCSS with BEM, enforced by Stylelint                      | —       |
| Linting    | ESLint flat config + angular-eslint + @ngrx/eslint-plugin | 9.x     |
| Git hooks  | Lefthook                                                  | 2.x     |

## Architecture

Libraries are organised by domain and by type, and the dependency direction is enforced at lint time
by `@nx/enforce-module-boundaries`:

```
app → feature → ui → data → util
```

| Project                           | Path                                    | Tags                               |
| --------------------------------- | --------------------------------------- | ---------------------------------- |
| `portfolio`                       | `apps/portfolio/`                       | `domain:portfolio`, `type:app`     |
| `portfolio-e2e`                   | `apps/portfolio-e2e/`                   | `domain:portfolio`, `type:e2e`     |
| `portfolio-feature-about`         | `libs/portfolio/feature/about/`         | `domain:portfolio`, `type:feature` |
| `portfolio-feature-projects`      | `libs/portfolio/feature/projects/`      | `domain:portfolio`, `type:feature` |
| `portfolio-feature-profile-panel` | `libs/portfolio/feature/profile-panel/` | `domain:portfolio`, `type:feature` |
| `portfolio-ui`                    | `libs/portfolio/ui/`                    | `domain:portfolio`, `type:ui`      |
| `portfolio-data`                  | `libs/portfolio/data/`                  | `domain:portfolio`, `type:data`    |
| `portfolio-util`                  | `libs/portfolio/util/`                  | `domain:portfolio`, `type:util`    |
| `shared-ui`                       | `libs/shared/ui/`                       | `domain:shared`, `type:ui`         |
| `shared-data`                     | `libs/shared/data/`                     | `domain:shared`, `type:data`       |
| `shared-util`                     | `libs/shared/util/`                     | `domain:shared`, `type:util`       |
| `test-portfolio-e2e`              | `libs/test/portfolio-e2e/`              | `domain:portfolio`, `type:test`    |

Every library exposes its public surface through an `src/index.ts` barrel; deep imports are blocked by
lint. Each library has its own README naming its responsibility and import path.

Conventions live in [AGENTS.md](AGENTS.md), with per-topic detail in
[.github/instructions/](.github/instructions/).

## Commands

```sh
npm exec nx run portfolio:serve             # dev server on :4200
npm exec nx run portfolio:build             # production bundle
npm exec nx run-many --target=test          # unit tests, all projects
npm exec nx run-many --target=lint          # ESLint
npm exec nx run-many --target=stylelint     # SCSS — a separate target, not part of lint
npm exec nx run portfolio-e2e:e2e           # Playwright
npm exec nx affected --target=test          # affected only
npm exec nx graph                           # explore the project graph
```

Package manager is **npm only** — never pnpm or yarn.

## Local developer setup

After cloning, run the following to install dependencies and activate git hooks:

```sh
npm install
```

The `prepare` script runs automatically and installs the Lefthook git hooks (pre-commit, commit-msg, pre-push).

### Commit conventions

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/).
See [.github/guidelines/commit-convention.md](.github/guidelines/commit-convention.md) for full rules and examples.

### Branch naming

Branches must match one of these patterns:

- `main`
- `develop`
- `feature/<slug>`
- `fix/<slug>`
- `hotfix/<slug>`
- `release/<slug>`
- `chore/<slug>`
- `docs/<slug>`

(Where slug is `[a-z0-9._-]+`.)

### Creating a release

```sh
# Preview the next release (no changes made)
npx nx release --dry-run --first-release   # first release only
npx nx release --dry-run                   # subsequent releases

# Execute the release
npx nx release --first-release   # first release only
npx nx release                   # subsequent releases
```

## GitHub Pages deployment

The portfolio is automatically deployed to GitHub Pages on every push to `main` via the `.github/workflows/deploy-pages.yml` workflow.

Live URL: `https://exaltence.github.io/`
