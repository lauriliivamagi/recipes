export type { ApiRequest, ApiResponse, ErrorResponse } from "./api.js";
export type { EntityId, BaseEntity, WidgetId, GadgetId } from "./domain.js";
export { createEntityId } from "./domain.js";
export type { Result } from "./result.js";
export { Ok, Err } from "./result.js";
export type { WidgetName, WidgetDescription, GadgetLabel } from "./value-objects.js";
export {
  createWidgetName,
  createWidgetDescription,
  createGadgetLabel,
  WIDGET_NAME_MIN,
  WIDGET_NAME_MAX,
  WIDGET_DESCRIPTION_MAX,
  GADGET_LABEL_MIN,
  GADGET_LABEL_MAX,
} from "./value-objects.js";
export { APP_CONSTANTS } from "./constants.js";
export { SpanAttrs } from "./observability.js";
