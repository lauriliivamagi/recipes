import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "../logger.js";

export const debugRouter = new OpenAPIHono();

const JAEGER_URL =
  process.env.JAEGER_QUERY_URL ||
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.replace(":4318", ":16686") ||
  "http://localhost:16686";

/**
 * Proxy a request to the Jaeger Query API.
 * Returns the Jaeger JSON response or a connection error.
 */
async function jaegerFetch(path: string): Promise<Response> {
  const url = `${JAEGER_URL}${path}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    return Response.json(data, { status: resp.status });
  } catch (error) {
    logger.warn({ error, url }, "Jaeger query failed");
    return Response.json({ error: "Jaeger unavailable", detail: String(error) }, { status: 503 });
  }
}

// Health check: verify Jaeger connectivity and OTel status
debugRouter.get("/api/debug/health", async (c) => {
  let jaegerOk = false;
  try {
    const resp = await fetch(`${JAEGER_URL}/api/services`);
    jaegerOk = resp.ok;
  } catch {
    // Jaeger not reachable
  }

  return c.json({
    otelEnabled: process.env.OTEL_ENABLED === "true",
    otelEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318",
    jaegerUrl: JAEGER_URL,
    jaegerConnected: jaegerOk,
    timestamp: new Date().toISOString(),
  });
});

// List instrumented services
debugRouter.get("/api/debug/services", async (_c) => {
  const resp = await jaegerFetch("/api/services");
  return new Response(resp.body, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
});

// Search traces by service
debugRouter.get("/api/debug/traces", async (c) => {
  const service = c.req.query("service") || "template-backend";
  const limit = c.req.query("limit") || "20";
  const lookback = c.req.query("lookback") || "1h";

  if (!/^[a-zA-Z0-9._-]+$/.test(service)) {
    return c.json({ error: "Invalid service name" }, 400);
  }
  if (!/^\d+[hms]$/.test(lookback)) {
    return c.json({ error: "Invalid lookback format (e.g. 1h, 30m, 60s)" }, 400);
  }

  const params = new URLSearchParams({ service, limit, lookback });
  const resp = await jaegerFetch(`/api/traces?${params}`);
  return new Response(resp.body, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
});

// Get a specific trace by ID
debugRouter.get("/api/debug/traces/:traceId", async (c) => {
  const traceId = c.req.param("traceId");
  if (!/^[a-f0-9]{32}$/.test(traceId)) {
    return c.json({ error: "Invalid traceId format (expected 32 hex chars)" }, 400);
  }
  const resp = await jaegerFetch(`/api/traces/${traceId}`);
  return new Response(resp.body, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
});
