/**
 * E2E tests for XState state machine transitions.
 *
 * Pattern: Test user-visible state changes driven by the underlying XState machine.
 * These tests verify the full cycle: user action → state transition → UI update.
 *
 * The example machine fetches from /api/widgets (not wired in backend), so LOAD
 * always transitions to the error state — which is itself a useful test scenario.
 */
import { expect, test } from "../shared/error-capture";
import { EXAMPLE_APP } from "../shared/selectors";
import { navigateToHome } from "../shared/helpers";

test.describe("XState Example Flow", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHome(page);
  });

  test("displays idle state on initial load", async ({ page }) => {
    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"idle"',
    );
    await expect(page.getByTestId(EXAMPLE_APP.ITEMS_COUNT)).toHaveText("0");
  });

  test("load transitions to error when API is unavailable", async ({
    page,
  }) => {
    await page.getByTestId(EXAMPLE_APP.LOAD_BUTTON).click();

    // Widget routes are not wired → fetch fails → error state
    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"error"',
    );
  });

  test("reset returns to idle from error state", async ({ page }) => {
    // Trigger error state
    await page.getByTestId(EXAMPLE_APP.LOAD_BUTTON).click();
    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"error"',
    );

    // Reset back to idle
    await page.getByTestId(EXAMPLE_APP.RESET_BUTTON).click();
    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"idle"',
    );
  });

  test("reset clears items count", async ({ page }) => {
    // Trigger error, then reset
    await page.getByTestId(EXAMPLE_APP.LOAD_BUTTON).click();
    await expect(page.getByTestId(EXAMPLE_APP.STATE_DISPLAY)).toHaveText(
      '"error"',
    );

    await page.getByTestId(EXAMPLE_APP.RESET_BUTTON).click();
    await expect(page.getByTestId(EXAMPLE_APP.ITEMS_COUNT)).toHaveText("0");
  });
});
