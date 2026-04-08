import { recipeSchema } from './schema.js';
import { validateDag } from '../schedule/dag.js';
import type { Recipe } from './types.js';

/**
 * Parse and validate a recipe from raw JSON input.
 *
 * This is the single entry point for creating Recipe objects.
 * It guarantees both structural validity (Zod schema) and
 * semantic validity (DAG: no cycles, no dangling refs, no
 * equipment conflicts). Code that receives a Recipe from this
 * function can trust it is fully valid.
 */
export function parseRecipe(json: unknown): Recipe {
  // 1. Structural validation + value-object transforms
  const result = recipeSchema.safeParse(json);
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid recipe: ${messages}`);
  }
  const recipe = result.data as Recipe;

  // 2. Semantic validation — DAG invariants
  const dagResult = validateDag(recipe);
  if (!dagResult.valid) {
    throw new Error(
      `Invalid recipe DAG: ${dagResult.errors.join('; ')}`,
    );
  }

  return recipe;
}
