/**
 * Accessibility testing patterns with axe-core.
 *
 * Demonstrates two patterns:
 *   1. Full-page a11y scan on initial load
 *   2. A11y scan after a state change (new DOM content rendered)
 *
 * Uses WCAG 2.1 AA rules via the a11y-fixture.
 * Run: pnpm test:e2e -- tests/patterns/accessibility.spec.ts
 */
import { test, expect } from "../shared/a11y-fixture";
import { EXAMPLE_APP } from "../shared/selectors";
import { navigateToHome } from "../shared/helpers";

test.describe("Accessibility", () => {
  // Pattern 1: Full-page scan on initial load
  test("home page has no a11y violations", async ({
    page,
    makeAxeBuilder,
  }) => {
    await navigateToHome(page);

    const results = await makeAxeBuilder().analyze();
    expect(results.violations).toEqual([]);
  });

  // Pattern 2: Scan after state change (error state adds new DOM content)
  test("error state has no a11y violations", async ({
    page,
    makeAxeBuilder,
  }) => {
    await navigateToHome(page);
    await page.getByTestId(EXAMPLE_APP.LOAD_BUTTON).click();
    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"error"',
    );

    const results = await makeAxeBuilder().analyze();
    expect(results.violations).toEqual([]);
  });
});
