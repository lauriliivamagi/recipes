/**
 * Responsive layout testing patterns.
 *
 * Demonstrates how to verify layout changes across viewports.
 * The App uses MUI Stack with `direction={{ xs: "column", sm: "row" }}`,
 * so buttons should stack vertically on mobile and sit side-by-side on desktop.
 *
 * This test runs on both `chromium` (1280px) and `mobile-chrome` (Pixel 7, 412px)
 * projects, verifying the correct layout for each viewport.
 */
import { expect, test } from "../shared/error-capture";
import { EXAMPLE_APP } from "../shared/selectors";
import { navigateToHome } from "../shared/helpers";

// MUI sm breakpoint is 600px
const SM_BREAKPOINT = 600;

test.describe("Responsive Layout", () => {
  test("buttons layout adapts to viewport width", async ({ page }) => {
    await navigateToHome(page);

    const loadButton = page.getByTestId(EXAMPLE_APP.LOAD_BUTTON);
    const resetButton = page.getByTestId(EXAMPLE_APP.RESET_BUTTON);

    const loadBox = await loadButton.boundingBox();
    const resetBox = await resetButton.boundingBox();

    if (!loadBox || !resetBox) {
      throw new Error("Could not get button bounding boxes");
    }

    const viewportWidth = page.viewportSize()?.width ?? 0;

    if (viewportWidth < SM_BREAKPOINT) {
      // Mobile (xs): Stack direction="column" → buttons stacked vertically
      expect(resetBox.y).toBeGreaterThan(loadBox.y + loadBox.height / 2);
    } else {
      // Desktop (sm+): Stack direction="row" → buttons side by side
      expect(resetBox.x).toBeGreaterThan(loadBox.x + loadBox.width / 2);
    }
  });
});
