/**
 * Development Logging Middleware for Hono
 *
 * Provides:
 * - Request/response logging with timing
 * - Breadcrumb capture for debugging
 * - Error capture with full context
 *
 * SECURITY: Only active when dev logging is enabled (DEV_LOGGING=true, not production).
 */

import type { Context, Next } from "hono";
import { devLog, isDevLoggingEnabled } from "../dev-logger.js";

function getRequestInfo(c: Context): Record<string, unknown> {
  const url = new URL(c.req.url);
  return {
    method: c.req.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    userAgent: c.req.header("user-agent")?.slice(0, 100),
    contentType: c.req.header("content-type"),
    contentLength: c.req.header("content-length"),
  };
}

/**
 * Main dev logging middleware.
 *
 * Captures HTTP request/response with timing, correlates by requestId/traceId.
 * Must run after requestIdMiddleware.
 */
export async function devLoggingMiddleware(c: Context, next: Next): Promise<Response | void> {
  if (!isDevLoggingEnabled()) {
    return next();
  }

  const requestId = c.get("requestId");
  const traceId = c.get("traceId");
  const spanId = c.get("spanId");

  const requestInfo = getRequestInfo(c);
  devLog.breadcrumb(requestId, traceId, "http_request", c.req.path, requestInfo);

  const start = performance.now();
  await next();
  const duration = performance.now() - start;

  const status = c.res.status;
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

  devLog.log({
    level,
    category: "http",
    message: `${c.req.method} ${c.req.path} ${status}`,
    requestId,
    traceId,
    spanId,
    data: {
      ...requestInfo,
      status,
      duration: Math.round(duration * 100) / 100,
      durationMs: `${duration.toFixed(2)}ms`,
    },
  });
}

/**
 * Error logging middleware.
 *
 * Captures unhandled errors with full context before re-throwing
 * to Hono's error handler. Must run before other error handlers.
 */
export async function devErrorMiddleware(c: Context, next: Next): Promise<Response | void> {
  if (!isDevLoggingEnabled()) {
    return next();
  }

  try {
    await next();
  } catch (error) {
    const requestId = c.get("requestId");
    const traceId = c.get("traceId");
    const spanId = c.get("spanId");

    devLog.log({
      level: "error",
      category: "http",
      message: `Unhandled error: ${error instanceof Error ? error.message : String(error)}`,
      requestId,
      traceId,
      spanId,
      data: {
        method: c.req.method,
        path: c.req.path,
        errorName: error instanceof Error ? error.name : "Unknown",
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    });

    throw error;
  }
}
