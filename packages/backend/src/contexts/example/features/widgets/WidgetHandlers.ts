import type { Context } from "hono";
import type { WidgetId, GadgetId } from "@template/types";
import { createEntityId } from "@template/types";
import { getEntityManager } from "../../../../db/orm.js";
import { Widget } from "../../entities/Widget.js";
import { MikroOrmWidgetRepository } from "../../repositories/WidgetRepository.js";
import { successResponse, errorResponse } from "../../../../schemas/common.js";
import {
  CreateWidgetSchema,
  RenameWidgetSchema,
  UpdateDescriptionSchema,
  AddGadgetSchema,
} from "./WidgetSchemas.js";

/**
 * Exemplar: handlers for the Widget aggregate.
 *
 * DDD patterns demonstrated:
 * - Handlers use WidgetRepository (not EntityManager directly)
 * - Creation delegates to `Widget.create()` (factory with Result return)
 * - Mutations call semantic domain methods (rename, addGadget, removeGadget)
 *   instead of setting properties directly
 * - Zod validates HTTP shape; domain methods validate business rules
 * - Child entity (Gadget) mutations go through the aggregate root
 *
 * Pattern:
 * - Each handler is a class with an execute(c: Context) method
 * - Validation uses Zod schemas from the sibling Schemas file
 * - Responses use the shared successResponse/errorResponse helpers
 *
 * Note: Handlers instantiate MikroOrmWidgetRepository directly for simplicity.
 * In a production codebase, inject the WidgetRepository interface via constructor
 * or a factory to enable testing with in-memory fakes.
 */

export class ListWidgetsHandler {
  async execute(c: Context): Promise<Response> {
    const repo = new MikroOrmWidgetRepository(getEntityManager());
    const widgets = await repo.findAll();
    return c.json(successResponse(widgets));
  }
}

export class CreateWidgetHandler {
  async execute(c: Context): Promise<Response> {
    const body = await c.req.json();
    const result = CreateWidgetSchema.safeParse(body);

    if (!result.success) {
      return c.json(errorResponse(result.error.issues[0].message), 400);
    }

    // Widget.create() validates via value objects and returns Result
    const widgetResult = Widget.create(result.data.name, result.data.description);
    if (!widgetResult.ok) {
      return c.json(errorResponse(widgetResult.error), 400);
    }

    const repo = new MikroOrmWidgetRepository(getEntityManager());
    await repo.save(widgetResult.value);

    return c.json(successResponse(widgetResult.value), 201);
  }
}

export class GetWidgetHandler {
  async execute(c: Context): Promise<Response> {
    const id = createEntityId<WidgetId>(c.req.param("id"));
    const repo = new MikroOrmWidgetRepository(getEntityManager());
    const widget = await repo.findById(id);

    if (!widget) {
      return c.json(errorResponse("Widget not found"), 404);
    }

    return c.json(successResponse(widget));
  }
}

/**
 * Semantic action: rename a widget.
 *
 * Replaces generic PUT /widgets/:id with a specific domain operation.
 * The Widget entity validates the new name via the WidgetName value object.
 */
export class RenameWidgetHandler {
  async execute(c: Context): Promise<Response> {
    const id = createEntityId<WidgetId>(c.req.param("id"));
    const body = await c.req.json();
    const result = RenameWidgetSchema.safeParse(body);

    if (!result.success) {
      return c.json(errorResponse(result.error.issues[0].message), 400);
    }

    const repo = new MikroOrmWidgetRepository(getEntityManager());
    const widget = await repo.findById(id);

    if (!widget) {
      return c.json(errorResponse("Widget not found"), 404);
    }

    // Semantic action: widget validates the name internally
    const renameResult = widget.rename(result.data.name);
    if (!renameResult.ok) {
      return c.json(errorResponse(renameResult.error), 400);
    }

    await repo.save(widget);
    return c.json(successResponse(widget));
  }
}

/**
 * Semantic action: update widget description.
 */
export class UpdateDescriptionHandler {
  async execute(c: Context): Promise<Response> {
    const id = createEntityId<WidgetId>(c.req.param("id"));
    const body = await c.req.json();
    const result = UpdateDescriptionSchema.safeParse(body);

    if (!result.success) {
      return c.json(errorResponse(result.error.issues[0].message), 400);
    }

    const repo = new MikroOrmWidgetRepository(getEntityManager());
    const widget = await repo.findById(id);

    if (!widget) {
      return c.json(errorResponse("Widget not found"), 404);
    }

    const descResult = widget.updateDescription(result.data.description);
    if (!descResult.ok) {
      return c.json(errorResponse(descResult.error), 400);
    }

    await repo.save(widget);
    return c.json(successResponse(widget));
  }
}

export class DeleteWidgetHandler {
  async execute(c: Context): Promise<Response> {
    const id = createEntityId<WidgetId>(c.req.param("id"));
    const repo = new MikroOrmWidgetRepository(getEntityManager());
    // Repository loads with gadgets populated (needed for orphanRemoval)
    const widget = await repo.findById(id);

    if (!widget) {
      return c.json(errorResponse("Widget not found"), 404);
    }

    await repo.remove(widget);
    return c.json(successResponse({ deleted: true }));
  }
}

// =============================================================================
// Gadget handlers — mutations go through the Widget aggregate root
// =============================================================================

/**
 * Add a gadget to a widget. Enforces MAX_GADGETS invariant via aggregate.
 *
 * Key DDD pattern: Gadget is a child entity — it can only be created through
 * the aggregate root. There is no standalone "create gadget" endpoint.
 */
export class AddGadgetHandler {
  async execute(c: Context): Promise<Response> {
    const widgetId = createEntityId<WidgetId>(c.req.param("id"));
    const body = await c.req.json();
    const result = AddGadgetSchema.safeParse(body);

    if (!result.success) {
      return c.json(errorResponse(result.error.issues[0].message), 400);
    }

    const repo = new MikroOrmWidgetRepository(getEntityManager());
    const widget = await repo.findById(widgetId);

    if (!widget) {
      return c.json(errorResponse("Widget not found"), 404);
    }

    // Aggregate root enforces MAX_GADGETS invariant
    const gadgetResult = widget.addGadget(result.data.label);
    if (!gadgetResult.ok) {
      return c.json(errorResponse(gadgetResult.error), 400);
    }

    await repo.save(widget);
    return c.json(successResponse(gadgetResult.value), 201);
  }
}

/**
 * Remove a gadget from a widget. orphanRemoval deletes it on flush.
 */
export class RemoveGadgetHandler {
  async execute(c: Context): Promise<Response> {
    const widgetId = createEntityId<WidgetId>(c.req.param("id"));
    const gadgetId = createEntityId<GadgetId>(c.req.param("gadgetId"));

    const repo = new MikroOrmWidgetRepository(getEntityManager());
    const widget = await repo.findById(widgetId);

    if (!widget) {
      return c.json(errorResponse("Widget not found"), 404);
    }

    const removeResult = widget.removeGadget(gadgetId);
    if (!removeResult.ok) {
      return c.json(errorResponse(removeResult.error), 404);
    }

    await repo.save(widget);
    return c.json(successResponse({ deleted: true }));
  }
}
