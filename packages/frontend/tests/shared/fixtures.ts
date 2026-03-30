/**
 * Test fixtures — shared constants and test data for Playwright E2E tests.
 *
 * Convention:
 *   - TIMEOUTS: named wait durations (prefer over magic numbers in specs)
 *   - BACKEND_URL / HEALTH_CHECK_URL: configurable via env
 *   - TEST_DATA: domain-specific test data (Widget/Gadget examples)
 */

// ---------- Timeouts ----------

export const TIMEOUTS = {
  /** Short UI wait (animations, debounce) */
  shortWait: 1000,
  /** Medium wait (API round-trips) */
  mediumWait: 3000,
  /** Long wait (slow API calls, lazy loading) */
  longWait: 10000,
  /** Heavy operations (batch processing, large payloads) */
  heavyOperation: 10000,
};

// ---------- Backend URLs ----------

export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8888";
export const HEALTH_CHECK_URL = `${BACKEND_URL}/health`;

// ---------- Domain Test Data ----------

export const TEST_DATA = {
  widget: {
    name: "Test Widget",
    description: "A widget created by E2E tests",
    renamedName: "Renamed Widget",
  },
  gadget: {
    label: "Test Gadget",
  },
};
