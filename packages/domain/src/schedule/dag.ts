import type { Recipe } from '../recipe/types.js';
import type { SchedulableOperation } from '../shared/types.js';

export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

export function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return map;
}

export function validateDag(recipe: Recipe): ValidationResult {
  const errors: string[] = [];
  const ingredients = recipe.ingredients || [];
  const operations = recipe.operations || [];
  const ingredientMap = indexById(ingredients);
  const operationMap = indexById(operations);

  // 1a. Check all ingredient references resolve
  for (const op of operations) {
    for (const ref of op.ingredients || []) {
      if (!ingredientMap.has(ref)) {
        errors.push(
          `Operation "${op.id}": ingredient "${ref}" does not match any ingredient ID.`,
        );
      }
    }
  }

  // 1b. Check all dependency references resolve
  for (const op of operations) {
    for (const ref of op.depends || []) {
      if (!operationMap.has(ref)) {
        errors.push(
          `Operation "${op.id}": dependency "${ref}" does not match any operation ID.`,
        );
      }
    }
  }

  // 2. Cycle detection via Kahn's algorithm
  const sorted = topoSort(operations);
  if (sorted.length !== operations.length) {
    const inCycle = operations
      .filter((op) => !sorted.includes(op.id))
      .map((op) => op.id);
    errors.push(`Cycle detected among operations: ${inCycle.join(', ')}.`);
  }

  // 3. Equipment conflict detection
  const equipmentHolder = new Map<string, string>();
  for (const opId of sorted) {
    const op = operationMap.get(opId)!;
    for (const eq of op.equipment) {
      const eqId = eq.use;
      const holder = equipmentHolder.get(eqId);
      if (holder) {
        const isChained = (op.depends || []).some(d => d === holder);
        if (!isChained) {
          errors.push(
            `Equipment conflict: "${eqId}" is held by "${holder}" (release: false) but "${op.id}" also needs it and is not a direct successor.`,
          );
        }
      }
      if (eq.release) {
        equipmentHolder.delete(eqId);
      } else {
        equipmentHolder.set(eqId, op.id);
      }
    }
  }

  if (errors.length > 0) return { valid: false as const, errors };
  return { valid: true as const };
}

/**
 * Topological sort using Kahn's algorithm.
 * Accepts any type satisfying SchedulableOperation (including Operation).
 */
export function topoSort(
  operations: readonly SchedulableOperation[],
): string[] {
  const operationMap = new Map<string, SchedulableOperation>();
  for (const op of operations) operationMap.set(op.id, op);

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const op of operations) {
    inDegree.set(op.id, 0);
    adj.set(op.id, []);
  }
  for (const op of operations) {
    for (const ref of op.depends || []) {
      if (operationMap.has(ref)) {
        adj.get(ref)!.push(op.id);
        inDegree.set(op.id, inDegree.get(op.id)! + 1);
      }
    }
  }
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }
  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbour of adj.get(node)!) {
      const newDeg = inDegree.get(neighbour)! - 1;
      inDegree.set(neighbour, newDeg);
      if (newDeg === 0) queue.push(neighbour);
    }
  }
  return sorted;
}
