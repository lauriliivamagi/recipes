// Barrel re-exports for @recipe/domain
// Consumers can also import deep paths: @recipe/domain/recipe/types.js

export type {
  Recipe,
  Operation,
  Ingredient,
  Equipment,
  Quantity,
  TimeRange,
  RecipeMeta,
  OperationId,
  IngredientId,
  EquipmentId,
  SubProductId,
  RecipeSlug,
} from './recipe/types.js';

export type { Phase, ScheduleMode } from './schedule/types.js';
export type { CatalogRecipe } from './catalog/types.js';
export type { TimerState } from './cooking/types.js';
export type { Pool, ThemeNights, Staples } from './planning/types.js';

export { parseRecipe } from './recipe/parse.js';
export { resolveIngredients } from './recipe/resolve.js';
export { recipeSchema, createRecipeSchema } from './recipe/schema.js';

export { computeSchedule, computeTotalTime } from './schedule/schedule.js';
export { validateDag, topoSort, indexById } from './schedule/dag.js';

export { scaleQuantity, scaleTime } from './scaling/scale.js';
export { formatQuantity } from './scaling/format.js';
export { convertUnit, normalizeUnit } from './scaling/unit-convert.js';
export { convertTemperature } from './scaling/temperature.js';
export { roundQuantity } from './scaling/round.js';

export { filterRecipes } from './catalog/filter.js';

export {
  createTimer,
  tickTimer,
  cancelTimer,
  isTimerDone,
  formatTime,
  formatMinutes,
} from './cooking/timer.js';
export {
  nextStep,
  prevStep,
  jumpToStep,
  isFirstStep,
  isLastStep,
} from './cooking/step-navigation.js';

export { parsePool, parseThemeNights, parseStaples } from './planning/parse.js';
export { poolSchema, themeNightsSchema, staplesSchema } from './planning/schema.js';
