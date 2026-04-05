import { describe, it, expect } from 'vitest';
import { recipeSchema } from './schema.js';
import { parseRecipe } from './parse.js';
import { resolveIngredients } from './resolve.js';
import type { Recipe } from './types.js';
import { ing, op, equip, subProd, slug, qty, opId, makeRecipe } from './test-helpers.js';

/**
 * validRecipeInput: flat JSON format (as stored in recipe files).
 * Used for schema/parse tests that validate the input format.
 */
const validRecipeInput = {
  meta: {
    title: 'Spaghetti Bolognese',
    slug: 'spaghetti-bolognese',
    language: 'en',
    originalText: 'Classic Italian pasta with meat sauce.',
    tags: ['pasta', 'italian', 'dinner'],
    servings: 4,
    totalTime: { relaxed: 90, optimized: 60 },
    difficulty: 'medium',
  },
  ingredients: [
    { id: 'spaghetti', name: 'Spaghetti', quantity: 400, unit: 'g', group: 'pasta' },
    { id: 'ground-beef', name: 'Ground Beef', quantity: 500, unit: 'g', group: 'meat' },
    { id: 'onion', name: 'Onion', quantity: 1, unit: 'pcs', group: 'vegetables' },
    { id: 'garlic', name: 'Garlic', quantity: 3, unit: 'cloves', group: 'vegetables' },
    { id: 'tomato-sauce', name: 'Tomato Sauce', quantity: 400, unit: 'ml', group: 'sauce' },
    { id: 'olive-oil', name: 'Olive Oil', quantity: 2, unit: 'tbsp', group: 'pantry' },
    { id: 'salt', name: 'Salt', quantity: 1, unit: 'tsp', group: 'pantry' },
  ],
  equipment: [
    { id: 'large-pot', name: 'Large Pot', count: 1 },
    { id: 'skillet', name: 'Skillet', count: 1 },
  ],
  operations: [
    {
      id: 'dice-onion',
      type: 'prep',
      action: 'Dice the onion',
      inputs: ['onion'],
      time: 5,
      activeTime: 5,
    },
    {
      id: 'mince-garlic',
      type: 'prep',
      action: 'Mince the garlic',
      inputs: ['garlic'],
      time: 2,
      activeTime: 2,
    },
    {
      id: 'brown-beef',
      type: 'cook',
      action: 'Brown the ground beef',
      inputs: ['ground-beef', 'olive-oil'],
      equipment: { use: 'skillet', release: false },
      time: 10,
      activeTime: 5,
      heat: 'medium-high',
    },
    {
      id: 'make-sauce',
      type: 'cook',
      action: 'Simmer sauce with beef and aromatics',
      inputs: ['brown-beef', 'dice-onion', 'mince-garlic', 'tomato-sauce', 'salt'],
      equipment: { use: 'skillet', release: true },
      time: 30,
      activeTime: 5,
      heat: 'low',
      details: 'Stir occasionally.',
    },
    {
      id: 'boil-pasta',
      type: 'cook',
      action: 'Boil the spaghetti',
      inputs: ['spaghetti'],
      equipment: { use: 'large-pot', release: true },
      time: 10,
      activeTime: 3,
      heat: 'high',
    },
  ],
  subProducts: [
    { id: 'bolognese-sauce', name: 'Bolognese Sauce', finalOp: 'make-sauce' },
  ],
  finishSteps: [
    {
      action: 'Plate spaghetti and top with sauce',
      inputs: ['boil-pasta', 'make-sauce'],
      details: 'Serve immediately with grated parmesan.',
    },
  ],
};

/** Parsed recipe with value objects (Quantity, branded IDs). */
const validRecipe: Recipe = parseRecipe(validRecipeInput);

describe('recipeSchema', () => {
  it('accepts a valid recipe', () => {
    const result = recipeSchema.safeParse(validRecipeInput);
    expect(result.success).toBe(true);
  });

  it('transforms ingredient quantity+unit into Quantity value object', () => {
    const result = recipeSchema.safeParse(validRecipeInput);
    expect(result.success).toBe(true);
    if (result.success) {
      const ing = result.data.ingredients[0]!;
      expect(ing.quantity).toEqual({ amount: 400, unit: 'g' });
      // 'unit' should NOT exist as a top-level field after transform
      expect('unit' in ing).toBe(false);
    }
  });

  it('rejects when meta is missing', () => {
    const { meta: _, ...noMeta } = validRecipeInput;
    const result = recipeSchema.safeParse(noMeta);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid slug pattern', () => {
    const bad = {
      ...validRecipeInput,
      meta: { ...validRecipeInput.meta, slug: 'INVALID SLUG!' },
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid difficulty value', () => {
    const bad = {
      ...validRecipeInput,
      meta: { ...validRecipeInput.meta, difficulty: 'extreme' },
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects empty operations array', () => {
    const bad = { ...validRecipeInput, operations: [] };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects empty ingredients array', () => {
    const bad = { ...validRecipeInput, ingredients: [] };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

describe('parseRecipe', () => {
  it('returns typed data for valid input', () => {
    const recipe = parseRecipe(validRecipeInput);
    expect(recipe.meta.title).toBe('Spaghetti Bolognese');
    expect(recipe.ingredients).toHaveLength(7);
  });

  it('throws a descriptive error for invalid input', () => {
    expect(() => parseRecipe({})).toThrow('Invalid recipe');
  });

  it('throws on DAG validation failure (cycle)', () => {
    const cyclic = {
      ...validRecipeInput,
      operations: [
        { id: 'a', type: 'prep', action: 'x', inputs: ['b'], time: 1, activeTime: 1 },
        { id: 'b', type: 'prep', action: 'y', inputs: ['a'], time: 1, activeTime: 1 },
      ],
      finishSteps: [{ action: 'done', inputs: [] }],
    };
    expect(() => parseRecipe(cyclic)).toThrow('Invalid recipe DAG');
  });

  it('ingredient has Quantity value object after parse', () => {
    const recipe = parseRecipe(validRecipeInput);
    const spaghetti = recipe.ingredients.find(i => i.id === 'spaghetti')!;
    expect(spaghetti.quantity).toEqual({ amount: 400, unit: 'g' });
  });
});

describe('resolveIngredients', () => {
  it('returns direct ingredient inputs', () => {
    const opRef = validRecipe.operations.find((o) => o.id === 'boil-pasta')!;
    const result = resolveIngredients(opRef, validRecipe);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('spaghetti');
  });

  it('resolves transitive ingredients through upstream operations', () => {
    const opRef = validRecipe.operations.find((o) => o.id === 'make-sauce')!;
    const result = resolveIngredients(opRef, validRecipe);
    const ids = result.map((i) => i.id).sort();
    expect(ids).toEqual([
      'garlic',
      'ground-beef',
      'olive-oil',
      'onion',
      'salt',
      'tomato-sauce',
    ]);
  });

  it('does not return duplicate ingredients', () => {
    const opRef = validRecipe.operations.find((o) => o.id === 'make-sauce')!;
    const result = resolveIngredients(opRef, validRecipe);
    const ids = result.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ignores references that match neither ingredient nor operation', () => {
    const testOp = op({
      id: 'test-op',
      type: 'cook',
      action: 'test',
      inputs: ['nonexistent-ref', 'spaghetti'],
      time: 1,
      activeTime: 1,
    });
    const result = resolveIngredients(testOp, validRecipe);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('spaghetti');
  });
});
