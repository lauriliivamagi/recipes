export interface CatalogRecipe {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  totalTime: { relaxed: number; optimized: number };
  servings: number;
  language: string;
  url: string;
}
