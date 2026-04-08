import type { CatalogRecipe } from './types.js';

export function filterRecipes(
  recipes: CatalogRecipe[],
  query: string,
  activeTags: string[],
): CatalogRecipe[] {
  const q = query.toLowerCase();

  return recipes.filter((recipe) => {
    // Text search: match title or any tag
    if (q) {
      const titleMatch = recipe.title.toLowerCase().includes(q);
      const tagMatch = recipe.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!titleMatch && !tagMatch) return false;
    }

    // Tag filter: AND logic — recipe must have ALL active tags
    if (activeTags.length > 0) {
      if (!activeTags.every((t) => recipe.tags.includes(t))) return false;
    }

    return true;
  });
}
