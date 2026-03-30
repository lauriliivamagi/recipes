/**
 * Visual regression testing patterns with Playwright screenshots.
 *
 * Demonstrates screenshot comparison for catching unintended visual changes.
 * Playwright stores baseline screenshots in a `-snapshots/` directory next to
 * this file. Subsequent runs compare against the baselines.
 *
 * First run: generates baselines (always passes).
 * Update baselines: pnpm exec playwright test --update-snapshots
 *
 * Note: Visual tests run on chromium only to avoid cross-browser rendering diffs.
 */
import { expect, test } from "../shared/error-capture";
import { navigateToHome } from "../shared/helpers";

test.describe("Visual Regression", () => {
  // Skip on mobile projects to avoid maintaining separate baselines per viewport.
  // browserName is "chromium" for both desktop and mobile projects, so check project name.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Visual tests: desktop chromium only",
    );
  });

  // Pattern: Full-page screenshot comparison
  test("home page matches snapshot", async ({ page }) => {
    await navigateToHome(page);

    await expect(page).toHaveScreenshot("home-idle.png", {
      fullPage: true,
    });
  });

  // Pattern: Component-level screenshot (isolate a specific region)
  test("heading matches snapshot", async ({ page }) => {
    await navigateToHome(page);

    const heading = page.getByRole("heading", { name: "Template App" });
    await expect(heading).toHaveScreenshot("heading.png");
  });
});
