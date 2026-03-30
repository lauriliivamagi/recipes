/**
 * Playwright global setup — validates backend health before running tests.
 *
 * Retries the health check to allow the webServer time to start.
 * Prevents confusing test failures when the backend isn't ready.
 */
import { HEALTH_CHECK_URL } from "./fixtures";

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2000;

async function globalSetup(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(HEALTH_CHECK_URL);
      if (res.ok) return;
    } catch {
      // Server not ready yet — retry
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error(
    `Backend health check failed after ${MAX_RETRIES} attempts at ${HEALTH_CHECK_URL}`,
  );
}

export default globalSetup;
