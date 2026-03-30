# CLAUDE.md

Full-stack TypeScript monorepo using the Ralph method for autonomous AI coding.

## Architecture

```
packages/
├── backend/          # Hono REST API + MikroORM (Vertical Slice Architecture)
├── frontend/         # React 19 + XState v5 + Material-UI 7
└── shared/
    └── types/        # Shared TypeScript types (@template/types)
```

- **Service docs**: [backend/](packages/backend/CLAUDE.md), [frontend/](packages/frontend/CLAUDE.md)
- **Specs**: [specs/](specs/) (stable domain knowledge)

## Quick Reference

| Package              | Path                     | Description                |
| -------------------- | ------------------------ | -------------------------- |
| `@template/backend`  | `packages/backend/`      | Hono/Node.js REST API      |
| `@template/frontend` | `packages/frontend/`     | React/Vite web application |
| `@template/types`    | `packages/shared/types/` | Shared TypeScript types    |

## Development Commands

```bash
# Dev servers
pnpm dev                   # Start backend on port 8888
pnpm dev:frontend          # Start frontend Vite dev server
pnpm dev:all               # Start both concurrently

# Testing
pnpm test                  # Run all unit tests
pnpm test:backend          # Backend Vitest tests
pnpm test:frontend:unit    # Frontend Vitest tests
pnpm test:frontend:e2e     # Frontend Playwright E2E tests

# E2E extras (run from packages/frontend/)
pnpm test:e2e:ui           # Playwright UI mode (interactive)
pnpm test:e2e:typecheck    # Type-check E2E test files
pnpm test:e2e:coverage     # E2E with V8 coverage (Chromium only)

# Code quality
pnpm typecheck             # Type check all packages
pnpm lint                  # Lint all code (ESLint)
pnpm fmt:check             # Check formatting (Prettier)

# Build
pnpm build                 # Build frontend for production
```

## Monorepo Tooling

```bash
pnpm manifests-lint        # Validate package.json consistency (manypkg)
pnpm manifests-fix         # Auto-fix package.json issues
pnpm deps-lint             # Check for version mismatches (syncpack)
pnpm deps-fix              # Align dependency versions
pnpm unused                # Find unused exports/dependencies (knip)
```

## Environment Variables

Single source of truth: `.env` (copy from `.env.example`)

```bash
API_PORT=8888              # Backend port
DATABASE_URL=file:./data/app.db  # SQLite database path
ALLOWED_ORIGINS=*          # CORS origins (wildcard blocked in production)
FRONTEND_PORT=3000         # Frontend dev server port
ENABLE_HSTS=false          # Set true in production with HTTPS
OTEL_ENABLED=true          # Enable OpenTelemetry tracing
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318  # Jaeger OTLP endpoint
VITE_OTEL_ENABLED=true     # Enable browser-side tracing
DEV_LOGGING=true           # Enable SQLite dev logger for agent debugging
DEV_LOG_DB=.dev-logs/logs.db  # Dev log database path
```

## Security Middleware

OWASP Top 10 2021 compliant security headers are applied to all responses. The middleware stack in `main.ts` runs in order:

```
@hono/otel → requestId → CORS → requestSizeLimiter → securityHeaders → honoLogger → devLogging
```

**Key files:**

- `packages/backend/src/middleware/security.ts` — Headers, CORS, request size limiter, request ID
- `packages/backend/src/middleware/security-utils.ts` — `logSecurityEvent()`, `resolveClientIp()`, `timingSafeEqual()`, crypto utils

**Production safety:** `createSecureCors()` exits with error if `ALLOWED_ORIGINS=*` in production (`NODE_ENV=production`).

## DDD Patterns

The template exemplar (Widget + Gadget) demonstrates four Domain-Driven Design patterns. These are tactical patterns for the core domain — supporting subdomains can use plain CRUD/transaction scripts.

### Branded Entity IDs

Type-safe entity IDs via `EntityId<Brand>` (shared types) + `BrandedIdType<T>` (MikroORM custom type). Prevents accidentally passing a `UserId` where a `SessionId` is expected.

**Pattern for adding new entities:**

1. In `packages/shared/types/src/domain.ts`: `export type FooId = EntityId<"Foo">;`
2. In `packages/backend/src/db/types/index.ts`: `export class FooIdType extends BrandedIdType<FooId> { ... }`
3. In entity: `@PrimaryKey({ type: FooIdType }) id!: FooId;`

### Value Objects

Branded types with factory functions that return `Result<T>`. Replace "primitive obsession" (`name: string`) with semantic types that enforce business rules at creation time.

**Key files:**

