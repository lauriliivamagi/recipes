# PRD: [Project Name]

## Context

[One paragraph describing what this project does, what technologies it uses, and any architectural decisions already made. This gives Ralph the "why" behind the codebase.]

Stack: Hono REST API (backend), React 19 + XState v5 + Material-UI 7 (frontend), MikroORM + BetterSQLite (database), pnpm monorepo with shared types.

## Tasks

### 1. [First task - should be architectural/tracer bullet]

- **Description:** [What needs to be built]
- **Acceptance criteria:**
  - [ ] [Specific, verifiable criterion]
  - [ ] [Another criterion]
- **Scenarios:** [Which scenarios in `scenarios/` this task enables — e.g., `scenarios/auth/signup.md`]
- **Exemplars:** [Optional — reference implementations to study. Can be files in this repo, URLs, or other repos. E.g., `packages/backend/src/contexts/health/` or `https://github.com/example/repo/src/feature/`]
- **Passes:** false

### 2. [Second task]

- **Description:** [What needs to be built]
- **Acceptance criteria:**
  - [ ] [Specific, verifiable criterion]
- **Scenarios:** [Related scenarios]
- **Exemplars:** [Optional]
- **Passes:** false

### 3. [Third task]

- **Description:** [What needs to be built]
- **Acceptance criteria:**
  - [ ] [Specific, verifiable criterion]
- **Scenarios:** [Related scenarios]
- **Exemplars:** [Optional]
- **Passes:** false

## Scenarios

End-to-end user scenarios live in `scenarios/`. Each task should reference the scenarios it enables. Write scenarios BEFORE implementation — they define what "working" means.

## Feedback Loops

Before committing, run ALL feedback loops:

- TypeScript: `pnpm run typecheck` (must pass with no errors)
- Lint: `pnpm run lint` (must pass)
- Tests: `pnpm run test` (must pass)
- Scenarios: Verify implementation supports referenced scenarios (see `scenarios/`)
- Build: `pnpm run build` (must succeed)

## Notes

- Each task should be a small, end-to-end vertical slice (tracer bullet)
- Tasks are ordered by priority but Ralph may reorder based on dependencies
- Mark "Passes: true" when a task is verified complete
- Exemplars accelerate implementation: point agents at working code that solves a similar problem
