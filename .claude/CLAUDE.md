# CLAUDE.md

Guidance for Claude Code when working in this repository.

Nx monorepo for a personal portfolio site: Angular 22 (standalone, signals, zoneless), NgRx Signal Store, Vitest, Playwright. Static site, no backend — content is served as JSON from `apps/portfolio/public/content/`.

## Conventions live in AGENTS.md

**Read [AGENTS.md](../AGENTS.md) before writing code.** It is the authoritative source for stack versions, DDD layout, dependency rules, tags, and component/TypeScript/testing conventions. Deeper per-topic rules are in [.github/instructions/](../.github/instructions/) (`architecture`, `angular`, `angular-testing`, `ngrx-signals`, `ngrx-signals-testing`, `typescript`, `techstack`). Do not restate those rules here — update them in place instead.

Highest-priority rules, repeated because they are easy to violate:

- **npm only.** Never `pnpm`/`yarn`/`npx <tool>`. Route tasks through `npm exec nx ...`.
- No code comments or JSDoc unless explicitly requested.
- No `any`; no constructor injection; no `subscribe()` in components; no `async` pipe; no explicit `changeDetection`.
- Reuse existing patterns before creating new ones.

## Commands

```bash
npm exec nx run portfolio:serve            # dev server on :4200
npm exec nx run portfolio:build            # defaults to the production configuration
npm exec nx run-many --target=test         # Vitest, all projects
npm exec nx run portfolio-ui:test          # single project
npm exec nx run-many --target=lint         # ESLint
npm exec nx run-many --target=stylelint    # SCSS — separate target, NOT part of lint
npm exec nx run portfolio-e2e:e2e          # Playwright
npm exec nx affected --target=test         # affected only (defaultBase: main)
```

Root `package.json` scripts (`npm test`, `npm run lint`, …) are thin wrappers over the same targets.

## Projects

| Nx project                        | Path                                    | Tags                               |
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

Every new export must be added to the lib's `src/index.ts` barrel — deep imports are blocked by `@nx/enforce-module-boundaries` in [eslint.config.mjs](../eslint.config.mjs), which also encodes the type/domain dependency graph.

## Things that are easy to get wrong

**Content is static JSON.** Stores read it with `httpResource()` against a relative path — e.g. [projects.store.ts](../libs/portfolio/data/src/lib/state/projects.store.ts) fetches `'content/projects.json'`. Adding a content field means editing both the model in `libs/portfolio/data/src/lib/models/` and the JSON in `apps/portfolio/public/content/`. No leading slash — the app is deployed under a `baseHref`.

**Routing uses hash location** (`withHashLocation()` in [app.config.ts](../apps/portfolio/src/app/app.config.ts)) and the `github-pages` build configuration sets `baseHref: /portfolio-monorepo/`. Both exist for GitHub Pages hosting — don't "fix" them into path-based routing.

**SCSS is linted separately and enforces BEM.** [stylelint.config.mjs](../stylelint.config.mjs) rejects class names outside `block__element--modifier` kebab-case. `nx run-many --target=lint` will not catch this; run the `stylelint` target. Global partials live in [apps/portfolio/src/styles/](../apps/portfolio/src/styles/) (`_tokens`, `_base`, `_theme`, `_scrollbar`, `_motion`, `_overlay`) and are aggregated by `styles.scss`.

**Component style budget is 8kb (error) / 4kb (warning).** Large component SCSS fails the production build, not lint.

**Theming is a DOM class, not a CSS variable swap.** [theme.store.ts](../libs/shared/data/src/lib/state/theme.store.ts) toggles `.light` on `documentElement` and persists to `localStorage` under the `theme` key; dark is the default.

**`NX_WORKSPACE_ROOT_PATH` must stay empty.** Nx Console injects it with a lower-cased drive letter (`d:\...`), which makes Vitest resolve a second copy of the `vitest` package and fail with "Vitest failed to find the runner". It is neutralized in two places, because they cover different processes: [.vscode/settings.json](../.vscode/settings.json) (`terminal.integrated.env.windows`) for VS Code's integrated terminal, and `env` in [.claude/settings.json](settings.json) for Claude Code's tool subprocesses. Don't remove either, and don't "fix" the empty string into a real path.

**The dev server must bind dual-stack — `"host": "::"` on the `serve` target.** Left at the default it
listens on `::1` only. `localhost` resolves to both `::1` and `127.0.0.1`; Chromium falls back between
them, Firefox generally does not, so it draws an instant RST and e2e fails with
`NS_ERROR_CONNECTION_REFUSED` on roughly half of local runs. The failures look load-related because more
page loads mean more chances to pick IPv4, but load is not the cause. Don't remove the `host` entry, and
don't switch it to `0.0.0.0` — that is IPv4-only and just inverts the problem.

**Library `test` targets borrow the app's build.** Each lib's `project.json` sets `buildTarget: portfolio:build:development`, so a broken app build breaks lib tests too.

## MCP servers

Five servers are configured: `context7` (library docs, HTTP + OAuth), `angular-cli` (Angular 22 schematics/docs), `playwright-test` and `playwright` (browser driving and test authoring), and `eslint`.

They are declared **twice**, because the two clients read different files and neither supports indirection:

| File                                    | Client                  | Root key     |
| --------------------------------------- | ----------------------- | ------------ |
| [.mcp.json](../.mcp.json)               | Claude Code             | `mcpServers` |
| [.vscode/mcp.json](../.vscode/mcp.json) | VS Code / Copilot agent | `servers`    |

**Keep the two in sync** — the server entries are otherwise identical, so edit both or diff them. Project-scoped servers in `.mcp.json` require approval on first use; run `/mcp` to check connection status.

`angular-cli` and `playwright-test` resolve to the workspace's own devDependencies; `playwright`, `eslint`, and `nx-mcp` (the Nx MCP server referenced in [AGENTS.md](../AGENTS.md)) are fetched on demand via `--yes`. All use `npm exec` rather than `npx`, per the npm-only rule.

## Git workflow

Hooks are enforced by [lefthook.yml](../lefthook.yml) and must not be bypassed (`--no-verify`):

- **pre-commit** — Prettier `--write` and ESLint `--fix` on staged files (auto-restaged), then the full unit test suite.
- **commit-msg** — Commitlint. Conventional Commits per [.github/guidelines/commit-convention.md](../.github/guidelines/commit-convention.md); title ≤ 100 chars, lowercase description, no trailing period.
- **pre-push** — branch-name check, then lint, build, and e2e across all projects. This is slow; expect it.

Branch names must match `main`, `develop`, or `<feature|fix|hotfix|release|chore|docs>/<slug>` with slug `[a-z0-9._-]+` ([check-branch-name.js](../tools/git/scripts/check-branch-name.js)).

`wip/` and `docs/` are gitignored local scratch space — `wip/` holds an unrelated static HTML template kept for design reference. Neither is part of the build; don't edit, lint, or commit them.
