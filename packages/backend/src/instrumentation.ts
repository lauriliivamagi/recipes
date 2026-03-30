import { config } from "dotenv";
import pkg from "../package.json" with { type: "json" };

// Load env before anything else so OTEL_* vars are available
config({ path: "../../.env" });

const otelEnabled = process.env.OTEL_ENABLED === "true";

if (otelEnabled) {
  const { NodeSDK } = await import("@opentelemetry/sdk-node");
  const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
  const { getNodeAutoInstrumentations } = await import("@opentelemetry/auto-instrumentations-node");
  const { resourceFromAttributes } = await import("@opentelemetry/resources");
  const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } =
    await import("@opentelemetry/semantic-conventions");
  const { BetterSqlite3Instrumentation } = await import("opentelemetry-plugin-better-sqlite3");

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "template-backend",
      [ATTR_SERVICE_VERSION]: pkg.version,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-dns": { enabled: false },
      }),
      new BetterSqlite3Instrumentation(),
    ],
  });

  sdk.start();

  const shutdown = () => {
    sdk.shutdown().catch(console.error);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
