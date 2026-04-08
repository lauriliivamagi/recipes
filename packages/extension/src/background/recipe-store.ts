/**
 * IndexedDB recipe storage via idb.
 * Stores validated recipe JSON with metadata for listing and dedup.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { StoredRecipe } from '../shared/types.js';

interface RecipeImportDB {
  recipes: {
    key: string;
    value: StoredRecipe;
    indexes: {
      'by-imported': number;
      'by-source': string;
    };
  };
}

const DB_NAME = 'recipe-import';
const DB_VERSION = 1;

function getDB(): Promise<IDBPDatabase<RecipeImportDB>> {
  return openDB<RecipeImportDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('recipes', { keyPath: 'slug' });
      store.createIndex('by-imported', 'importedAt');
      store.createIndex('by-source', 'sourceUrl');
    },
  });
}

export async function saveRecipe(recipe: StoredRecipe): Promise<void> {
  const db = await getDB();
  await db.put('recipes', recipe);
}

export async function getAllRecipes(): Promise<StoredRecipe[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('recipes', 'by-imported');
  // Most recent first
  return all.reverse();
}

export async function getRecipe(slug: string): Promise<StoredRecipe | undefined> {
  const db = await getDB();
  return db.get('recipes', slug);
}

export async function deleteRecipe(slug: string): Promise<void> {
  const db = await getDB();
  await db.delete('recipes', slug);
}

/** @knipignore */
export async function getRecipeBySource(url: string): Promise<StoredRecipe | undefined> {
  const db = await getDB();
  return db.getFromIndex('recipes', 'by-source', url);
}
