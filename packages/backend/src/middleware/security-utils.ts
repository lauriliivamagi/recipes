/**
 * Security Utilities
 *
 * Provides security-focused utilities for:
 * - Timing-safe string comparison
 * - Security event logging with OTel trace correlation
 * - Email masking for logs
 * - IP resolution with proxy support
 * - Token hashing and generation
 *
 * OWASP Top 10 2021 aligned.
 */

import type { Context } from "hono";
import { timingSafeEqual as cryptoTimingSafeEqual } from "node:crypto";
import { trace, context as otelContext } from "@opentelemetry/api";

// =============================================================================
// Timing-Safe Comparison
// =============================================================================

/**
 * Perform timing-safe string comparison to prevent timing attacks.
 *
 * Delegates to Node.js built-in crypto.timingSafeEqual() which uses
 * OpenSSL's constant-time comparison. Returns false if either string
 * is empty/undefined or if lengths differ (length is not secret in
 * typical auth flows like token comparison).
 */
export function timingSafeEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) {
    return false;
  }

  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return cryptoTimingSafeEqual(bufA, bufB);
}

// =============================================================================
// Security Event Logging
// =============================================================================

/**
 * Security event types for structured logging.
 * Extend this union as your application adds features.
 */
export type SecurityEventType =
  | "auth_success"
  | "auth_failure"
  | "rate_limit_exceeded"
  | "cors_violation"
  | "invalid_input"
  | "request_too_large"
  | "suspicious_activity";

type SecuritySeverity = "info" | "warning" | "critical";

export interface SecurityEventMetadata {
  requestId?: string;
  ip?: string;
  email?: string;
  userId?: string;
  reason?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

function getSeverity(eventType: SecurityEventType): SecuritySeverity {
  switch (eventType) {
    case "suspicious_activity":
      return "critical";
    case "auth_failure":
    case "rate_limit_exceeded":
    case "cors_violation":
    case "request_too_large":
    case "invalid_input":
      return "warning";
    case "auth_success":
    default:
      return "info";
  }
}

/**
 * Log a security event with structured data and OTel trace correlation.
 *
 * Events are logged as JSON for easy parsing by log aggregators.
 */
export function logSecurityEvent(
  eventType: SecurityEventType,
  metadata: SecurityEventMetadata = {}
): void {
  const severity = getSeverity(eventType);
  const timestamp = new Date().toISOString();

  // Mask email if present
  const maskedMetadata = { ...metadata };
  if (maskedMetadata.email) {
    maskedMetadata.email = maskEmail(maskedMetadata.email);
  }

  // Include OTel trace context for log↔trace correlation
  const spanContext = trace.getSpan(otelContext.active())?.spanContext();

  const event = {
    type: "security_event",
    timestamp,
    event: eventType,
    severity,
    ...(spanContext?.traceId && { traceId: spanContext.traceId }),
    ...maskedMetadata,
  };

  if (severity === "critical") {
    console.error(JSON.stringify(event));
  } else if (severity === "warning") {
    console.warn(JSON.stringify(event));
  } else {
    console.log(JSON.stringify(event));
  }
}

// =============================================================================
// Email Masking
// =============================================================================

/**
 * Mask an email address for safe logging.
 * john@example.com → j***n@example.com
 */
function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[1]) {
    return "***";
  }

  const [local, domain] = parts;

  if (!local || local.length === 0) return `***@${domain}`;
  if (local.length === 1) return `*@${domain}`;
  if (local.length === 2) return `${local[0]}*@${domain}`;

  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

// =============================================================================
// IP Resolution
// =============================================================================

type ProxyType = "auto" | "cloudflare" | "nginx" | "direct";

/**
 * Resolve the real client IP address from a request.
 *
 * Supports Cloudflare (CF-Connecting-IP), Nginx (X-Forwarded-For, X-Real-IP),
 * and direct connections. Configurable via PROXY_TYPE and TRUSTED_PROXY_IPS env vars.
 */
export function resolveClientIp(c: Context): string {
  const proxyType = (process.env.PROXY_TYPE as ProxyType) || "auto";
  const trustedProxies = (process.env.TRUSTED_PROXY_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  const directIp = c.req.header("x-real-ip") || "unknown";

  if (proxyType === "direct") {
    return directIp;
  }

  // Cloudflare
  if (proxyType === "cloudflare" || proxyType === "auto") {
    const cfIp = c.req.header("cf-connecting-ip");
    if (cfIp && (proxyType === "cloudflare" || trustedProxies.length === 0)) {
      return cfIp;
    }
  }

  // X-Forwarded-For
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    const clientIp = ips[0];

    if (trustedProxies.length === 0) {
      return clientIp || directIp;
    }

    const lastProxyIp = ips[ips.length - 1];
    if (lastProxyIp && trustedProxies.includes(lastProxyIp)) {
      return clientIp || directIp;
    }
  }

  // X-Real-IP (Nginx)
  const realIp = c.req.header("x-real-ip");
  if (realIp && trustedProxies.length === 0) {
    return realIp;
  }

  return directIp;
}

// =============================================================================
// Token Utilities
// =============================================================================

/**
 * Hash a token using SHA-256 for secure storage.
 */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a secure random token (URL-safe base64).
 */
export function generateSecureToken(bytes: number = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  const base64 = btoa(String.fromCharCode(...array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
