import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { recipeSchema, createRecipeSchema } from './schema.js';
import { parseRecipe } from './parse.js';
import { resolveIngredients } from './resolve.js';
import type { Recipe } from './types.js';
import { op } from './test-helpers.js';

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
    totalTime: { relaxed: { min: 5400 }, optimized: { min: 3600 } },
    difficulty: 'medium',
  },
  ingredients: [
    { id: 'spaghetti', name: 'Spaghetti', quantity: { min: 400, unit: 'g' }, group: 'pasta' },
    { id: 'ground-beef', name: 'Ground Beef', quantity: { min: 500, unit: 'g' }, group: 'meat' },
    { id: 'onion', name: 'Onion', quantity: { min: 1, unit: 'pcs' }, group: 'vegetables' },
    { id: 'garlic', name: 'Garlic', quantity: { min: 3, unit: 'cloves' }, group: 'vegetables' },
    { id: 'tomato-sauce', name: 'Tomato Sauce', quantity: { min: 400, unit: 'ml' }, group: 'sauce' },
    { id: 'olive-oil', name: 'Olive Oil', quantity: { min: 2, unit: 'tbsp' }, group: 'pantry' },
    { id: 'salt', name: 'Salt', quantity: { min: 1, unit: 'tsp' }, group: 'pantry' },
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
      ingredients: ['onion'],
      depends: [],
      equipment: [],
      time: { min: 300 },
      activeTime: { min: 300 },
      scalable: true,
    },
    {
      id: 'mince-garlic',
      type: 'prep',
      action: 'Mince the garlic',
      ingredients: ['garlic'],
      depends: [],
      equipment: [],
      time: { min: 120 },
      activeTime: { min: 120 },
      scalable: true,
    },
    {
      id: 'brown-beef',
      type: 'cook',
      action: 'Brown the ground beef',
      ingredients: ['ground-beef', 'olive-oil'],
      depends: [],
      equipment: [{ use: 'skillet', release: false }],
      time: { min: 600 },
      activeTime: { min: 300 },
      scalable: true,
      temperature: { min: 200, unit: 'C' },
    },
    {
      id: 'make-sauce',
      type: 'cook',
      action: 'Simmer sauce with beef and aromatics',
      ingredients: ['tomato-sauce', 'salt'],
      depends: ['brown-beef', 'dice-onion', 'mince-garlic'],
      equipment: [{ use: 'skillet', release: true }],
      time: { min: 1800 },
      activeTime: { min: 300 },
      scalable: true,
      temperature: { min: 120, unit: 'C' },
      details: 'Stir occasionally.',
    },
    {
      id: 'boil-pasta',
      type: 'cook',
      action: 'Boil the spaghetti',
      ingredients: ['spaghetti'],
      depends: [],
      equipment: [{ use: 'large-pot', release: true }],
      time: { min: 600 },
      activeTime: { min: 180 },
      scalable: true,
      temperature: { min: 100, unit: 'C' },
    },
    {
      id: 'plate',
      type: 'assemble',
      action: 'Plate spaghetti and top with sauce',
      ingredients: [],
      depends: ['boil-pasta', 'make-sauce'],
      equipment: [],
      time: { min: 120 },
      activeTime: { min: 120 },
      scalable: true,
      details: 'Serve immediately with grated parmesan.',
    },
  ],
  subProducts: [
    { id: 'bolognese-sauce', name: 'Bolognese Sauce', finalOp: 'make-sauce' },
  ],
};

/** Parsed recipe with value objects (Quantity, branded IDs). */
const validRecipe: Recipe = parseRecipe(validRecipeInput);

