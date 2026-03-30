import { defineConfig, devices } from "@playwright/test";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const FRONTEND_PORT = process.env.FRONTEND_PORT || "3000";
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/shared/global-setup.ts",

  // Shared SQLite database prevents parallel test files
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  outputDir: "test-results",
  preserveOutput: "failures-only",
  timeout: 30000,

  // CI Artifacts:
  //   - playwright-report/         → HTML report (upload as artifact)
  //   - test-results/              → traces, screenshots, videos (upload on failure)
  //   - test-results/results.json  → JSON results for dashboards
  reporter: process.env.CI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
        ["json", { outputFile: "test-results/results.json" }],
        ["github"],
      ]
    : [["html", { open: "on-failure" }]],

  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },

  use: {
    baseURL: FRONTEND_URL,
    testIdAttribute: "data-testid",
    // Local dev: traces on every failure for fast debugging
    // CI: traces only on retry to save disk
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    // Uncomment to enable cross-browser testing (increases CI time):
    // Note: E2E_COVERAGE=true is Chromium-only (V8 coverage API).
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  // Both backend and frontend are started automatically.
  // If servers are already running, they will be reused (in dev, not CI).
  webServer: [
    {
      command: "pnpm run dev",
      url: "http://localhost:8888/health",
      cwd: "../backend",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: "pnpm run dev",
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
