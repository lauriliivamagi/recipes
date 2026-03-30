import { trace, type Span } from "@opentelemetry/api";
import type { InspectionEvent } from "xstate";
import { SpanAttrs } from "@template/types";

const tracer = trace.getTracer("template-frontend");

/** Emit a point-in-time span (not a parent context). */
function emitSpan(name: string, setAttrs: (span: Span) => void): void {
  const span = tracer.startSpan(name);
  setAttrs(span);
  span.end();
}

/**
 * XState v5 inspection observer that emits OTel spans for state transitions.
 * Uses startSpan (not startActiveSpan) because these are point-in-time
 * observations, not parent contexts for child spans.
 */
const otelInspector = {
  next(event: InspectionEvent) {
    if (event.type === "@xstate.event") {
      emitSpan("xstate.event", (span) => {
        span.setAttribute(SpanAttrs.XSTATE_MACHINE, event.actorRef.sessionId);
        span.setAttribute(SpanAttrs.XSTATE_EVENT, String(event.event.type));
      });
    }

    if (event.type === "@xstate.snapshot") {
      const snapshot = event.snapshot;
      const stateValue =
        snapshot && "value" in snapshot
          ? typeof snapshot.value === "string"
            ? snapshot.value
            : JSON.stringify(snapshot.value)
          : "unknown";

      emitSpan("xstate.snapshot", (span) => {
        span.setAttribute(SpanAttrs.XSTATE_MACHINE, event.actorRef.sessionId);
        span.setAttribute(SpanAttrs.XSTATE_TO_STATE, stateValue);
        span.setAttribute(SpanAttrs.XSTATE_EVENT, String(event.event.type));
      });
    }
  },
};

/**
 * Conditional inspect option: pass to createActor/createActorContext.
 * Returns the inspector when OTel is enabled, undefined otherwise.
 */
export const otelInspect = import.meta.env.VITE_OTEL_ENABLED === "true" ? otelInspector : undefined;
