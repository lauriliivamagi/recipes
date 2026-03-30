/**
 * Branded ID type for type-safe entity references.
 * Usage: type UserId = EntityId<"User">;
 */
export type EntityId<Brand extends string = string> = string & { readonly __brand: Brand };

/**
 * Factory to create a branded ID from a plain string.
 * Usage: const id = createEntityId<WidgetId>(crypto.randomUUID());
 */
export function createEntityId<T extends EntityId>(value: string): T {
  return value as T;
}

/**
 * Exemplar branded IDs — add your own following this pattern.
 */
export type WidgetId = EntityId<"Widget">;
export type GadgetId = EntityId<"Gadget">;

/**
 * Base entity shape shared across all domain entities.
 * Extend this for your domain models.
 */
export interface BaseEntity<TId extends EntityId = EntityId> {
  id: TId;
  createdAt: Date;
  updatedAt: Date;
}
