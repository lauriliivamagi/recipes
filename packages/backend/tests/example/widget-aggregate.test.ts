import { describe, it, expect } from "vitest";
import type { GadgetId } from "@template/types";
import { createEntityId } from "@template/types";
import { Widget, Gadget, MAX_GADGETS_PER_WIDGET } from "../../src/contexts/example/entities/Widget.js";

/**
 * Unit tests for the Widget aggregate root.
 *
 * These test pure domain logic (no database). MikroORM's Collection.add()
 * requires entity metadata (full ORM init), so we use a lightweight fake
 * collection that implements only the API surface the aggregate calls.
 */

/**
 * Minimal collection fake for unit testing without MikroORM metadata.
 * Implements the subset of Collection API used by Widget methods.
 */
class FakeCollection<T> {
  private items: T[] = [];
  get length(): number { return this.items.length; }
  add(item: T): void { this.items.push(item); }
  remove(item: T): void {
    const idx = this.items.indexOf(item);
    if (idx !== -1) this.items.splice(idx, 1);
  }
  getItems(): T[] { return [...this.items]; }
}

/** Helper: create a Widget with a fake gadgets collection for unit testing. */
function createTestWidget(name = "Test Widget"): Widget {
  const result = Widget.create(name);
  if (!result.ok) throw new Error(`Failed to create widget: ${result.error}`);
  const widget = result.value;
  (widget as any).gadgets = new FakeCollection<Gadget>();
  return widget;
}

describe("Widget.create", () => {
  it("creates a widget with valid name", () => {
    const result = Widget.create("My Widget");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeInstanceOf(Widget);
      expect(result.value.name).toBe("My Widget");
      expect(result.value.id).toBeTruthy();
    }
  });

  it("creates a widget with name and description", () => {
    const result = Widget.create("My Widget", "A description");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.description).toBe("A description");
    }
  });

  it("fails with empty name", () => {
    const result = Widget.create("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("required");
  });

  it("fails with invalid description", () => {
    const result = Widget.create("Valid Name", "x".repeat(501));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("500");
  });

  it("generates unique IDs", () => {
    const r1 = Widget.create("A");
    const r2 = Widget.create("B");
    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      expect(r1.value.id).not.toBe(r2.value.id);
    }
  });
});

describe("Widget.rename", () => {
  it("renames with a valid name", () => {
    const widget = createTestWidget();
    const result = widget.rename("New Name");
    expect(result.ok).toBe(true);
    expect(widget.name).toBe("New Name");
  });

  it("fails with empty name", () => {
    const widget = createTestWidget("Original");
    const result = widget.rename("");
    expect(result.ok).toBe(false);
    expect(widget.name).toBe("Original"); // unchanged
  });

  it("trims whitespace from new name", () => {
    const widget = createTestWidget();
    const result = widget.rename("  Trimmed  ");
    expect(result.ok).toBe(true);
    expect(widget.name).toBe("Trimmed");
  });
});

describe("Widget.updateDescription", () => {
  it("sets a new description", () => {
    const widget = createTestWidget();
    const result = widget.updateDescription("New desc");
    expect(result.ok).toBe(true);
    expect(widget.description).toBe("New desc");
  });

  it("clears description with undefined", () => {
    const widget = createTestWidget();
    widget.updateDescription("Some desc");
    const result = widget.updateDescription(undefined);
    expect(result.ok).toBe(true);
    expect(widget.description).toBeUndefined();
  });

  it("fails with description exceeding max length", () => {
    const widget = createTestWidget();
    const result = widget.updateDescription("x".repeat(501));
    expect(result.ok).toBe(false);
  });
});

describe("Widget.addGadget", () => {
  it("adds a gadget with valid label", () => {
    const widget = createTestWidget();
    const result = widget.addGadget("Sprocket");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeInstanceOf(Gadget);
      expect(result.value.label).toBe("Sprocket");
      expect(result.value.widget).toBe(widget);
    }
    expect(widget.gadgets.length).toBe(1);
  });

  it("fails with empty label", () => {
    const widget = createTestWidget();
    const result = widget.addGadget("");
    expect(result.ok).toBe(false);
    expect(widget.gadgets.length).toBe(0);
  });

  it("enforces MAX_GADGETS_PER_WIDGET invariant", () => {
    const widget = createTestWidget();
    for (let i = 0; i < MAX_GADGETS_PER_WIDGET; i++) {
      const r = widget.addGadget(`Gadget ${i}`);
      expect(r.ok).toBe(true);
    }

    // One more should fail
    const result = widget.addGadget("One too many");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(`${MAX_GADGETS_PER_WIDGET}`);
    expect(widget.gadgets.length).toBe(MAX_GADGETS_PER_WIDGET);
  });
});

describe("Widget.removeGadget", () => {
  it("removes an existing gadget", () => {
    const widget = createTestWidget();
    const addResult = widget.addGadget("Sprocket");
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;

    const result = widget.removeGadget(addResult.value.id);
    expect(result.ok).toBe(true);
    expect(widget.gadgets.length).toBe(0);
  });

  it("fails when gadget ID does not exist", () => {
    const widget = createTestWidget();
    const fakeId = createEntityId<GadgetId>("nonexistent");
    const result = widget.removeGadget(fakeId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("not found");
  });
});
