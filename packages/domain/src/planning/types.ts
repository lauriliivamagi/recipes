import type { RecipeSlug } from '../recipe/types.js';

// ---------------------------------------------------------------------------
// Pool — floating meals with no day assignments
// ---------------------------------------------------------------------------

export interface PoolMeal {
  slug: RecipeSlug;
  addedAt: string; // ISO 8601 date (YYYY-MM-DD)
  cookedAt?: string; // ISO 8601 date — set when marked as cooked
}

export interface Pool {
  createdAt: string; // ISO 8601 date — start of this pool cycle
  meals: PoolMeal[];
}

// ---------------------------------------------------------------------------
// Theme Nights — cuisine per weekday
// ---------------------------------------------------------------------------

/** Days the theme system supports (weekdays only — weekends are unstructured). */
export type ThemeDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface ThemeNights {
  themes: Partial<Record<ThemeDay, string>>;
}

// ---------------------------------------------------------------------------
// Staples — always-stocked ingredients excluded from shopping lists
// ---------------------------------------------------------------------------

export interface StapleItem {
  name: string;
  group: string; // matches ingredient.group for deduplication
}

export interface Staples {
  items: StapleItem[];
}
