/**
 * Smoke tests — fast sanity checks that the app renders and is interactive.
 *
 * These should be the first tests to run and the fastest to execute.
 * If smoke tests fail, something fundamental is broken.
 */
import { expect, test } from "../shared/error-capture";
import { EXAMPLE_APP } from "../shared/selectors";
import { navigateToHome } from "../shared/helpers";

test.describe("Smoke Tests", () => {
  test("renders the app heading", async ({ page }) => {
    await navigateToHome(page);
    await expect(page.getByTestId(EXAMPLE_APP.HEADING)).toBeVisible();
    await expect(page.getByTestId(EXAMPLE_APP.HEADING)).toHaveText(
      "Template App",
    );
  });

  test("renders interactive buttons", async ({ page }) => {
    await navigateToHome(page);
    await expect(page.getByTestId(EXAMPLE_APP.LOAD_BUTTON)).toBeVisible();
    await expect(page.getByTestId(EXAMPLE_APP.RESET_BUTTON)).toBeVisible();
  });
});