- `packages/shared/types/src/value-objects.ts` — `WidgetName`, `WidgetDescription`, `GadgetLabel`
- `packages/shared/types/src/result.ts` — `Result<T, E>`, `Ok()`, `Err()`

**Pattern for adding new value objects:**

1. In `packages/shared/types/src/value-objects.ts`: Add branded type + `createFoo()` factory
2. Export from `packages/shared/types/src/index.ts`
3. Use in entities: `@Property({ type: "text" }) name!: FooName;`

Zod schemas validate HTTP input shape; value objects validate domain rules.

### Aggregate Root + Child Entities

Widget is an aggregate root that owns a Gadget collection. All mutations to child entities go through the aggregate root, which enforces invariants (e.g., `MAX_GADGETS_PER_WIDGET`).

**Key files:**

- `packages/backend/src/contexts/example/entities/Widget.ts` — Aggregate root with `addGadget()`, `removeGadget()`, `rename()`
- `packages/backend/src/contexts/example/repositories/WidgetRepository.ts` — Interface + MikroORM implementation

**Pattern for adding aggregate children:**

1. Define child entity in same file as root (or co-located)
2. Add `@OneToMany` on root with `orphanRemoval: true`
3. Add mutation methods on the root (e.g., `addChild()`, `removeChild()`)
4. Route child mutations through the root's API endpoints (`POST /widgets/:id/gadgets`)

### Repository Pattern

Repositories abstract persistence behind an interface. Handlers depend on the interface, not MikroORM directly.

**Pattern:**

- Interface: `WidgetRepository` — `findById()`, `findAll()`, `save()`, `remove()`
- Implementation: `MikroOrmWidgetRepository` — always populates child collections
- Repositories operate on aggregate roots only (not child entities)

### Semantic Actions

Domain methods replace generic CRUD. Instead of `PUT /widgets/:id` with a bag of fields:

- `POST /widgets/:id/rename` — `widget.rename(newName)`
- `PUT /widgets/:id/description` — `widget.updateDescription(desc)`
- `POST /widgets/:id/gadgets` — `widget.addGadget(label)`
- `DELETE /widgets/:id/gadgets/:gadgetId` — `widget.removeGadget(id)`

See Widget entity + handlers for the complete exemplar.

## Dev Logger (Agent Debugging)

SQLite-based logging for Ralph/AI agent debugging. Captures HTTP requests, breadcrumbs, and state snapshots, queryable by request ID or OTel trace ID.

**Enable:** Set `DEV_LOGGING=true` in `.env` (auto-disabled in production).

**Key files:**

- `packages/backend/src/dev-logger.ts` — DevLogger class (SQLite DB, query methods)
- `packages/backend/src/middleware/dev-logging.ts` — HTTP request/response capture middleware
- `packages/backend/src/routes/dev.ts` — Query endpoints

**Dev Logger API (available when `DEV_LOGGING=true`):**

- `GET /api/dev/stats` — Log counts and error summary
- `GET /api/dev/logs?level=error&limit=20` — Query logs with filters
- `GET /api/dev/trace/:requestId` — Full request trace (logs + breadcrumbs + snapshots)
- `GET /api/dev/trace-by-otel/:traceId` — Logs by OTel trace ID
- `DELETE /api/dev/logs` — Clear all dev logs

**Ralph/AI agent debugging workflow (enhanced):**

1. Find error in Pino logs → extract `trace_id`
2. `curl http://localhost:8888/api/dev/trace-by-otel/{trace_id}` → dev logger entries
3. `curl http://localhost:8888/api/debug/traces/{trace_id}` → full OTel request waterfall
4. Or open Jaeger UI: `http://localhost:16686`

## Observability (OpenTelemetry)

End-to-end distributed tracing via OpenTelemetry with Jaeger as the trace backend.

```bash
docker compose up jaeger   # Start Jaeger (UI: http://localhost:16686)
pnpm dev                   # Backend auto-sends traces to Jaeger
pnpm dev:frontend          # Frontend sends browser traces via Vite proxy
```

**Key files:**

- `packages/backend/src/instrumentation.ts` — OTel SDK bootstrap (loaded via `--import`)
- `packages/backend/src/logger.ts` — Pino logger (auto-injected trace_id/span_id)
- `packages/frontend/src/telemetry.ts` — Browser OTel setup (XHR, document load, user interaction)
- `packages/frontend/src/utils/xstate-otel.ts` — XState → OTel span bridge
- `packages/shared/types/src/observability.ts` — Shared span attribute constants

**Debug API (available when `OTEL_ENABLED=true`):**

