import { OpenAPIHono } from "@hono/zod-openapi";
import {
  ListWidgetsHandler,
  CreateWidgetHandler,
  GetWidgetHandler,
  RenameWidgetHandler,
  UpdateDescriptionHandler,
  DeleteWidgetHandler,
  AddGadgetHandler,
  RemoveGadgetHandler,
} from "./WidgetHandlers.js";

/**
 * Exemplar: route wiring for a DDD aggregate.
 *
 * Key patterns:
 * - CRUD routes for the aggregate root (list, create, get, delete)
 * - Semantic action routes replace generic PUT (rename, update-description)
 * - Child entity routes nest under the parent (/widgets/:id/gadgets)
 * - All child mutations go through the aggregate root
 *
 * Import and mount in main.ts or a parent router:
 *   import { widgetsRouter } from "./contexts/example/features/widgets/index.js";
 *   app.route("/api", widgetsRouter);
 */
export const widgetsRouter = new OpenAPIHono();

const list = new ListWidgetsHandler();
const create = new CreateWidgetHandler();
const get = new GetWidgetHandler();
const rename = new RenameWidgetHandler();
const updateDesc = new UpdateDescriptionHandler();
const del = new DeleteWidgetHandler();
const addGadget = new AddGadgetHandler();
const removeGadget = new RemoveGadgetHandler();

// Aggregate root CRUD
widgetsRouter.get("/widgets", (c) => list.execute(c));
widgetsRouter.post("/widgets", (c) => create.execute(c));
widgetsRouter.get("/widgets/:id", (c) => get.execute(c));
widgetsRouter.delete("/widgets/:id", (c) => del.execute(c));

// Semantic actions (replace generic PUT /widgets/:id)
widgetsRouter.post("/widgets/:id/rename", (c) => rename.execute(c));
widgetsRouter.put("/widgets/:id/description", (c) => updateDesc.execute(c));

// Child entity routes (gadgets within a widget aggregate)
widgetsRouter.post("/widgets/:id/gadgets", (c) => addGadget.execute(c));
widgetsRouter.delete("/widgets/:id/gadgets/:gadgetId", (c) => removeGadget.execute(c));
