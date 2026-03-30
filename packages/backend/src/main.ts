import { OpenAPIHono } from "@hono/zod-openapi";
import { serve } from "@hono/node-server";
import { logger as honoLogger } from "hono/logger";
import { config } from "dotenv";
import { healthRouter } from "./routes/health.js";
import {
  createSecureCors,
  requestIdMiddleware,
  securityHeaders,
  createRequestSizeLimiter,
} from "./middleware/security.js";
import { devLog, isDevLoggingEnabled } from "./dev-logger.js";
import { initializeOrm, closeOrm } from "./db/orm.js";
import { logger } from "./logger.js";
import pkg from "../package.json" with { type: "json" };

// Load environment from root .env
config({ path: "../../.env" });

// Initialize MikroORM
try {
  await initializeOrm();
  logger.info("Database initialized");
} catch (error) {
  logger.error(error, "Database initialization failed");
  process.exit(1);
}

const API_HOST = process.env.API_HOST || "0.0.0.0";
const API_PORT = parseInt(process.env.API_PORT || "8888");
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "*";

const app = new OpenAPIHono();

// OpenTelemetry middleware — wraps entire request lifecycle for distributed tracing.
// Node.js HTTP auto-instrumentation doesn't work reliably with ESM on Node 24;
// @hono/otel instruments at the Hono framework level and gives route-aware span names.
if (process.env.OTEL_ENABLED === "true") {
  const { httpInstrumentationMiddleware } = await import("@hono/otel");
  app.use(
    "*",
    httpInstrumentationMiddleware({
      serviceName: "template-backend",
      serviceVersion: pkg.version,
    })
  );
}

// Middleware (order matters: requestId after OTel so trace context is available)
app.use("*", requestIdMiddleware);
app.use("*", createSecureCors(ALLOWED_ORIGINS));
app.use("*", createRequestSizeLimiter());
app.use("*", securityHeaders);
app.use("*", honoLogger());

// Dev logging middleware (after requestId, before routes)
if (isDevLoggingEnabled()) {
  const { devLoggingMiddleware, devErrorMiddleware } = await import("./middleware/dev-logging.js");
  app.use("*", devLoggingMiddleware);
  app.use("*", devErrorMiddleware);
}

// Routes
app.route("/", healthRouter);

// Debug routes for AI-agent observability (dev only)
if (process.env.OTEL_ENABLED === "true") {
  const { debugRouter } = await import("./routes/debug.js");
  app.route("/", debugRouter);
}

// Dev logger query routes
if (isDevLoggingEnabled()) {
  const { devRouter } = await import("./routes/dev.js");
  app.route("/", devRouter);
}

// Global error handler
app.onError((err, c) => {
  logger.error(err, "Unhandled error");
  return c.json({ success: false, error: "An unexpected error occurred" }, 500);
});

app.notFound((c) => {
  return c.json({ success: false, error: "Not Found" }, 404);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutting down...");
  devLog.close();
  await closeOrm();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  devLog.close();
  await closeOrm();
  process.exit(0);
});

serve(
  {
    fetch: app.fetch,
    hostname: API_HOST,
    port: API_PORT,
  },
  (info) => {
    logger.info(`Server listening on http://${info.address}:${info.port}`);
  }
);
