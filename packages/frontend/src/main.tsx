import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "@/App";

// Defer OTel so it doesn't block initial render.
// DocumentLoadInstrumentation reads performance.getEntriesByType() retroactively,
// so deferring by one idle callback doesn't lose document load metrics.
const loadTelemetry = () => void import("./telemetry");
if ("requestIdleCallback" in window) {
  requestIdleCallback(loadTelemetry);
} else {
  setTimeout(loadTelemetry, 0);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
);
