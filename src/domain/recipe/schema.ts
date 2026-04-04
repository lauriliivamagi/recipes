import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const languagePattern = /^[a-z]{2}$/;

const recipeMetaSchema = z.object({
  title: z.string(),
  slug: z.string().regex(slugPattern),
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

const ingredientSchema = z.object({
  id: z.string().regex(slugPattern),
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  group: z.string(),
}).strict();

const equipmentSchema = z.object({
  id: z.string().regex(slugPattern),
  name: z.string(),
  count: z.number(),
}).strict();

const operationEquipmentSchema = z.object({
  use: z.string(),
  release: z.boolean(),
}).strict();

const operationSchema = z.object({
  id: z.string().regex(slugPattern),
  type: z.enum(['prep', 'cook']),
  action: z.string(),
  inputs: z.array(z.string()).min(1),
  equipment: operationEquipmentSchema.optional(),
  time: z.number(),
  activeTime: z.number(),
  scalable: z.boolean().optional(),
  heat: z.string().optional(),
  details: z.string().optional(),
  output: z.string().optional(),
}).strict();

const subProductSchema = z.object({
  id: z.string().regex(slugPattern),
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
