import { recipeSchema } from './schema.js';
import type { Recipe } from './types.js';

export function parseRecipe(json: unknown): Recipe {
  const result = recipeSchema.safeParse(json);
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid recipe: ${messages}`);
  }
  return result.data as Recipe;
}
