// Barrel re-exports for @recipe/atproto

export { recipeToLexicon, lexiconToRecipe } from './adapter/recipe.js';
export { toLexiconQuantity, fromLexiconQuantity } from './adapter/quantity.js';
export { toLexiconTemperature, fromLexiconTemperature } from './adapter/temperature.js';
export { toLexiconDecimal, fromLexiconDecimal } from './adapter/decimal.js';
export type { LexiconDecimal } from './adapter/decimal.js';

export { createOAuthClient } from './auth/client.js';
export type {
  CreatedOAuthClient,
  OAuthClientEnv,
  OAuthEventDetail,
  OAuthEventTarget,
} from './auth/client.js';
export { loadSession, subscribeToSessionEvents } from './auth/session.js';
export type { SessionState, SessionEvent } from './auth/session.js';

export {
  loginWithAppPassword,
  resumeAppPasswordSession,
} from './auth/app-password.js';
export type {
  AppPasswordSession,
  LoginWithAppPasswordArgs,
  LoginResult,
  ResumeAppPasswordSessionArgs,
  ResumeResult,
} from './auth/app-password.js';

export { publishRecipe } from './publish/recipe.js';
export type { PublishedRecipe, PublishRecipeOptions } from './publish/recipe.js';

export {
  fetchRecipes,
  fetchRecipe,
  fetchAllRecipes,
  resolveHandle,
} from './fetch/recipes.js';
export type {
  FetchedRecipe,
  FetchedRecipeOk,
  FetchedRecipeInvalid,
  FetchRecipesPage,
  FetchRecipesOptions,
  FetchAllRecipesOptions,
} from './fetch/recipes.js';

export {
  resolveDidDocument,
  pdsEndpointFromDidDocument,
  resolvePdsEndpoint,
  agentForDid,
} from './fetch/resolve-pds.js';
export type { DidDocument, ResolvePdsOptions } from './fetch/resolve-pds.js';

export { SOCIAL_HOB_TEMP_RECIPE_NSID } from './constants.js';
