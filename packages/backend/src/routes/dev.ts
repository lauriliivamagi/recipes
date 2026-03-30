/**
 * Development Logger Query Routes
 *
 * Agent-friendly endpoints for querying the dev logger.
 * Only available when DEV_LOGGING=true and not in production.
 *
 * Workflow: Find error in Pino logs → extract trace_id →
 *   GET /api/dev/trace-by-otel/:traceId → full request waterfall
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { devLog } from "../dev-logger.js";
import type { QueryOptions } from "../dev-logger.js";

export const devRouter = new OpenAPIHono();

// Stats overview
devRouter.get("/api/dev/stats", (c) => {
  return c.json(devLog.getStats());
});

// Query logs with filters
devRouter.get("/api/dev/logs", (c) => {
  const options: QueryOptions = {
    level: c.req.query("level") as QueryOptions["level"],
    category: c.req.query("category") as QueryOptions["category"],
    requestId: c.req.query("requestId"),
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined,
    offset: c.req.query("offset") ? parseInt(c.req.query("offset")!) : undefined,
    since: c.req.query("since"),
    until: c.req.query("until"),
  };

  return c.json(devLog.query(options));
});

// Get full request trace (logs + breadcrumbs + snapshots) by request ID
devRouter.get("/api/dev/trace/:requestId", (c) => {
  const requestId = c.req.param("requestId");
  return c.json(devLog.getRequestTrace(requestId));
});

// Get logs by OTel trace ID (the primary agent debugging path)
devRouter.get("/api/dev/trace-by-otel/:traceId", (c) => {
  const traceId = c.req.param("traceId");
  if (!/^[a-f0-9]{32}$/.test(traceId)) {
    return c.json({ error: "Invalid traceId format (expected 32 hex chars)" }, 400);
  }
  return c.json(devLog.queryByTraceId(traceId));
});

// Clear all dev logs
devRouter.delete("/api/dev/logs", (c) => {
  devLog.clear();
  return c.json({ cleared: true });
});
