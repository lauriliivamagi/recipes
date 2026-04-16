import {
  fetchAllRecipes,
  publishRecipe,
  resumeAppPasswordSession,
} from '@recipe/atproto';
import type { Recipe } from '@recipe/domain';
import {
  clearAtprotoSession,
  loadAtprotoSession,
  saveAtprotoSession,
} from './atproto-session.js';
import { getRecipe, saveAtprotoRkey } from './recipe-store.js';

export interface PublishResult {
  success: true;
  uri: string;
  rkey: string;
}

export interface PublishError {
  success: false;
  error: string;
}

/**
 * Publish a stored recipe to the user's PDS.
 *
 * Cross-machine dedup: if the stored recipe has no `atprotoRkey`, list
 * existing records on the PDS and look for a match by slug or sourceUrl
 * before publishing. Prevents the "Machine A published, Machine B creates a
 * second record" scenario. First hit is cached for the service-worker
 * lifetime to avoid repeating the scan.
 */
export async function publishFromExtension(
  slug: string,
): Promise<PublishResult | PublishError> {
  const stored = await getRecipe(slug);
  if (!stored) return { success: false, error: `Recipe not found: ${slug}` };

  const session = await loadAtprotoSession();
  if (!session) {
    return { success: false, error: 'Not signed in to Bluesky' };
  }

  let agent;
  try {
    const resumed = await resumeAppPasswordSession({
      session,
      onSessionUpdate: (next) => saveAtprotoSession(next),
    });
    agent = resumed.agent;
  } catch (err) {
    // Invalid refresh token likely — clear session so user re-authenticates.
    await clearAtprotoSession();
    return {
      success: false,
      error: `Session expired. Please sign in again. (${err instanceof Error ? err.message : String(err)})`,
    };
  }

  let rkey = stored.atprotoRkey;

  if (!rkey) {
    try {
      rkey = await findExistingRkey(agent, session.did, stored.recipe as Recipe, stored.sourceUrl);
    } catch {
      // Network errors during dedup shouldn't block publish — fall through.
    }
  }

  try {
    const result = await publishRecipe(agent, stored.recipe as Recipe, {
      ...(rkey !== undefined && { rkey }),
    });
    await saveAtprotoRkey(slug, result.rkey);
    return { success: true, uri: result.uri, rkey: result.rkey };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const dedupCache = new Map<string, string>();

async function findExistingRkey(
  agent: Parameters<typeof fetchAllRecipes>[0],
  did: string,
  recipe: Recipe,
  sourceUrl: string,
): Promise<string | undefined> {
  const cacheKey = `${did}|${recipe.meta.slug}|${sourceUrl}`;
  const cached = dedupCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const all = await fetchAllRecipes(agent, did);
  for (const entry of all) {
    if (!('recipe' in entry)) continue;
    const matchesSlug = entry.recipe.meta.slug === recipe.meta.slug;
    const matchesSource =
      entry.recipe.meta.source !== undefined &&
      sourceUrl !== '' &&
      entry.recipe.meta.source === sourceUrl;
    if (matchesSlug || matchesSource) {
      dedupCache.set(cacheKey, entry.rkey);
      return entry.rkey;
    }
  }
  return undefined;
}
