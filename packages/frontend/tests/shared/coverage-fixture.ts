/**
 * Coverage Fixture
 * Collects V8 code coverage during Playwright E2E tests (Chromium only).
 *
 * Converts V8 coverage to Istanbul format for `nyc report`.
 * Only active when E2E_COVERAGE=true to avoid performance overhead.
 *
 * Usage:
 *   E2E_COVERAGE=true pnpm test:e2e
 *   npx nyc report --reporter=text
 *
 * @see https://playwright.dev/docs/api/class-coverage
 */

import { expect, test as base } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendRoot = path.resolve(__dirname, "../..");
const coverageDir = path.resolve(frontendRoot, ".nyc_output");

const COVERAGE_ENABLED = process.env.E2E_COVERAGE === "true";

export const test = base.extend({
  page: async ({ page }, use) => {
    if (COVERAGE_ENABLED) {
      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
        reportAnonymousScripts: true,
      });
    }

    await use(page);

    if (COVERAGE_ENABLED) {
      const coverage = await page.coverage.stopJSCoverage();

      fs.mkdirSync(coverageDir, { recursive: true });

      const { default: v8toIstanbul } = await import("v8-to-istanbul");

      for (const entry of coverage) {
        if (!entry.url.includes("localhost")) continue;
        if (entry.url.includes("node_modules")) continue;
        if (entry.url.includes("@vite")) continue;
        if (entry.url.includes("@react-refresh")) continue;
        if (!entry.source) continue;

        try {
          const url = new URL(entry.url);
          let relativePath = url.pathname;

          // Remove Vite prefixes like /@fs
          relativePath = relativePath.replace(/^\/@fs/, "");

          // Handle /src/ paths (Vite dev server serves from project root)
          if (relativePath.startsWith("/src/")) {
            relativePath = relativePath.slice(1);
          }

          const absolutePath = path.resolve(frontendRoot, relativePath);

          // Only process files in our src directory
          if (!absolutePath.startsWith(path.join(frontendRoot, "src"))) {
            continue;
          }

          const converter = v8toIstanbul(absolutePath, 0, {
            source: entry.source,
          });
          await converter.load();
          converter.applyCoverage(entry.functions);
          const istanbulCoverage = converter.toIstanbul();

          const filename = `coverage-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
          fs.writeFileSync(
            path.join(coverageDir, filename),
            JSON.stringify(istanbulCoverage),
          );
        } catch (err) {
          // Log but don't fail test on coverage conversion errors
          console.warn(`Coverage conversion warning for ${entry.url}:`, err);
        }
      }
    }
  },
});

export { expect };
