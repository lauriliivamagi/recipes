import type { EntityManager } from "@mikro-orm/core";
import type { WidgetId } from "@template/types";
import { Widget } from "../entities/Widget.js";

/**
 * Repository interface for the Widget aggregate.
 *
 * Key DDD patterns:
 * - Repositories operate on aggregate roots only (Widget, not Gadget directly)
 * - Interface lives in the domain layer; implementation can be swapped for tests
 * - Methods use domain types (WidgetId), not primitives (string)
 * - `findById` populates the gadgets collection — aggregates are always loaded whole
 *
 * Why a repository instead of direct EntityManager access?
 * 1. Handlers don't depend on MikroORM — testable with in-memory fakes
 * 2. Query logic is centralized — "find with gadgets populated" is encoded once
 * 3. Aggregate boundaries are enforced — no ad-hoc partial loads
 *
 * Usage in handlers:
 * ```typescript
 * const repo = new MikroOrmWidgetRepository(getEntityManager());
 * const widget = await repo.findById(id);
 * ```
 */
export interface WidgetRepository {
  findById(id: WidgetId): Promise<Widget | null>;
  findAll(): Promise<Widget[]>;
  save(widget: Widget): Promise<void>;
  remove(widget: Widget): Promise<void>;
}

/**
 * MikroORM implementation of WidgetRepository.
 *
 * Always populates the gadgets collection — the aggregate is loaded whole
 * so invariants can be checked without lazy-loading surprises.
 */
export class MikroOrmWidgetRepository implements WidgetRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: WidgetId): Promise<Widget | null> {
    return this.em.findOne(Widget, { id }, { populate: ["gadgets"] });
  }

  async findAll(): Promise<Widget[]> {
    return this.em.findAll(Widget, {
      populate: ["gadgets"],
      orderBy: { createdAt: "desc" },
    });
  }

  async save(widget: Widget): Promise<void> {
    this.em.persist(widget);
    await this.em.flush();
  }

  async remove(widget: Widget): Promise<void> {
    // Ensure gadgets are loaded so orphanRemoval can cascade.
    // findById() already populates, but guard against direct usage.
    if (!widget.gadgets.isInitialized()) {
      await widget.gadgets.init();
    }
    this.em.remove(widget);
    await this.em.flush();
  }
}