describe('recipeSchema', () => {
  it('accepts a valid recipe', () => {
    const result = recipeSchema.safeParse(validRecipeInput);
    expect(result.success).toBe(true);
  });

  it('parses nested quantity object as Quantity value object', () => {
    const result = recipeSchema.safeParse(validRecipeInput);
    expect(result.success).toBe(true);
    if (result.success) {
      const ing = result.data.ingredients[0]!;
      expect(ing.quantity).toEqual({ min: 400, unit: 'g' });
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

  it('accepts ingredient with maxQuantity and transforms to Quantity with max', () => {
    const input = {
      ...validRecipeInput,
      ingredients: [
        { ...validRecipeInput.ingredients[0]!, quantity: { min: 100, max: 150, unit: 'g' } },
        ...validRecipeInput.ingredients.slice(1),
      ],
    };
    const result = recipeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ingredients[0]!.quantity).toEqual({ min: 100, max: 150, unit: 'g' });
    }
  });

  it('rejects ingredient where maxQuantity < quantity', () => {
    const input = {
      ...validRecipeInput,
      ingredients: [
        { ...validRecipeInput.ingredients[0]!, quantity: { min: 150, max: 100, unit: 'g' } },
        ...validRecipeInput.ingredients.slice(1),
      ],
    };
    const result = recipeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('accepts ingredient without maxQuantity (exact quantity)', () => {
    const result = recipeSchema.safeParse(validRecipeInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ingredients[0]!.quantity).toEqual({ min: 400, unit: 'g' });
      expect(result.data.ingredients[0]!.quantity.max).toBeUndefined();
    }
  });

  it('accepts ingredient with alternatives', () => {
    const input = {
      ...validRecipeInput,
      ingredients: [
        ...validRecipeInput.ingredients,
        {
          id: 'fat', name: 'Cream', quantity: { min: 200, unit: 'ml' }, group: 'dairy',
          alternatives: [
            { id: 'fat-alt', name: 'Water', quantity: { min: 200, unit: 'ml' }, group: 'pantry' },
          ],
        },
      ],
    };
    const result = recipeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const fat = result.data.ingredients.find(i => i.id === 'fat')!;
      expect(fat.alternatives).toHaveLength(1);
      expect(fat.alternatives![0]!.name).toBe('Water');
      expect(fat.alternatives![0]!.quantity).toEqual({ min: 200, unit: 'ml' });
      expect(fat.alternatives![0]!.id).toBe('fat-alt');
      expect(fat.alternatives![0]!.group).toBe('pantry');
    }
  });

  it('accepts alternative with maxQuantity range', () => {
    const input = {
      ...validRecipeInput,
      ingredients: [
        ...validRecipeInput.ingredients,
        {
          id: 'fat', name: 'Cream', quantity: { min: 100, max: 150, unit: 'ml' }, group: 'dairy',
          alternatives: [
            { id: 'fat-alt', name: 'Sour Cream', quantity: { min: 80, max: 120, unit: 'g' }, group: 'dairy' },
          ],
        },
      ],
    };
    const result = recipeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const fat = result.data.ingredients.find(i => i.id === 'fat')!;
      expect(fat.quantity).toEqual({ min: 100, max: 150, unit: 'ml' });
      expect(fat.alternatives![0]!.quantity).toEqual({ min: 80, max: 120, unit: 'g' });
    }
  });

  it('rejects alternative where maxQuantity < quantity', () => {
    const input = {
      ...validRecipeInput,
      ingredients: [
        ...validRecipeInput.ingredients,
        {
          id: 'fat', name: 'Cream', quantity: { min: 200, unit: 'ml' }, group: 'dairy',
          alternatives: [
            { id: 'fat-alt', name: 'Water', quantity: { min: 200, max: 100, unit: 'ml' }, group: 'pantry' },
          ],
        },
      ],
    };
    const result = recipeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('omits alternatives key when not provided', () => {
    const result = recipeSchema.safeParse(validRecipeInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ingredients[0]!.alternatives).toBeUndefined();
    }
  });

  it('rejects empty string for title', () => {
    const bad = {
      ...validRecipeInput,
      meta: { ...validRecipeInput.meta, title: '' },
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects empty string for ingredient name', () => {
    const bad = {
      ...validRecipeInput,
      ingredients: [
        { ...validRecipeInput.ingredients[0]!, name: '' },
      ],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects invalid URL pattern (missing ://)', () => {
    const bad = {
      ...validRecipeInput,
      meta: { ...validRecipeInput.meta, source: 'httpfoo' },
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('accepts valid https URL', () => {
    const good = {
      ...validRecipeInput,
      meta: { ...validRecipeInput.meta, source: 'https://example.com/recipe' },
    };
    const result = recipeSchema.safeParse(good);
    expect(result.success).toBe(true);
  });

  it('rejects non-integer equipment count', () => {
    const bad = {
      ...validRecipeInput,
      equipment: [{ id: 'large-pot', name: 'Large Pot', count: 1.5 }],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects zero equipment count', () => {
    const bad = {
      ...validRecipeInput,
      equipment: [{ id: 'large-pot', name: 'Large Pot', count: 0 }],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects activeTime greater than time', () => {
    const bad = {
      ...validRecipeInput,
      operations: [
        {
          ...validRecipeInput.operations[0],
          time: { min: 300 },
          activeTime: { min: 600 },
        },
      ],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('accepts activeTime equal to time', () => {
    const result = recipeSchema.safeParse(validRecipeInput);
    expect(result.success).toBe(true);
    // dice-onion has time: {min: 300}, activeTime: {min: 300} — should pass
  });

  it('rejects malformed ingredient IDs (not slug pattern)', () => {
    const bad = {
      ...validRecipeInput,
      operations: [
        { ...validRecipeInput.operations[0], ingredients: ['INVALID SLUG!'] },
      ],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('allows empty operation ingredients (e.g., preheat oven)', () => {
    const withPreheat = {
      ...validRecipeInput,
      operations: [
        ...validRecipeInput.operations,
        {
          id: 'preheat-oven',
          type: 'prep' as const,
          action: 'preheat',
          ingredients: [],
          depends: [],
          equipment: [{ use: 'large-pot', release: false }],
          time: { min: 900 },
          activeTime: { min: 60 },
          scalable: true,
        },
      ],
    };
    const result = recipeSchema.safeParse(withPreheat);
    expect(result.success).toBe(true);
  });

  it('rejects unknown tags', () => {
    const bad = {
      ...validRecipeInput,
      meta: { ...validRecipeInput.meta, tags: ['pasta', 'italian', 'nonexistent-tag'] },
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      const tagError = result.error.issues.find(i => i.path.join('.').includes('tags'));
      expect(tagError?.message).toContain('Unknown tag');
    }
  });

  it('accepts all valid tags from config', () => {
    const result = recipeSchema.safeParse(validRecipeInput);
    expect(result.success).toBe(true);
  });

  it('createRecipeSchema allows custom tag sets', () => {
    const customSchema = createRecipeSchema({ validTags: new Set(['custom-tag']) });
    const input = {
      ...validRecipeInput,
      meta: { ...validRecipeInput.meta, tags: ['custom-tag'] },
    };
    const result = customSchema.safeParse(input);
    expect(result.success).toBe(true);
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
        { id: 'a', type: 'prep', action: 'x', ingredients: [], depends: ['b'], equipment: [], time: { min: 60 }, activeTime: { min: 60 }, scalable: true },
        { id: 'b', type: 'prep', action: 'y', ingredients: [], depends: ['a'], equipment: [], time: { min: 60 }, activeTime: { min: 60 }, scalable: true },
      ],
      subProducts: [],
    };
    expect(() => parseRecipe(cyclic)).toThrow('Invalid recipe DAG');
  });

  it('ingredient has Quantity value object after parse', () => {
    const recipe = parseRecipe(validRecipeInput);
    const spaghetti = recipe.ingredients.find(i => i.id === 'spaghetti')!;
    expect(spaghetti.quantity).toEqual({ min: 400, unit: 'g' });
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
      ingredients: ['spaghetti', 'nonexistent-ref'],
      depends: [],
      time: { min: 60 },
      activeTime: { min: 60 },
    });
    const result = resolveIngredients(testOp, validRecipe);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('spaghetti');
  });
});

describe('z.toJSONSchema generation', () => {
  it('generates valid JSON Schema from recipe schema (input shape)', () => {
    const jsonSchema = z.toJSONSchema(recipeSchema, {
      io: 'input',
      target: 'draft-2020-12',
    });
    expect(jsonSchema).toBeDefined();
    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema.additionalProperties).toBe(false);
    expect(jsonSchema.properties).toHaveProperty('meta');
    expect(jsonSchema.properties).toHaveProperty('ingredients');
    expect(jsonSchema.properties).toHaveProperty('operations');
    expect(jsonSchema.description).toBe('Structured recipe data model for the Recipe Visualization App');
  });

  it('preserves field descriptions in generated schema', () => {
    const jsonSchema = z.toJSONSchema(recipeSchema, {
      io: 'input',
      target: 'draft-2020-12',
    }) as any;
    const metaProps = jsonSchema.properties.meta.properties;
    expect(metaProps.title.description).toBe('Human-readable recipe title');
    expect(metaProps.difficulty.description).toBe('Recipe difficulty level');
  });

  it('generates input shape with nested quantity object', () => {
    const jsonSchema = z.toJSONSchema(recipeSchema, {
      io: 'input',
      target: 'draft-2020-12',
    }) as any;
    const ingredientProps = jsonSchema.properties.ingredients.items.properties;
    expect(ingredientProps).toHaveProperty('quantity');
    expect(ingredientProps.quantity.type).toBe('object');
    expect(ingredientProps.quantity.properties).toHaveProperty('min');
    expect(ingredientProps.quantity.properties).toHaveProperty('unit');
  });
});

describe('cross-entity validation (superRefine)', () => {
  it('rejects duplicate ingredient IDs', () => {
    const bad = {
      ...validRecipeInput,
      ingredients: [
        validRecipeInput.ingredients[0]!,
        { ...validRecipeInput.ingredients[1]!, id: validRecipeInput.ingredients[0]!.id },
      ],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('Duplicate ingredient ID'))).toBe(true);
    }
  });

  it('rejects duplicate operation IDs', () => {
    const bad = {
      ...validRecipeInput,
      operations: [
        validRecipeInput.operations[0],
        { ...validRecipeInput.operations[1]!, id: validRecipeInput.operations[0]!.id },
      ],
      subProducts: [],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('Duplicate operation ID'))).toBe(true);
    }
  });

  it('rejects subProduct referencing unknown operation', () => {
    const bad = {
      ...validRecipeInput,
      subProducts: [{ id: 'some-product', name: 'Test', finalOp: 'nonexistent-op' }],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('unknown operation'))).toBe(true);
    }
  });

  it('rejects operation referencing unknown equipment', () => {
    const bad = {
      ...validRecipeInput,
      operations: [
        {
          ...validRecipeInput.operations[0],
          equipment: [{ use: 'nonexistent-equipment', release: true }],
        },
      ],
      subProducts: [],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('unknown equipment'))).toBe(true);
    }
  });

  it('rejects alternative ingredient ID that collides with primary ingredient ID', () => {
    const bad = {
      ...validRecipeInput,
      ingredients: [
        {
          ...validRecipeInput.ingredients[0]!,
          alternatives: [
            { id: validRecipeInput.ingredients[1]!.id, name: 'Alt', quantity: { min: 100, unit: 'g' }, group: 'meat' },
          ],
        },
        validRecipeInput.ingredients[1]!,
        ...validRecipeInput.ingredients.slice(2),
      ],
    };
    const result = recipeSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('collides'))).toBe(true);
    }
  });

  it('passes cross-entity validation for valid recipe', () => {
    const result = recipeSchema.safeParse(validRecipeInput);
    expect(result.success).toBe(true);
  });
});
