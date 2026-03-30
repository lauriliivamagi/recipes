import { z } from "zod";
import {
  WIDGET_NAME_MIN,
  WIDGET_NAME_MAX,
  WIDGET_DESCRIPTION_MAX,
  GADGET_LABEL_MIN,
  GADGET_LABEL_MAX,
} from "@template/types";

/**
 * Exemplar: Zod schemas for HTTP input validation.
 *
 * These validate the *shape* of incoming JSON. Domain rules (business invariants)
 * are enforced by value objects and the aggregate root — not here.
 *
 * The min/max constants come from shared types so API validation stays in sync
 * with domain validation without duplicating magic numbers.
 *
 * Zod v4 note: error access is `result.error.issues[0].message`,
 * not `.errors[0].message`.
 */

export const CreateWidgetSchema = z.object({
  name: z.string().min(WIDGET_NAME_MIN, "Name is required").max(WIDGET_NAME_MAX),
  description: z.string().max(WIDGET_DESCRIPTION_MAX).optional(),
});

export const RenameWidgetSchema = z.object({
  name: z.string().min(WIDGET_NAME_MIN, "Name is required").max(WIDGET_NAME_MAX),
});

export const UpdateDescriptionSchema = z.object({
  description: z.string().max(WIDGET_DESCRIPTION_MAX).optional(),
});

export const AddGadgetSchema = z.object({
  label: z.string().min(GADGET_LABEL_MIN, "Label is required").max(GADGET_LABEL_MAX),
});
