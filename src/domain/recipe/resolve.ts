import type { Ingredient, Operation, Recipe } from './types.js';

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}

export function resolveIngredients(operation: Operation, recipe: Recipe): Ingredient[] {
  const ingredientMap = indexById(recipe.ingredients ?? []);
  const operationMap = indexById(recipe.operations ?? []);
  const result: Ingredient[] = [];
  const seenIngredients = new Set<string>();
  const seenOps = new Set<string>();

  function walk(op: Operation): void {
    // Collect direct ingredient references
    for (const ref of op.ingredients) {
      if (seenIngredients.has(ref)) continue;
      seenIngredients.add(ref);
      const ingredient = ingredientMap.get(ref);
      if (ingredient) {
        result.push(ingredient);
      }
    }
    // Walk upstream operations
    for (const ref of op.depends) {
      if (seenOps.has(ref)) continue;
      seenOps.add(ref);
      const upstream = operationMap.get(ref);
      if (upstream) {
        walk(upstream);
      }
    }
  }

  walk(operation);
  return result;
}
