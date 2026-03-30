# Observability: Reference

> **Reference** - Information-oriented documentation describing the technical
> architecture.

## Architecture

```text
Browser (template-frontend)               Server (template-backend)
┌──────────────────────┐                  ┌──────────────────────┐
│ telemetry.ts         │                  │ instrumentation.ts   │
│  FetchInstrumentation│──traceparent──>  │  @hono/otel          │
│  XMLHttpRequest      │    header        │  better-sqlite3      │
│  DocumentLoad        │                  │  auto-instrumentations│
│  UserInteraction     │                  └─────────┬────────────┘
│  XState inspector    │                            │
└─────────┬────────────┘                  OTLP/HTTP │
          │ OTLP/HTTP                               ▼
          ▼
   ┌─────────────────────────────────────────────────────┐
   │              Jaeger v2 (OTel Collector)              │
   │  OTLP receiver → batch processor → memory storage   │
   │  Query UI: http://localhost:16686                    │
   └─────────────────────────────────────────────────────┘
```

## Services

| Service      | `service.name`       | `service.version`                           |
| ------------ | -------------------- | ------------------------------------------- |
| Backend API  | `template-backend`   | from `package.json`                         |
| Frontend SPA | `template-frontend`  | from `package.json` (via `__APP_VERSION__`) |

## Key Files

| File                                       | Role                                                       |
| ------------------------------------------ | ---------------------------------------------------------- |
| `backend/src/instrumentation.ts`           | Node OTel SDK setup, loaded via `--import` before app code |
| `backend/src/main.ts`                      | `@hono/otel` HTTP middleware registration                  |
| `backend/src/middleware/security.ts`       | `requestIdMiddleware` with OTel trace context extraction   |
| `backend/src/routes/debug.ts`              | Debug API proxying Jaeger Query (dev only)                 |
| `backend/src/logger.ts`                    | Pino logger (auto-injected trace_id/span_id via OTel)      |
| `frontend/src/telemetry.ts`                | Browser OTel SDK, all instrumentations                     |
| `frontend/src/utils/xstate-otel.ts`        | XState v5 inspection observer                              |
| `shared/types/src/observability.ts`        | Shared `SpanAttrs` constants                               |
| `jaeger-config.yaml`                       | Jaeger v2 collector configuration                          |
| `docker-compose.yml`                       | Jaeger service definition                                  |

## Span Catalog

### Backend Spans

#### HTTP (from `@hono/otel`)

| Span name                 | Attributes                                                                   |
| ------------------------- | ---------------------------------------------------------------------------- |
| `GET /api/health`         | `http.request.method`, `http.route`, `http.response.status_code`, `url.full` |
| `POST /api/widgets`       | same                                                                         |

#### SQLite (from `better-sqlite3` plugin)

| Span name             | Attributes                                                |
| --------------------- | --------------------------------------------------------- |
| `prepare: SELECT ...` | `db.system.name=sqlite3`, `db.query.text`, `db.namespace` |
| `run: INSERT ...`     | same                                                      |
| `PRAGMA ...`          | same                                                      |

DB spans nest under the HTTP parent span when triggered by an HTTP request.
Startup queries (MikroORM schema sync) appear as orphan root spans -- this is
expected.

### Frontend Spans

#### Fetch / XHR

| Span name               | Source                                  |
| ----------------------- | --------------------------------------- |
| `HTTP GET`, `HTTP POST` | `FetchInstrumentation` (native `fetch`) |
| `HTTP GET`, `HTTP POST` | `XMLHttpRequestInstrumentation` (axios) |

The `traceparent` header is injected automatically for same-origin requests
(Vite proxy in dev). For cross-origin production deployments, configure
`propagateTraceHeaderCorsUrls` in `telemetry.ts`.

#### XState

| Span name         | Attributes                                                  |
| ----------------- | ----------------------------------------------------------- |
| `xstate.event`    | `xstate.machine` (session ID), `xstate.event` (event type)  |
| `xstate.snapshot` | `xstate.machine`, `xstate.state`, `xstate.event`            |

#### Navigation

| Span name                        | Source                           |
| -------------------------------- | -------------------------------- |
| `documentFetch`, `resourceFetch` | `DocumentLoadInstrumentation`    |
| `click`                          | `UserInteractionInstrumentation` |

## Log ↔ Trace Correlation

OTel trace context (`traceId`, `spanId`) is automatically injected into all
logging systems when `OTEL_ENABLED=true`:

| Logger         | Where traceId appears                                          |
| -------------- | -------------------------------------------------------------- |
| Pino logger    | `trace_id` and `span_id` fields in every structured log line   |
| HTTP responses | `X-Trace-ID` response header (set by `requestIdMiddleware`)    |
| Hono context   | `c.get("traceId")` / `c.get("spanId")` available in handlers   |

### Cross-reference navigation

**Pino logs → Jaeger:** Find `trace_id` in Pino log output, then query:
`curl http://localhost:8888/api/debug/traces/<traceId>`

**Browser DevTools → Jaeger:** The `X-Trace-ID` response header on every HTTP
response contains the 32-char trace ID. Copy it and open
`http://localhost:16686/trace/<traceId>`.

**Request correlation:** The `X-Request-ID` header provides an ID for each
request, available in handlers via `c.get("requestId")`. Clients may supply
their own via the `X-Request-ID` request header (validated: `[\w-]{1,128}`);
otherwise a UUID is generated.

## Debug API

Available when `OTEL_ENABLED=true`.

```http
GET /api/debug/health
```

Returns OTel status and Jaeger connectivity.

```http
GET /api/debug/services
```

Lists all instrumented services reporting to Jaeger.

```http
GET /api/debug/traces?service=template-backend&limit=20&lookback=1h
```

Searches recent traces. Parameters:

- `service` -- service name (default: `template-backend`), must match `[a-zA-Z0-9._-]+`
- `limit` -- max results (default: `20`)
- `lookback` -- time window (default: `1h`), format: `\d+[hms]`

```http
GET /api/debug/traces/:traceId
```

Fetches a full trace by 32-char hex ID.

## Configuration

### Environment Variables

| Variable                       | Default                 | Description                           |
| ------------------------------ | ----------------------- | ------------------------------------- |
| `OTEL_ENABLED`                 | (unset)                 | Set `true` to enable backend tracing  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`  | `http://localhost:4318` | OTLP HTTP endpoint                    |
| `VITE_OTEL_ENABLED`            | (unset)                 | Set `true` to enable frontend tracing |
| `VITE_OTEL_EXPORTER_URL`       | `/v1/traces`            | Frontend OTLP exporter URL            |
| `JAEGER_QUERY_URL`             | auto-derived            | Jaeger Query API for debug routes     |

### Jaeger v2

Config file: `jaeger-config.yaml`

- **Receiver**: OTLP on ports 4317 (gRPC) and 4318 (HTTP)
- **Storage**: In-memory, 100k traces max (data lost on restart)
- **UI**: Port 16686
- **Processor**: Batch (default settings)

For persistent storage, replace `memstore` with Elasticsearch, Cassandra, or
Badger in the config. See
[Jaeger v2 docs](https://www.jaegertracing.io/docs/latest/).