- `GET /api/debug/health` — OTel + Jaeger connectivity status
- `GET /api/debug/traces?service=template-backend&limit=20` — Recent traces
- `GET /api/debug/traces/:traceId` — Full trace by ID
- `GET /api/debug/services` — List instrumented services

**Ralph/AI agent debugging workflow:**

1. Find error in Pino logs → extract `trace_id`
2. `curl http://localhost:8888/api/debug/traces/{trace_id}` → full request waterfall
3. Or open Jaeger UI: `http://localhost:16686`

## Docker

```bash
docker compose up --build  # Start full stack (backend + frontend/Caddy + Jaeger)
docker compose up jaeger   # Start only Jaeger for local dev
```

## Cross-Package Dependencies

```
@template/types → @template/backend
@template/types → @template/frontend
```

Changes to shared types may require updates in both backend and frontend.

## Ralph Loop Setup

- `ralph/base.md` - Core iteration protocol
- `ralph/quality.md` - Quality validation checklist
- `ralph/_assemble.sh` - Prompt assembly and state initialization
- `ralph/once.sh` - Single iteration (HITL mode)
- `ralph/afk.sh` - Looped AFK mode (streaming, resume, cost tracking)
- `ralph/team.sh` - Team mode with parallel agents
- `PRD.md` - Product requirements (tasks to implement)
- `state/` - Session state directory (delete when sprint is done)

When running inside a Ralph loop, follow the instructions in the assembled prompt only.

## Known Gotchas

- **Zod v4**: Error access is `result.error.issues[0].message`, not `.errors[0].message`
- **MikroORM + Vitest/esbuild**: Always specify `type` in `@Property()` decorators (e.g., `@Property({ type: "text" })`) — esbuild strips decorator metadata
- **MikroORM cascade delete**: `orphanRemoval: true` only processes loaded collections. Always `populate` the relation before deleting the parent entity.
- **MikroORM FK serialization**: ManyToOne fields serialize as the property name (e.g., `deck`), not as `deckId`. Match shared types to API output.
- **pnpm 10.6+**: Native module builds blocked by default. Add `pnpm.onlyBuiltDependencies: ["better-sqlite3", "esbuild"]` to root package.json.
- **MikroORM entity creation**: Prefer `new Entity()` + property assignment + `em.persist()` over `em.create()`. The `em.create()` RequiredEntityData type requires all fields including those with defaults.
- **Playwright E2E + shared SQLite**: Use `fullyParallel: false` and `workers: 1` in playwright.config.ts. Parallel test files race on the same database. Use API-based cleanup helpers (e.g., `createEntityViaApi`, `clearEntitiesViaApi`) in `beforeEach`.
- **Playwright E2E coverage**: Coverage collection (`E2E_COVERAGE=true`) uses V8 coverage API which is Chromium-only. Firefox/WebKit projects are excluded from coverage runs.
- **Playwright E2E selectors**: Use `tests/shared/selectors.ts` constants for `data-testid` values. Add new selectors there when instrumenting UI components for testing.
- **XState v5 final states**: Final states cannot invoke actors. If you need side effects at the end of a flow (e.g., saving results), add an intermediate state (e.g., `saving`) that invokes the actor, then transition to the final state on success/error.
- **OTel instrumentation.ts**: Must load before app code via `--import ./src/instrumentation.ts`. OTel monkey-patches `http`, `pino`, and `better-sqlite3` — if the app imports them first, auto-instrumentation won't work.
- **OTel resources v2**: Use `resourceFromAttributes({...})` (not `new Resource({...})`). The `@opentelemetry/resources` v2 API changed the constructor.
- **OTel HTTP spans + ESM/Node 24**: Node.js HTTP auto-instrumentation doesn't work reliably with ESM on Node 24. Use `@hono/otel` middleware (`httpInstrumentationMiddleware`) for route-aware HTTP spans instead.
- **Playwright error-capture + OTel/MUI**: The `error-capture.ts` fixture filters known harmless browser errors (OTel SendBeacon, React DOM nesting warnings, 404 resource loads). Add new patterns to `IGNORED_PATTERNS` when browser noise causes false E2E failures.
- **MUI barrel imports (Vite perf)**: Always use direct imports (`import Button from "@mui/material/Button"`) not barrel imports (`import { Button } from "@mui/material"`). The barrel forces Vite to pre-bundle the entire MUI library. Use `@mui/material/styles` for `createTheme`/`ThemeProvider`.
- **React 19 + React Compiler**: Do not add `React.memo()`, `useMemo`, or `useCallback` for performance — the compiler handles this. Use `use()` instead of `useContext()`. Pass `ref` as a prop instead of using `forwardRef`.
