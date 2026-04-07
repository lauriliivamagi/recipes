import { z } from 'zod';
import type { RecipeSlug } from '../recipe/types.js';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const recipeSlugSchema = z.string().regex(slugPattern).transform(s => s as RecipeSlug);

// ---------------------------------------------------------------------------
// Pool schema — floating meals with expiration-aware sorting
// ---------------------------------------------------------------------------

const poolMealSchema = z.object({
  slug: recipeSlugSchema.describe('Recipe slug referencing a recipe in the catalog'),
  addedAt: z.string().regex(isoDatePattern).describe('ISO 8601 date when the meal was added to the pool (YYYY-MM-DD)'),
  cookedAt: z.string().regex(isoDatePattern).optional().describe('ISO 8601 date when the meal was cooked — absent means still in pool'),
}).strict();

export const poolSchema = z.object({
  createdAt: z.string().regex(isoDatePattern).describe('ISO 8601 date marking the start of this pool cycle'),
  meals: z.array(poolMealSchema).describe('Meals in the pool — order is not significant, UI sorts by freshness/urgency'),
}).strict().describe('Weekly meal pool — floating meals with no day assignments');

// ---------------------------------------------------------------------------
// Theme Nights schema — cuisine per weekday
// ---------------------------------------------------------------------------

const themeDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

const themeEntrySchema = z.string().min(1).describe('Cuisine theme for this day (e.g., "Pasta", "Tacos")');

export const themeNightsSchema = z.object({
  themes: z.object({
    monday: themeEntrySchema.optional(),
    tuesday: themeEntrySchema.optional(),
    wednesday: themeEntrySchema.optional(),
    thursday: themeEntrySchema.optional(),
    friday: themeEntrySchema.optional(),
  }).strict().describe('Map of weekday to cuisine theme. Unassigned days are omitted.'),
}).strict().describe('Theme night configuration — cuisine per weekday to reduce decision fatigue');

export { themeDays };

// ---------------------------------------------------------------------------
// Staples schema — always-stocked ingredients excluded from lists
// ---------------------------------------------------------------------------

const stapleItemSchema = z.object({
  name: z.string().min(1).describe('Ingredient name as it appears in recipes (e.g., "salt", "olive oil")'),
  group: z.string().min(1).describe('Category matching ingredient.group for deduplication (e.g., "pantry", "spices")'),
}).strict();

export const staplesSchema = z.object({
  items: z.array(stapleItemSchema).describe('Ingredients the household always has — excluded from generated shopping lists'),
}).strict().describe('Always-stocked pantry items excluded from shopping list generation');
