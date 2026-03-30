/// <reference types="vite/client" />
import { WebTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";

const enabled = import.meta.env.VITE_OTEL_ENABLED === "true";

if (enabled) {
  const exporterUrl = import.meta.env.VITE_OTEL_EXPORTER_URL || "/v1/traces";
  const exporter = new OTLPTraceExporter({ url: exporterUrl });
  const batchProcessor = new BatchSpanProcessor(exporter, {
    // Flush every 2s instead of the default 5s so short-lived spans
    // (XState events, quick navigations) are exported before page unload.
    scheduledDelayMillis: 2000,
  });

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "template-frontend",
      [ATTR_SERVICE_VERSION]: __APP_VERSION__,
    }),
    spanProcessors: [batchProcessor],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new UserInteractionInstrumentation(),
      new FetchInstrumentation({
        // In dev, Vite proxies /api to backend (same origin), so traceparent
        // is injected automatically. For cross-origin setups, add URL patterns:
        // propagateTraceHeaderCorsUrls: [/your-api-domain\.com/],
      }),
      new XMLHttpRequestInstrumentation(),
    ],
  });

  // Flush pending spans on page hide/unload so short-lived spans
  // (XState events, quick navigations) aren't lost.
  const flush = () => batchProcessor.forceFlush();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("beforeunload", flush);
}
