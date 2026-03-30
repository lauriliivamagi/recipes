import { test as base, expect } from "./coverage-fixture";

/**
 * Extended Playwright test fixture that auto-fails on console.error.
 * Import this instead of @playwright/test to catch runtime errors.
 *
 * Usage:
 *   import { expect, test } from "../shared/error-capture";
 */
// Browser-level messages that are not application errors:
// - "Failed to load resource" from expected 404 cache-miss API responses
// - React dev-mode DOM nesting warnings (e.g., <div> inside <p>)
// - OTel SendBeacon failures during page navigation/reload (beacon fires after page unload)
// - OTel CORS errors when Jaeger/collector is not running
const IGNORED_PATTERNS = [
  /Failed to load resource/,
  /cannot be a descendant of/,
  /cannot contain a nested/,
  /SendBeacon failed/,
  /\/v1\/traces.*CORS|CORS.*\/v1\/traces/,
];

function isIgnored(text: string): boolean {
  return IGNORED_PATTERNS.some((p) => p.test(text));
}

export const test = base.extend<{ captureErrors: void }>({
  captureErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error" && !isIgnored(msg.text())) {
          errors.push(msg.text());
        }
      });

      page.on("pageerror", (error) => {
        errors.push(error.message);
      });

      await use();

      if (errors.length > 0) {
        throw new Error(`Console errors detected:\n${errors.join("\n")}`);
      }
    },
    { auto: true },
  ],
});

export { expect };
