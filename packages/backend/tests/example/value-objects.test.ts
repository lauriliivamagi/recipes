import { describe, it, expect } from "vitest";
import {
  createWidgetName,
  createWidgetDescription,
  createGadgetLabel,
  WIDGET_NAME_MAX,
  WIDGET_DESCRIPTION_MAX,
  GADGET_LABEL_MAX,
} from "@template/types";

describe("createWidgetName", () => {
  it("accepts a valid name", () => {
    const result = createWidgetName("My Widget");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("My Widget");
  });

  it("trims whitespace", () => {
    const result = createWidgetName("  padded  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("padded");
  });

  it("rejects empty string", () => {
    const result = createWidgetName("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("required");
  });

  it("rejects whitespace-only string", () => {
    const result = createWidgetName("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("required");
  });

  it("accepts name at max length", () => {
    const result = createWidgetName("a".repeat(WIDGET_NAME_MAX));
    expect(result.ok).toBe(true);
  });

  it("rejects name exceeding max length", () => {
    const result = createWidgetName("a".repeat(WIDGET_NAME_MAX + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(`${WIDGET_NAME_MAX}`);
  });
});

describe("createWidgetDescription", () => {
  it("accepts a valid description", () => {
    const result = createWidgetDescription("A useful widget");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("A useful widget");
  });

  it("trims whitespace", () => {
    const result = createWidgetDescription("  padded  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("padded");
  });

  it("accepts empty string (description is optional content-wise)", () => {
    const result = createWidgetDescription("");
    expect(result.ok).toBe(true);
  });

  it("accepts description at max length", () => {
    const result = createWidgetDescription("a".repeat(WIDGET_DESCRIPTION_MAX));
    expect(result.ok).toBe(true);
  });

  it("rejects description exceeding max length", () => {
    const result = createWidgetDescription("a".repeat(WIDGET_DESCRIPTION_MAX + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(`${WIDGET_DESCRIPTION_MAX}`);
  });
});

describe("createGadgetLabel", () => {
  it("accepts a valid label", () => {
    const result = createGadgetLabel("Sprocket");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("Sprocket");
  });

  it("trims whitespace", () => {
    const result = createGadgetLabel("  padded  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("padded");
  });

  it("rejects empty string", () => {
    const result = createGadgetLabel("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("required");
  });

  it("rejects whitespace-only string", () => {
    const result = createGadgetLabel("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("required");
  });

  it("accepts label at max length", () => {
    const result = createGadgetLabel("a".repeat(GADGET_LABEL_MAX));
    expect(result.ok).toBe(true);
  });

  it("rejects label exceeding max length", () => {
    const result = createGadgetLabel("a".repeat(GADGET_LABEL_MAX + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(`${GADGET_LABEL_MAX}`);
  });
});
