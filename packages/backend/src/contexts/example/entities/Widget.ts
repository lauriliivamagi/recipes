import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Cascade,
} from "@mikro-orm/core";
import type {
  WidgetId,
  GadgetId,
  WidgetName,
  WidgetDescription,
  GadgetLabel,
  Result,
} from "@template/types";
import {
  createEntityId,
  createWidgetName,
  createWidgetDescription,
  createGadgetLabel,
  Ok,
  Err,
} from "@template/types";
import { WidgetIdType, GadgetIdType } from "../../../db/types/index.js";

/**
 * Widget — Aggregate Root exemplar.
 *
 * Key DDD patterns demonstrated:
 * - **Aggregate root**: Widget owns the Gadget collection. All mutations to
 *   gadgets go through Widget methods, enforcing invariants.
 * - **Value objects**: name (WidgetName) and description (WidgetDescription)
 *   carry validation rules — no raw primitives in the domain.
 * - **Rich model**: Business logic lives in the entity (rename, addGadget,
 *   removeGadget), not in service/handler classes.
 * - **Factory method**: `Widget.create()` returns `Result<Widget>` — creation
 *   can fail with a domain error instead of throwing.
 * - **Invariant enforcement**: MAX_GADGETS limit is checked inside the aggregate.
 *
 * MikroORM patterns:
 * - Branded ID type via BrandedIdType<WidgetId> for compile-time safety
 * - Always specify `type` in @Property() — esbuild strips decorator metadata
 * - orphanRemoval: true on OneToMany for cascade delete of child entities
 *
 * Registered in mikro-orm.config.ts. When adding new entities, add them
 * to the entities array in mikro-orm.config.ts AND orm-test-setup.ts.
 */

/** Maximum gadgets per widget — enforced by the aggregate. */
export const MAX_GADGETS_PER_WIDGET = 20;

@Entity()
export class Widget {
  @PrimaryKey({ type: WidgetIdType })
  id!: WidgetId;

  @Property({ type: "text" })
  name!: WidgetName;

  @Property({ type: "text", nullable: true })
  description?: WidgetDescription;

  @Property({ type: "datetime" })
  createdAt: Date = new Date();

  @Property({ type: "datetime", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  /**
   * Child collection — only mutate through aggregate methods (addGadget, removeGadget).
   * orphanRemoval ensures removed gadgets are deleted from the database.
   * Always populate this collection before deleting the widget.
   */
  @OneToMany(() => Gadget, (g) => g.widget, { cascade: [Cascade.ALL], orphanRemoval: true })
  gadgets = new Collection<Gadget>(this);

  // ===========================================================================
  // Factory
  // ===========================================================================

  static generateId(): WidgetId {
    return createEntityId<WidgetId>(crypto.randomUUID());
  }

  /**
   * Create a new Widget aggregate. Validates all inputs via value objects.
   *
   * Usage:
   * ```typescript
   * const result = Widget.create("My Widget", "Optional description");
   * if (!result.ok) return c.json(errorResponse(result.error), 400);
   * em.persist(result.value);
   * ```
   */
  static create(name: string, description?: string): Result<Widget> {
    const nameResult = createWidgetName(name);
    if (!nameResult.ok) return nameResult;

    const widget = new Widget();
    widget.id = Widget.generateId();
    widget.name = nameResult.value;

    if (description !== undefined) {
      const descResult = createWidgetDescription(description);
      if (!descResult.ok) return descResult;
      widget.description = descResult.value;
    }

    return Ok(widget);
  }

  // ===========================================================================
  // Semantic actions (rich domain model — logic lives in the entity)
  // ===========================================================================

  /**
   * Rename the widget. Validates the new name via the WidgetName value object.
   *
   * Replaces generic `widget.name = x` assignment with a semantic action that
   * enforces invariants. Handlers call `widget.rename(newName)` instead of
   * setting properties directly.
   */
  rename(newName: string): Result<void> {
    const result = createWidgetName(newName);
    if (!result.ok) return result;
    this.name = result.value;
    return Ok(undefined);
  }

  /**
   * Update the description. Validates via WidgetDescription value object.
   */
  updateDescription(newDescription: string | undefined): Result<void> {
    if (newDescription === undefined) {
      this.description = undefined;
      return Ok(undefined);
    }
    const result = createWidgetDescription(newDescription);
    if (!result.ok) return result;
    this.description = result.value;
    return Ok(undefined);
  }

  /**
   * Add a gadget to this widget. Enforces the MAX_GADGETS invariant.
   *
   * This is the ONLY way to create a Gadget — the child entity's constructor
   * is not exposed. All gadget creation goes through the aggregate root.
   */
  addGadget(label: string): Result<Gadget> {
    if (this.gadgets.length >= MAX_GADGETS_PER_WIDGET) {
      return Err(`Widget cannot have more than ${MAX_GADGETS_PER_WIDGET} gadgets`);
    }

    const labelResult = createGadgetLabel(label);
    if (!labelResult.ok) return labelResult;

    const gadget = new Gadget();
    gadget.id = createEntityId<GadgetId>(crypto.randomUUID());
    gadget.label = labelResult.value;
    gadget.widget = this;
    this.gadgets.add(gadget);

    return Ok(gadget);
  }

  /**
   * Remove a gadget by ID. orphanRemoval will delete it on flush.
   */
  removeGadget(gadgetId: GadgetId): Result<void> {
    const gadget = this.gadgets.getItems().find((g) => g.id === gadgetId);
    if (!gadget) {
      return Err("Gadget not found in this widget");
    }
    this.gadgets.remove(gadget);
    return Ok(undefined);
  }
}

/**
 * Gadget — child entity within the Widget aggregate.
 *
 * Key patterns:
 * - Owned by Widget aggregate — created/removed only through Widget methods
 * - ManyToOne FK serializes as the property name (`widget`), not `widgetId`
 * - Uses branded GadgetId for type-safe references
 * - Uses GadgetLabel value object for validated label
 */
@Entity()
export class Gadget {
  @PrimaryKey({ type: GadgetIdType })
  id!: GadgetId;

  @Property({ type: "text" })
  label!: GadgetLabel;

  @ManyToOne(() => Widget, { type: "Widget" })
  widget!: Widget;

  @Property({ type: "datetime" })
  createdAt: Date = new Date();
}
