/**
 * MikroORM Custom Types
 *
 * Each branded ID from shared types needs a corresponding MikroORM type
 * so the ORM can convert between TypeScript branded strings and database text.
 *
 * Pattern: one class per branded ID, extending BrandedIdType<T>.
 */

import { BrandedIdType } from "./branded-id.type.js";
import type { WidgetId, GadgetId } from "@template/types";

// =============================================================================
// Exemplar: Widget ID Type
// =============================================================================

export class WidgetIdType extends BrandedIdType<WidgetId> {
  override get name(): string {
    return "WidgetId";
  }
}

// =============================================================================
// Exemplar: Gadget ID Type (child entity of Widget aggregate)
// =============================================================================

export class GadgetIdType extends BrandedIdType<GadgetId> {
  override get name(): string {
    return "GadgetId";
  }
}

// =============================================================================
// Re-exports
// =============================================================================

export { BrandedIdType } from "./branded-id.type.js";
