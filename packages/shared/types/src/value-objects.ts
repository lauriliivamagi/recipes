/**
 * Exemplar Value Objects — domain types that carry validation rules.
 *
 * Value objects replace "primitive obsession" (e.g., `name: string`) with
 * semantic types that enforce business rules at creation time.
 *
 * Key patterns:
 * - Branded types for compile-time safety (cannot pass raw string where WidgetName expected)
 * - Factory functions return Result<T> to make failure explicit (no thrown exceptions)
 * - Validation rules live here, not in Zod schemas — Zod validates HTTP input shape,
 *   value objects validate domain rules
 * - Immutable by design — no setters, create a new value to change
 *
 * Usage:
 * ```typescript
 * const result = Widget.create(rawName, rawDescription);
 * if (!result.ok) return c.json(errorResponse(result.error), 400);
 * em.persist(result.value);
 * ```
 */

import type { Result } from "./result.js";
import { Ok, Err } from "./result.js";

// =============================================================================
// WidgetName — validated widget display name
// =============================================================================

export type WidgetName = string & { readonly __brand: "WidgetName" };

export const WIDGET_NAME_MIN = 1;
export const WIDGET_NAME_MAX = 100;

export function createWidgetName(value: string): Result<WidgetName> {
  const trimmed = value.trim();
  if (trimmed.length < WIDGET_NAME_MIN) {
    return Err("Widget name is required");
  }
  if (trimmed.length > WIDGET_NAME_MAX) {
    return Err(`Widget name must be at most ${WIDGET_NAME_MAX} characters`);
  }
  return Ok(trimmed as WidgetName);
}

// =============================================================================
// WidgetDescription — optional validated description
// =============================================================================

export type WidgetDescription = string & { readonly __brand: "WidgetDescription" };

export const WIDGET_DESCRIPTION_MAX = 500;

export function createWidgetDescription(value: string): Result<WidgetDescription> {
  const trimmed = value.trim();
  if (trimmed.length > WIDGET_DESCRIPTION_MAX) {
    return Err(`Widget description must be at most ${WIDGET_DESCRIPTION_MAX} characters`);
  }
  return Ok(trimmed as WidgetDescription);
}

// =============================================================================
// GadgetLabel — validated gadget display label
// =============================================================================

export type GadgetLabel = string & { readonly __brand: "GadgetLabel" };

export const GADGET_LABEL_MIN = 1;
export const GADGET_LABEL_MAX = 100;

export function createGadgetLabel(value: string): Result<GadgetLabel> {
  const trimmed = value.trim();
  if (trimmed.length < GADGET_LABEL_MIN) {
    return Err("Gadget label is required");
  }
  if (trimmed.length > GADGET_LABEL_MAX) {
    return Err(`Gadget label must be at most ${GADGET_LABEL_MAX} characters`);
  }
  return Ok(trimmed as GadgetLabel);
}
