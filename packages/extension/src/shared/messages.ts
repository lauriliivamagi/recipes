import type { AISettings, AtprotoSession, StoredRecipe } from './types.js';

// --- Content script messages ---

export interface ExtractRequest {
  type: 'EXTRACT_RECIPE';
}

export interface ExtractResult {
  type: 'EXTRACT_RESULT';
  data: {
    url: string;
    title: string;
    contentMarkdown: string;
    schemaOrgData: unknown;
    language: string;
  };
}

// --- Popup → Service worker messages ---

export interface ImportRequest {
  type: 'IMPORT_RECIPE';
}

export interface ListRecipesRequest {
  type: 'LIST_RECIPES';
}

export interface DeleteRecipeRequest {
  type: 'DELETE_RECIPE';
  slug: string;
}

export interface ExportRecipeRequest {
  type: 'EXPORT_RECIPE';
  slug: string;
}

export interface GetSettingsRequest {
  type: 'GET_SETTINGS';
}

export interface GetLastStatusRequest {
  type: 'GET_LAST_STATUS';
}

export interface SaveSettingsRequest {
  type: 'SAVE_SETTINGS';
  settings: AISettings;
}

export interface SaveAtprotoRkeyRequest {
  type: 'SAVE_ATPROTO_RKEY';
  slug: string;
  rkey: string;
}

export interface PublishRecipeRequest {
  type: 'PUBLISH_RECIPE';
  slug: string;
}

export interface SaveAtprotoSessionRequest {
  type: 'SAVE_ATPROTO_SESSION';
  session: AtprotoSession;
}

export interface GetAtprotoSessionRequest {
  type: 'GET_ATPROTO_SESSION';
}

export interface ClearAtprotoSessionRequest {
  type: 'CLEAR_ATPROTO_SESSION';
}

// --- Service worker → Popup responses ---

export type ImportStatus =
  | { type: 'STATUS'; phase: 'idle' }
  | { type: 'STATUS'; phase: 'extracting' }
  | { type: 'STATUS'; phase: 'parsing'; attempt: number }
  | { type: 'STATUS'; phase: 'done'; slug: string; title: string }
  | { type: 'STATUS'; phase: 'error'; message: string };

/** @knipignore */
export interface ListRecipesResponse {
  type: 'LIST_RECIPES_RESULT';
  recipes: StoredRecipe[];
}

/** @knipignore */
export interface SettingsResponse {
  type: 'SETTINGS_RESULT';
  settings: AISettings;
}

export interface AtprotoSessionResponse {
  type: 'ATPROTO_SESSION_RESULT';
  session: AtprotoSession | null;
}

export type PublishRecipeResponse =
  | { type: 'PUBLISH_RECIPE_RESULT'; success: true; uri: string; rkey: string }
  | { type: 'PUBLISH_RECIPE_RESULT'; success: false; error: string };

// --- Union types ---

export type ServiceWorkerMessage =
  | ImportRequest
  | ListRecipesRequest
  | DeleteRecipeRequest
  | ExportRecipeRequest
  | GetSettingsRequest
  | SaveSettingsRequest
  | GetLastStatusRequest
  | SaveAtprotoRkeyRequest
  | PublishRecipeRequest
  | SaveAtprotoSessionRequest
  | GetAtprotoSessionRequest
  | ClearAtprotoSessionRequest;

export type ContentScriptMessage = ExtractRequest;
