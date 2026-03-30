/**
 * E2E patterns for API mocking and network interception.
 *
 * Demonstrates four Playwright `page.route()` patterns:
 *   1. Mock a successful response (happy path without backend dependency)
 *   2. Mock a slow response (test loading/intermediate states)
 *   3. Mock a network error (test error handling)
 *   4. Assert a request was made (verify correct API call)
 *
 * These patterns let you test full user flows even when backend routes
 * are unavailable, slow, or flaky.
 */
import { expect, test } from "../shared/error-capture";
import { EXAMPLE_APP } from "../shared/selectors";
import { navigateToHome } from "../shared/helpers";

test.describe("Network Interception Patterns", () => {
  // Pattern 1: Mock a successful API response
  test("mock successful response → reviewing state", async ({ page }) => {
    await page.route("**/api/widgets", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: ["Item A", "Item B", "Item C"] }),
      }),
    );

    await navigateToHome(page);
    await page.getByTestId(EXAMPLE_APP.LOAD_BUTTON).click();

    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"reviewing"',
    );
    await expect(page.getByTestId(EXAMPLE_APP.ITEMS_COUNT)).toHaveText("3");
  });

  // Pattern 2: Mock a slow API response to test loading state
  test("mock slow response → loading state visible", async ({ page }) => {
    await page.route("**/api/widgets", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: ["Delayed Item"] }),
      });
    });

    await navigateToHome(page);
    await page.getByTestId(EXAMPLE_APP.LOAD_BUTTON).click();

    // Machine should be in "loading" while waiting for the delayed response
    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"loading"',
    );

    // Eventually transitions to reviewing after response arrives
    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"reviewing"',
      { timeout: 5000 },
    );
  });

  // Pattern 3: Mock a network error
  test("mock network error → error state", async ({ page }) => {
    await page.route("**/api/widgets", (route) =>
      route.abort("connectionrefused"),
    );

    await navigateToHome(page);
    await page.getByTestId(EXAMPLE_APP.LOAD_BUTTON).click();

    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"error"',
    );
  });

  // Pattern 4: Assert the correct request was made
  test("load sends GET request to /api/widgets", async ({ page }) => {
    // Set up route to intercept (must route before navigation)
    await page.route("**/api/widgets", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      }),
    );

    await navigateToHome(page);

    const requestPromise = page.waitForRequest("**/api/widgets");
    await page.getByTestId(EXAMPLE_APP.LOAD_BUTTON).click();
    const request = await requestPromise;

    expect(request.method()).toBe("GET");
    expect(request.url()).toContain("/api/widgets");
  });
});
