# Copilot Instructions

Portfolio monorepo serves as a dynamic, digital showcase of work, skills, and accomplishments, designed to prove capabilities to potential employers or clients.

## Project

- **Stack**: Nx 22, Angular 21 (standalone, signals, control flow), NgRx Signal Store 21, Vitest, Playwright
- **Architecture**: Domain-Driven Design — `feature/`, `ui/`, `data/`, `util/` per domain under `src/libs`
- **Repo slug**: `Exaltence/portfolio-monorepo`

Detailed guidance lives in `.github/instructions/` (auto-applied via `applyTo` globs):

- `architecture.instructions.md` — DDD layout, naming, module boundaries
- `angular.instructions.md` — Angular 21 patterns
- `angular-signal-forms.instructions.md` — Signal Forms API
- `angular-testing.instructions.md` — Vitest + TestBed
- `ngrx-signals.instructions.md` — Signal Store patterns
- `ngrx-signals-testing.instructions.md` — Store testing
- `typescript.instructions.md` — Strict TypeScript conventions
- `techstack.instructions.md` — Full tech stack reference

## General rules

- Be concise; show code over prose.
- Match existing patterns in `src/app/` and `src/lib/`. Reuse before creating.
- Strong typing always. No `any`.
- No code comments unless explicitly requested.
- Ask when requirements are ambiguous.
