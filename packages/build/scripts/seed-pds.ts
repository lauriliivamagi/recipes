/**
 * Seed an ATproto PDS with the in-repo recipe JSON fixtures.
 *
 * Usage:
 *   HOB_SEED_HANDLE=lauri.bsky.social \
 *   HOB_SEED_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx \
 *   HOB_SEED_PDS_URL=https://bsky.social \
 *   pnpm tsx packages/build/scripts/seed-pds.ts
 *
 * Idempotent via `.seed-rkeys.json` next to the script: the first publish
 * assigns a TID, subsequent runs reuse it and overwrite (update-in-place).
 * Delete `.seed-rkeys.json` to force new records.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loginWithAppPassword,
  publishRecipe,
} from '../../atproto/src/index.js';
import { parseRecipe } from '../../domain/src/recipe/parse.js';
import type { Recipe } from '../../domain/src/recipe/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildPkgDir = resolve(__dirname, '..');
const recipesDir = resolve(buildPkgDir, 'recipes');
const cachePath = resolve(buildPkgDir, '.seed-rkeys.json');

type SlugRkeyMap = Record<string, string>;

function loadCache(): SlugRkeyMap {
  if (!existsSync(cachePath)) return {};
  try {
    return JSON.parse(readFileSync(cachePath, 'utf8')) as SlugRkeyMap;
  } catch {
    return {};
  }
}

function saveCache(cache: SlugRkeyMap): void {
  writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

function findJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findJsonFiles(full));
    else if (entry.name.endsWith('.json')) results.push(full);
  }
  return results;
}

function loadRecipe(file: string): Recipe | null {
  try {
    const json = JSON.parse(readFileSync(file, 'utf8'));
    return parseRecipe(json);
  } catch (err) {
    console.error(`Skipping ${file}: ${(err as Error).message}`);
    return null;
  }
}

async function main(): Promise<void> {
  const handle = process.env['HOB_SEED_HANDLE'];
  const password = process.env['HOB_SEED_APP_PASSWORD'];
  const service = process.env['HOB_SEED_PDS_URL'] ?? 'https://bsky.social';

  if (!handle || !password) {
    console.error(
      'Missing HOB_SEED_HANDLE or HOB_SEED_APP_PASSWORD. See header of script for usage.',
    );
    process.exit(1);
  }

  const { agent } = await loginWithAppPassword({
    service,
    identifier: handle,
    password,
  });
  console.log(`Signed in as @${handle}`);

  const cache = loadCache();
  const files = findJsonFiles(recipesDir);

  if (files.length === 0) {
    console.log('No recipe JSON files found — nothing to seed.');
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const file of files) {
    const recipe = loadRecipe(file);
    if (!recipe) {
      failed += 1;
      continue;
    }
    const slug = recipe.meta.slug;
    const existingRkey = cache[slug];
    try {
      const result = await publishRecipe(agent, recipe, {
        ...(existingRkey !== undefined && { rkey: existingRkey }),
      });
      cache[slug] = result.rkey;
      saveCache(cache);
      console.log(
        `${existingRkey ? 'Updated' : 'Published'}: ${slug} → ${result.uri}`,
      );
      ok += 1;
    } catch (err) {
      console.error(`Failed ${slug}: ${(err as Error).message}`);
      failed += 1;
    }
  }

  console.log(`\nDone: ${ok} published, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
