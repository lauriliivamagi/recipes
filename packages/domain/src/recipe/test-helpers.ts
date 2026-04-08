/**
 * Test helpers for constructing domain objects with branded IDs
 * and value objects from plain literals.
 */
import type {
  Recipe,
  RecipeMeta,
  Ingredient,
  IngredientBase,
  Equipment,
  Operation,
  SubProduct,
  TimeRange,
  OperationId,
  IngredientId,
  EquipmentId,
  SubProductId,
  RecipeSlug,
  Quantity,
} from './types.js';

// ---------------------------------------------------------------------------
// ID casting helpers
// ---------------------------------------------------------------------------
export const opId = (s: string) => s as OperationId;
export const ingId = (s: string) => s as IngredientId;
export const eqId = (s: string) => s as EquipmentId;
export const spId = (s: string) => s as SubProductId;
export const slug = (s: string) => s as RecipeSlug;

// ---------------------------------------------------------------------------
// Value object helpers
// ---------------------------------------------------------------------------
export const qty = (min: number, unit: string, max?: number): Quantity =>
  max !== undefined ? { min, max, unit } : { min, unit };

/** Create a TimeRange from seconds. Pass one number for exact, two for range. */
export const secs = (min: number, max?: number): TimeRange =>
  max !== undefined ? { min, max } : { min };

// ---------------------------------------------------------------------------
// Factory for flat-format ingredient (matches JSON input shape)
// ---------------------------------------------------------------------------
export function ing(
  id: string, name: string, min: number, unit: string, group: string,
  opts?: { max?: number; alternatives?: { id: string; name: string; min: number; unit: string; group: string; max?: number }[] },
): Ingredient {
  const q = opts?.max !== undefined ? qty(min, unit, opts.max) : qty(min, unit);
  const alts: IngredientBase[] | undefined = opts?.alternatives?.map(a => ({
    id: ingId(a.id),
    name: a.name,
    quantity: a.max !== undefined ? qty(a.min, a.unit, a.max) : qty(a.min, a.unit),
    group: a.group,
  }));
  return { id: ingId(id), name, quantity: q, group, ...(alts ? { alternatives: alts } : {}) };
}

// ---------------------------------------------------------------------------
// Factory for operation
// ---------------------------------------------------------------------------
export function op(fields: {
  id: string;
  type: 'prep' | 'cook' | 'rest' | 'assemble';
  action: string;
  ingredients?: string[];
  depends?: string[];
  time: TimeRange;
  activeTime: TimeRange;
  equipment?: { use: string; release: boolean }[];
  scalable?: boolean;
  temperature?: { min: number; max?: number; unit: 'C' | 'F' };
  details?: string;
  subProduct?: string;
  output?: string;
}): Operation {
  return {
    id: opId(fields.id),
    type: fields.type,
    action: fields.action,
    ingredients: (fields.ingredients ?? []).map(ingId),
    depends: (fields.depends ?? []).map(opId),
    equipment: (fields.equipment ?? []).map(e => ({ use: eqId(e.use), release: e.release })),
    time: fields.time,
    activeTime: fields.activeTime,
    scalable: fields.scalable ?? true,
    temperature: fields.temperature,
    details: fields.details,
    subProduct: fields.subProduct ? spId(fields.subProduct) : undefined,
    output: fields.output ? spId(fields.output) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Factory for equipment
// ---------------------------------------------------------------------------
export function equip(id: string, name: string, count: number): Equipment {
  return { id: eqId(id), name, count };
}

// ---------------------------------------------------------------------------
// Factory for sub-product
// ---------------------------------------------------------------------------
export function subProd(id: string, name: string, finalOp: string): SubProduct {
  return { id: spId(id), name, finalOp: opId(finalOp) };
}

// ---------------------------------------------------------------------------
// Recipe factory with defaults
// ---------------------------------------------------------------------------
export function makeRecipe(overrides: {
  meta?: Partial<RecipeMeta>;
  ingredients?: Ingredient[];
  equipment?: Equipment[];
  operations?: Operation[];
  subProducts?: SubProduct[];
} = {}): Recipe {
  return {
    meta: {
      title: 'Test',
      slug: slug('test'),
      language: 'en',
      originalText: '',
      tags: [],
      servings: 1,
      totalTime: { relaxed: { min: 0 }, optimized: { min: 0 } },
      difficulty: 'easy',
      ...overrides.meta,
    },
    ingredients: overrides.ingredients ?? [],
    equipment: overrides.equipment ?? [],
    operations: overrides.operations ?? [],
    subProducts: overrides.subProducts ?? [],
  };
}
