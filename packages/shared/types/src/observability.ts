/**
 * Shared span attribute constants for OpenTelemetry instrumentation.
 * Use these across frontend and backend to ensure consistent attribute naming.
 */
export const SpanAttrs = {
  // XState state machine tracing
  XSTATE_MACHINE: "xstate.machine",
  XSTATE_FROM_STATE: "xstate.from_state",
  XSTATE_TO_STATE: "xstate.to_state",
  XSTATE_EVENT: "xstate.event",

  // Domain-level attributes (examples for template consumers)
  ENTITY_TYPE: "app.entity_type",
  ENTITY_ID: "app.entity_id",
  OPERATION: "app.operation",
} as const;
