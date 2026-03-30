/**
 * Performance metrics collection pattern.
 *
 * Demonstrates how to measure page load performance in E2E tests using
 * the browser Performance API. Collects DOM Content Loaded, full page load,
 * and First Contentful Paint (FCP) timings.
 *
 * These are soft budgets — adjust thresholds for your application.
 * The pattern matters more than the specific numbers.
 */
import { expect, test } from "../shared/error-capture";

test.describe("Performance", () => {
  test("home page loads within performance budget", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      const fcp = performance
        .getEntriesByType("paint")
        .find((e) => e.name === "first-contentful-paint");

      return {
        domContentLoaded: Math.round(
          nav.domContentLoadedEventEnd - nav.startTime,
        ),
        loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
        firstContentfulPaint: Math.round(fcp?.startTime ?? 0),
      };
    });

    // Soft performance budgets — adjust for your app
    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.firstContentfulPaint).toBeLessThan(2000);

    // eslint-disable-next-line no-console
    console.log("Page load metrics:", metrics);
  });
});
