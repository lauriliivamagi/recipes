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
  const seen = new Set<string>();

  function walk(op: Operation): void {
    for (const ref of op.inputs ?? []) {
      if (seen.has(ref)) continue;
      seen.add(ref);
      const ingredient = ingredientMap.get(ref);
      if (ingredient) {
        result.push(ingredient);
      } else {
        const upstream = operationMap.get(ref);
        if (upstream) {
          walk(upstream);
        }
      }
    }
  }

  walk(operation);
  return result;
}
