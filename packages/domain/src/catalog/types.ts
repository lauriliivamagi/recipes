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
  /** Origin DID when the recipe is backed by a PDS record. */
  did?: string;
  /** Record key when the recipe is backed by a PDS record. */
  rkey?: string;
  /** 'pds' for records fetched from a PDS; absent for legacy static-built recipes. */
  source?: 'pds';
}
