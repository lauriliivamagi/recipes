import { describe, expect, it, beforeEach } from 'vitest';
import { loadState, saveState } from './persistence.js';

const STORAGE_KEY = 'hob';

// Minimal in-memory localStorage shim — vitest default env is node, which
// has no Web Storage API.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string) { return this.store.has(k) ? this.store.get(k)! : null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
  get length() { return this.store.size; }
  key(i: number) { return [...this.store.keys()][i] ?? null; }
}
(globalThis as { localStorage?: Storage }).localStorage = new MemoryStorage() as unknown as Storage;

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a valid state', () => {
    saveState({
      lastRecipeSlug: 'lasagne',
      mode: 'optimized',
      servings: { lasagne: 4 },
      currentStep: { lasagne: 2 },
    });
    expect(loadState()).toEqual({
      lastRecipeSlug: 'lasagne',
      mode: 'optimized',
      servings: { lasagne: 4 },
      currentStep: { lasagne: 2 },
    });
  });

  it('returns empty state when nothing is stored', () => {
    expect(loadState()).toEqual({});
  });

  it('returns empty state for malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');
    expect(loadState()).toEqual({});
  });

  it('drops fields with the wrong type', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lastRecipeSlug: 42, // wrong type
        mode: 'relaxed',
        servings: { a: 1, b: 'not a number' },
      }),
    );
    expect(loadState()).toEqual({
      mode: 'relaxed',
      servings: { a: 1 },
    });
  });

  it('rejects unknown `mode` values', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode: 'evil-mode' }),
    );
    expect(loadState()).toEqual({});
  });

  it('returns empty state when top-level value is an array or primitive', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 2, 3]));
    expect(loadState()).toEqual({});
    localStorage.setItem(STORAGE_KEY, JSON.stringify('hello'));
    expect(loadState()).toEqual({});
  });
});
