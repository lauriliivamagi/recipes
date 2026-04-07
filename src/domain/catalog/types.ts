import type { TimeRange } from '../recipe/types.js';

export interface CatalogRecipe {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  totalTime: { relaxed: TimeRange; optimized: TimeRange };
  servings: number;
  language: string;
  url: string;
}
