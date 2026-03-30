# Backend CLAUDE.md

Hono REST API with MikroORM (BetterSQLite) using Vertical Slice Architecture.

## Tech Stack

- **Hono** - Web framework with OpenAPI/Zod integration
- **MikroORM** - ORM with BetterSQLite driver (swap to LibSQL for Turso in production)
- **Zod** - Runtime validation at API boundaries
- **tsx** - TypeScript execution (dev and production)

## Architecture: Vertical Slice

Features are organized by bounded context, not by technical layer:

```
src/contexts/<context>/features/<feature>/
├── index.ts           # Factory function export
├── <Feature>Handler.ts  # Handler with execute(c: Context)
└── <Feature>Schema.ts   # Optional: Zod schemas
```

Routes delegate to handlers:

```typescript
import { createMyHandler } from "../contexts/my-context/features/my-feature/index.js";
const handler = createMyHandler();
router.post("/endpoint", (c) => handler.execute(c));
```

## Adding a New Feature

1. Create `src/contexts/<context>/features/<feature>/`
2. Write `<Feature>Handler.ts` with `execute(c: Context)` method
3. Write `index.ts` with `create<Feature>Handler()` factory
4. Wire handler in `src/routes/<route>.ts`
5. Add tests in `tests/<context>/<feature>.test.ts`

## Commands

```bash
pnpm dev          # Start with tsx watch (hot reload)
pnpm start        # Start production
pnpm check        # TypeScript type check
pnpm test         # Run Vitest tests
pnpm test:watch   # Run tests in watch mode
```

## Database

- Config: `src/db/mikro-orm.config.ts`
- Singleton: `src/db/orm.ts` (initializeOrm/getOrm/getEntityManager)
- Migrations: `src/db/migrations/`
- Tests: In-memory SQLite via `tests/helpers/orm-test-setup.ts`

## Debugging with OpenTelemetry

When `OTEL_ENABLED=true` and Jaeger is running (`docker compose up jaeger`), every HTTP request and SQL query produces distributed traces.

**Debug API** (available when `OTEL_ENABLED=true`):

```bash
# Check OTel + Jaeger connectivity
curl http://localhost:8888/api/debug/health

# List instrumented services
curl http://localhost:8888/api/debug/services

# Search recent traces (last hour)
curl "http://localhost:8888/api/debug/traces?service=template-backend&limit=20"

# Get a specific trace by ID (from Pino logs: trace_id field)
curl http://localhost:8888/api/debug/traces/<trace_id>
```

**Log ↔ Trace Correlation:**

- Pino logger auto-injects `trace_id`/`span_id` into every log line (via OTel instrumentation)
- `X-Trace-ID` response header on every HTTP response (set by `requestIdMiddleware`)
- `X-Request-ID` response header for request correlation (client-supplied or generated UUID)
- Handlers can access `c.get("traceId")`, `c.get("spanId")`, `c.get("requestId")`

**Workflow for diagnosing failures:**
1. Reproduce the error
2. Find `trace_id` in Pino log output (or `X-Trace-ID` from response headers)
3. `curl http://localhost:8888/api/debug/traces/{trace_id}` to see the full request waterfall (HTTP -> middleware -> SQL)
4. Or open Jaeger UI at `http://localhost:16686/trace/{trace_id}`

**Key files:**
- `src/instrumentation.ts` — OTel SDK bootstrap (loaded via `--import` before app code)
- `src/logger.ts` — Pino logger (auto-injects `trace_id`/`span_id` into every log line)
- `src/middleware/security.ts` — `requestIdMiddleware` extracts OTel trace context, sets `X-Trace-ID`/`X-Request-ID` headers
- `src/routes/debug.ts` — Jaeger proxy endpoints above
- `docs/otel/reference.md` — Full observability reference documentation

## Environment Variables

Loaded from root `.env` file:

- `API_PORT` - Server port (default: 8888)
- `API_HOST` - Server host (default: 0.0.0.0)
- `DATABASE_URL` - Database URL (default: file:./data/app.db)
- `ALLOWED_ORIGINS` - CORS origins (default: \*)
- `OTEL_ENABLED` - Enable OpenTelemetry tracing (default: false)
- `OTEL_EXPORTER_OTLP_ENDPOINT` - Jaeger OTLP endpoint (default: http://localhost:4318)
