/**
 * Reusable E2E test helpers.
 *
 * Pattern: use API-based helpers for test data setup/teardown to avoid
 * brittle UI-driven setup. Call clearEntitiesViaApi() in beforeEach for isolation.
 *
 * Example usage in a spec file:
 *
 *   import { createEntityViaApi, clearEntitiesViaApi, navigateToHome } from "./shared/helpers";
 *
 *   test.beforeEach(async () => {
 *     await clearEntitiesViaApi("/widgets");
 *   });
 *
 *   test("creates a widget", async ({ page }) => {
 *     const widget = await createEntityViaApi("/widgets", { name: "Test" });
 *     await page.goto(`/widgets/${widget.id}`);
 *     // ...assertions
 *   });
 */

// NOTE: Spec files must import { test, expect } from "../shared/error-capture",
// not from this module. This file uses @playwright/test directly because it only
// provides helper functions — it does not define tests.
import { expect, type Page } from "@playwright/test";
import { BACKEND_URL, TIMEOUTS } from "./fixtures";

const API_BASE = `${BACKEND_URL}/api`;

// ---------- Navigation ----------

export async function navigateToHome(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

// ---------- API-Based Setup/Teardown ----------

/**
 * Create an entity via the REST API. Returns the created entity from response.data.
 */
export async function createEntityViaApi<T = Record<string, unknown>>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
  const json = await res.json();
  return json.data as T;
}

/**
 * Delete all entities at an endpoint by listing then deleting each.
 * Expects GET endpoint to return { data: Array<{ id: string }> }.
 */
export async function clearEntitiesViaApi(endpoint: string): Promise<void> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) return;
  const json = await res.json();
  const items = json.data as Array<{ id: string }>;
  for (const item of items) {
    await fetch(`${API_BASE}${endpoint}/${item.id}`, { method: "DELETE" });
  }
}

// ---------- Generic Helpers ----------

/**
 * Wait for an element to be visible with a custom timeout.
 */
export async function waitForElement(
  page: Page,
  testId: string,
  timeout = TIMEOUTS.mediumWait,
): Promise<void> {
  await expect(page.getByTestId(testId)).toBeVisible({ timeout });
}

/**
 * Check if an element exists without throwing.
 * Returns true if the element is attached to the DOM within 1 second.
 */
export async function elementExists(
  page: Page,
  testId: string,
): Promise<boolean> {
  try {
    await page.getByTestId(testId).waitFor({
      state: "attached",
      timeout: 1000,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for an HTTP response matching a URL pattern.
 */
export async function waitForAPICall(
  page: Page,
  urlPattern: string | RegExp,
  timeout = TIMEOUTS.heavyOperation,
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === "string") {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout },
  );
}

/**
 * Clear localStorage and sessionStorage.
 */
export async function clearSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Convert a string to kebab-case slug (for dynamic data-testid values).
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}
