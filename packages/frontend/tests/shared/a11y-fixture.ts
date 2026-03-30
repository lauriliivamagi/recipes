/**
 * Accessibility testing fixture — extends the error-capture fixture with axe-core.
 *
 * Provides a `makeAxeBuilder` fixture pre-configured for WCAG 2.1 AA compliance.
 * Import from this file (instead of error-capture) when tests need a11y checks.
 *
 * Usage:
 *   import { test, expect } from "../shared/a11y-fixture";
 *
 *   test("page is accessible", async ({ page, makeAxeBuilder }) => {
 *     await page.goto("/");
 *     const results = await makeAxeBuilder().analyze();
 *     expect(results.violations).toEqual([]);
 *   });
 */
import AxeBuilder from "@axe-core/playwright";
import { test as base, expect } from "./error-capture";

type A11yFixtures = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<A11yFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    await use(() =>
      new AxeBuilder({ page }).withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
      ]),
    );
  },
});

export { expect };
