import { describe, it, expect } from 'vitest';
import type { CatalogRecipe } from './types.js';
import { filterRecipes } from './filter.js';

const recipes: CatalogRecipe[] = [
  { title: "Spaghetti Bolognese", slug: "spaghetti-bolognese", category: "italian", tags: ["italian", "pasta", "weeknight"], difficulty: "easy", totalTime: { relaxed: { min: 4500 }, optimized: { min: 3720 } }, servings: 4, language: "en", url: "italian/spaghetti-bolognese.html" },
  { title: "Classic Lasagne", slug: "classic-lasagne", category: "italian", tags: ["italian", "pasta", "weekend"], difficulty: "medium", totalTime: { relaxed: { min: 7200 }, optimized: { min: 5700 } }, servings: 6, language: "en", url: "italian/classic-lasagne.html" },
  { title: "Chicken Tikka Masala", slug: "chicken-tikka-masala", category: "indian", tags: ["indian", "curry", "weeknight"], difficulty: "medium", totalTime: { relaxed: { min: 3600 }, optimized: { min: 2700 } }, servings: 4, language: "en", url: "indian/chicken-tikka-masala.html" },
];

describe('filterRecipes', () => {
  it('returns all recipes with empty query and no tags', () => {
    expect(filterRecipes(recipes, '', [])).toEqual(recipes);
  });

  it('searches by title substring (case-insensitive)', () => {
    const result = filterRecipes(recipes, 'spaghetti', []);
    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe('spaghetti-bolognese');
  });

  it('matches tag content', () => {
    const result = filterRecipes(recipes, 'curry', []);
    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe('chicken-tikka-masala');
  });

  it('narrows results with a single tag filter', () => {
    const result = filterRecipes(recipes, '', ['pasta']);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.slug)).toEqual(['spaghetti-bolognese', 'classic-lasagne']);
  });

  it('uses AND logic for multiple tags', () => {
    const result = filterRecipes(recipes, '', ['pasta', 'weeknight']);
    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe('spaghetti-bolognese');
  });

  it('combines search and tag filter', () => {
    const result = filterRecipes(recipes, 'classic', ['italian']);
    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe('classic-lasagne');
  });

  it('returns empty array when nothing matches', () => {
    expect(filterRecipes(recipes, 'nonexistent', [])).toEqual([]);
  });
});
