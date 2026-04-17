import type { Agent } from '@atproto/api';
import type { Recipe } from '@recipe/domain';
import { parseRecipe } from '@recipe/domain';
import { lexiconToRecipe } from '../adapter/recipe.js';
import { SOCIAL_HOB_TEMP_RECIPE_NSID } from '../constants.js';
import type * as Lex from '../generated/types/social/hob/temp/recipe.js';

export interface FetchedRecipeOk {
  rkey: string;
  uri: string;
  cid: string;
  recipe: Recipe;
}

export interface FetchedRecipeInvalid {
  rkey: string;
  uri: string;
  cid?: string;
  invalid: string;
}

export type FetchedRecipe = FetchedRecipeOk | FetchedRecipeInvalid;

export interface FetchRecipesPage {
  recipes: FetchedRecipe[];
  cursor?: string;
}

export interface FetchRecipesOptions {
  cursor?: string;
  /** Page size (default 50, max 100 per AT Protocol). */
  limit?: number;
  /** Ascending by rkey (default false = newest first). */
  reverse?: boolean;
}

const DEFAULT_LIMIT = 50;

/**
 * List recipes from a DID's repository. Agent must point at the DID's own PDS
 * (AppView does not index custom lexicons).
 *
 * Malformed records surface as `{ rkey, uri, invalid }` rather than throwing.
 */
export async function fetchRecipes(
  agent: Agent,
  did: string,
  options: FetchRecipesOptions = {},
): Promise<FetchRecipesPage> {
  const res = await agent.com.atproto.repo.listRecords({
    repo: did,
    collection: SOCIAL_HOB_TEMP_RECIPE_NSID,
    limit: options.limit ?? DEFAULT_LIMIT,
    ...(options.cursor !== undefined && { cursor: options.cursor }),
    ...(options.reverse !== undefined && { reverse: options.reverse }),
  });

  const recipes: FetchedRecipe[] = res.data.records.map((rec) => {
    const rkey = rkeyFromUri(rec.uri);
    try {
      const recipe = validateFetchedRecord(rec.value);
      return { rkey, uri: rec.uri, cid: rec.cid, recipe };
    } catch (err) {
      return {
        rkey,
        uri: rec.uri,
        cid: rec.cid,
        invalid: err instanceof Error ? err.message : String(err),
      };
    }
  });

  return {
    recipes,
    ...(res.data.cursor !== undefined && { cursor: res.data.cursor }),
  };
}

/**
 * Fetch a single recipe record.
 */
export async function fetchRecipe(
  agent: Agent,
  did: string,
  rkey: string,
): Promise<FetchedRecipeOk> {
  const res = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection: SOCIAL_HOB_TEMP_RECIPE_NSID,
    rkey,
  });
  const recipe = validateFetchedRecord(res.data.value);
  return {
    rkey,
    uri: res.data.uri,
    cid: res.data.cid ?? '',
    recipe,
  };
}

/**
 * Convert a lexicon record into a Recipe, then re-run the full domain schema
 * + DAG validation. PDS records come from arbitrary servers and must satisfy
 * every invariant the local build pipeline enforces before reaching UI state.
 */
function validateFetchedRecord(value: unknown): Recipe {
  const recipe = lexiconToRecipe(value as Lex.Record);
  // `parseRecipe` expects raw JSON (pre-branding). Round-trip through JSON to
  // strip the branded types, then let parseRecipe re-apply them and run DAG
  // validation.
  return parseRecipe(JSON.parse(JSON.stringify(recipe)));
}

export interface FetchAllRecipesOptions {
  /** Hard cap on total records returned (default 500). */
  cap?: number;
  /** Per-page limit (default 100). */
  pageSize?: number;
}

/**
 * Fetch all recipes with pagination, capped to prevent runaway fetches on very
 * large repos.
 */
export async function fetchAllRecipes(
  agent: Agent,
  did: string,
  options: FetchAllRecipesOptions = {},
): Promise<FetchedRecipe[]> {
  const cap = options.cap ?? 500;
  const pageSize = options.pageSize ?? 100;

  const all: FetchedRecipe[] = [];
  let cursor: string | undefined;

  while (all.length < cap) {
    const page = await fetchRecipes(agent, did, {
      limit: Math.min(pageSize, cap - all.length),
      ...(cursor !== undefined && { cursor }),
    });
    all.push(...page.recipes);
    if (!page.cursor || page.recipes.length === 0) break;
    cursor = page.cursor;
  }

  return all.slice(0, cap);
}

/**
 * Resolve a handle (e.g. `alice.bsky.social`) to a DID via
 * `com.atproto.identity.resolveHandle`. The agent can be any AT Protocol
 * service; `https://bsky.social` is a safe default for public resolution.
 */
export async function resolveHandle(
  agent: Agent,
  handle: string,
): Promise<string> {
  const res = await agent.com.atproto.identity.resolveHandle({ handle });
  return res.data.did;
}

function rkeyFromUri(uri: string): string {
  const idx = uri.lastIndexOf('/');
  return idx >= 0 ? uri.slice(idx + 1) : uri;
}
