import { z } from 'zod';
import type {
  OperationId,
  IngredientId,
  EquipmentId,
  SubProductId,
  RecipeSlug,
  Quantity,
} from './types.js';

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const languagePattern = /^[a-z]{2}$/;

// ---------------------------------------------------------------------------
// ID schemas — cast to branded types at parse time
// ---------------------------------------------------------------------------
const operationIdSchema = z.string().regex(slugPattern).transform(s => s as OperationId);
const ingredientIdSchema = z.string().regex(slugPattern).transform(s => s as IngredientId);
const equipmentIdSchema = z.string().regex(slugPattern).transform(s => s as EquipmentId);
const subProductIdSchema = z.string().regex(slugPattern).transform(s => s as SubProductId);
const recipeSlugSchema = z.string().regex(slugPattern).transform(s => s as RecipeSlug);

// ---------------------------------------------------------------------------
// Value object schemas
// ---------------------------------------------------------------------------

/**
 * Ingredient schema: JSON input has flat `quantity` + `unit` fields.
 * Transform merges them into a Quantity value object.
 */
const ingredientSchema = z.object({
  id: ingredientIdSchema,
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  group: z.string(),
}).strict().transform(({ quantity, unit, ...rest }) => ({
  ...rest,
  quantity: { amount: quantity, unit } as Quantity,
}));

// ---------------------------------------------------------------------------
// Other schemas
// ---------------------------------------------------------------------------

const recipeMetaSchema = z.object({
  title: z.string(),
  slug: recipeSlugSchema,
  language: z.string().regex(languagePattern),
  source: z.string().startsWith('http').optional(),
  originalText: z.string(),
  tags: z.array(z.string()),
  servings: z.number().positive(),
  totalTime: z.object({
    relaxed: z.number().nonnegative(),
    optimized: z.number().nonnegative(),
  }).strict(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  notes: z.string().optional(),
}).strict();

const equipmentSchema = z.object({
  id: equipmentIdSchema,
  name: z.string(),
  count: z.number(),
}).strict();

const operationEquipmentSchema = z.object({
  use: equipmentIdSchema,
  release: z.boolean(),
}).strict();

const operationSchema = z.object({
  id: operationIdSchema,
  type: z.enum(['prep', 'cook']),
  action: z.string(),
  inputs: z.array(z.string()),
  equipment: operationEquipmentSchema.optional(),
  time: z.number(),
  activeTime: z.number(),
  scalable: z.boolean().optional(),
  heat: z.string().optional(),
  details: z.string().optional(),
  output: z.string().optional(),
}).strict();

const subProductSchema = z.object({
  id: subProductIdSchema,
  name: z.string(),
  finalOp: z.string(),
}).strict();

const finishStepSchema = z.object({
  action: z.string(),
  inputs: z.array(z.string()),
  details: z.string().optional(),
}).strict();

export const recipeSchema = z.object({
  meta: recipeMetaSchema,
  ingredients: z.array(ingredientSchema).min(1),
  equipment: z.array(equipmentSchema),
  operations: z.array(operationSchema).min(1),
  subProducts: z.array(subProductSchema),
  finishSteps: z.array(finishStepSchema).min(1),
}).strict();
