import { poolSchema, themeNightsSchema, staplesSchema } from './schema.js';
import type { Pool, ThemeNights, Staples } from './types.js';

export function parsePool(json: unknown): Pool {
  const result = poolSchema.safeParse(json);
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid pool state: ${messages}`);
  }
  return result.data as Pool;
}

export function parseThemeNights(json: unknown): ThemeNights {
  const result = themeNightsSchema.safeParse(json);
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid theme nights: ${messages}`);
  }
  return result.data as ThemeNights;
}

export function parseStaples(json: unknown): Staples {
  const result = staplesSchema.safeParse(json);
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid staples list: ${messages}`);
  }
  return result.data as Staples;
}
