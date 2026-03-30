/**
 * Security Middleware
 *
 * OWASP Top 10 2021 compliant security middleware:
 * - Security headers (CSP, X-Frame-Options, HSTS, etc.)
 * - Request size limiting
 * - CORS configuration with production safety guard
 *
 * Security Headers Set:
 * - X-Content-Type-Options: nosniff (A05)
 * - X-Frame-Options: DENY (A05)
 * - Referrer-Policy: strict-origin-when-cross-origin (A05)
 * - Permissions-Policy: geolocation=(), microphone=(), camera=() (A05)
 * - Content-Security-Policy: default-src 'none' (A05)
 * - Strict-Transport-Security (when ENABLE_HSTS=true) (A02)
 */

import type { Context, MiddlewareHandler, Next } from "hono";
import { cors } from "hono/cors";
import { trace, context as otelContext } from "@opentelemetry/api";
import { logSecurityEvent, resolveClientIp } from "./security-utils.js";

// =============================================================================
// Security Headers Middleware
// =============================================================================

/**
 * Add OWASP-recommended security headers to all responses.
 */
export async function securityHeaders(c: Context, next: Next): Promise<Response | void> {
  await next();

  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "0"); // Deprecated, CSP preferred
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // APIs return JSON — restrictive CSP is safe
  c.header(
    "Content-Security-Policy",
    "default-src 'none'; connect-src 'self'; frame-ancestors 'none'"
  );

  // HSTS (only enable in production with HTTPS)
  if (process.env.ENABLE_HSTS === "true") {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

// =============================================================================
// Request Size Limiter
// =============================================================================

const DEFAULT_MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Create a request size limiter middleware.
 *
 * NOTE: Only checks the Content-Length header, which clients can omit
 * (e.g., chunked transfer encoding). For stream-based enforcement,
 * add body consumption with a size-limited reader in the handler.
 *
 * @param maxSize Maximum request body size in bytes (default: 10MB)
 */
export function createRequestSizeLimiter(maxSize = DEFAULT_MAX_BODY_SIZE) {
  return async function requestSizeLimiter(c: Context, next: Next): Promise<Response | void> {
    const contentLength = c.req.header("content-length");

    if (contentLength && parseInt(contentLength) > maxSize) {
      logSecurityEvent("request_too_large", {
        ip: resolveClientIp(c),
        path: c.req.path,
        size: contentLength,
        limit: String(maxSize),
      });

      return c.json(
        {
          error: "Request body too large",
          maxSize: `${Math.round(maxSize / 1024 / 1024)}MB`,
        },
        413
      );
    }

    await next();
  };
}

// =============================================================================
// CORS Configuration
// =============================================================================

/**
 * Create a secure CORS middleware.
 *
 * - In production: blocks wildcard origins (process.exit with clear error)
 * - In development: wildcard allowed but credentials disabled (per CORS spec)
 * - With specific origins: credentials enabled
 *
 * @param allowedOrigins Comma-separated list of allowed origins, or "*" for all
 */
export function createSecureCors(allowedOrigins: string): MiddlewareHandler {
  const isProduction = process.env.NODE_ENV === "production";
  const isWildcard = allowedOrigins === "*";

  if (isProduction && isWildcard) {
    console.error("═══════════════════════════════════════════════════════════════════");
    console.error("  SECURITY ERROR: CORS wildcard (*) is not allowed in production.");
    console.error("");
    console.error("  Set ALLOWED_ORIGINS to specific domains:");
    console.error("    ALLOWED_ORIGINS=https://your-domain.com");
    console.error("");
    console.error("  Multiple origins supported (comma-separated):");
    console.error("    ALLOWED_ORIGINS=https://app.example.com,https://api.example.com");
    console.error("═══════════════════════════════════════════════════════════════════");
    process.exit(1);
  }

  if (isWildcard) {
    return cors({
      origin: "*",
      credentials: false, // Cannot use credentials with wildcard
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "X-Request-ID", "traceparent", "tracestate"],
      exposeHeaders: ["X-Request-ID", "X-Trace-ID", "traceparent", "tracestate"],
    });
  }

  // Specific origins with credentials
  const origins = allowedOrigins.split(",").map((o) => o.trim());

  return cors({
    origin: (origin) => {
      if (!origin) return origins[0];
      if (origins.includes(origin)) return origin;

      logSecurityEvent("cors_violation", {
        origin,
        allowed: origins.join(", "),
      });

      return null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID", "traceparent", "tracestate"],
    exposeHeaders: ["X-Request-ID", "X-Trace-ID", "traceparent", "tracestate"],
    maxAge: 86400,
  });
}

// =============================================================================
// Request ID Middleware
// =============================================================================

/**
 * Add a unique request ID to each request and extract OTel trace context.
 * Sets X-Request-ID and X-Trace-ID response headers for client correlation.
 */
export async function requestIdMiddleware(c: Context, next: Next): Promise<Response | void> {
  const clientId = c.req.header("X-Request-ID");
  const requestId = clientId && /^[\w-]{1,128}$/.test(clientId) ? clientId : crypto.randomUUID();
  c.set("requestId", requestId);
  c.header("X-Request-ID", requestId);

  // Extract OTel trace context if available (@hono/otel runs before this middleware)
  const spanContext = trace.getSpan(otelContext.active())?.spanContext();
  if (spanContext?.traceId) {
    c.set("traceId", spanContext.traceId);
    c.set("spanId", spanContext.spanId);
    c.header("X-Trace-ID", spanContext.traceId);
  }

  await next();
}

// Extend context to include requestId and OTel trace context
declare module "hono" {
  interface ContextVariableMap {
    requestId: string;
    traceId?: string;
    spanId?: string;
  }
}
