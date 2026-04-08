import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor } from 'xstate';
import { catalogMachine } from './catalog-machine.js';
import type { CatalogRecipe } from '@recipe/domain/catalog/types.js';

const mockRecipes: CatalogRecipe[] = [
  {
    title: 'Spaghetti Bolognese',
    slug: 'spaghetti-bolognese',
    category: 'italian',
    tags: ['pasta', 'italian', 'meat'],
    difficulty: 'medium',
    totalTime: { relaxed: { min: 5400 }, optimized: { min: 3600 } },
    servings: 4,
    language: 'en',
    url: '/recipes/italian/spaghetti-bolognese/',
  },
  {
    title: 'Classic Lasagne',
    slug: 'classic-lasagne',
    category: 'italian',
    tags: ['pasta', 'italian', 'baked'],
    difficulty: 'hard',
    totalTime: { relaxed: { min: 7200 }, optimized: { min: 5400 } },
    servings: 6,
    language: 'en',
    url: '/recipes/italian/classic-lasagne/',
  },
  {
    title: 'Green Salad',
    slug: 'green-salad',
    category: 'salads',
    tags: ['salad', 'vegetarian', 'quick'],
    difficulty: 'easy',
    totalTime: { relaxed: { min: 600 }, optimized: { min: 600 } },
    servings: 2,
    language: 'en',
    url: '/recipes/salads/green-salad/',
  },
];

describe('catalogMachine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with all recipes in filteredRecipes', () => {
    const actor = createActor(catalogMachine, {
      input: { recipes: mockRecipes },
    });
    actor.start();

    const snap = actor.getSnapshot();
    expect(snap.context.filteredRecipes).toHaveLength(3);
    expect(snap.context.query).toBe('');
    expect(snap.context.activeTags).toEqual([]);
    expect(snap.value).toBe('idle');

    actor.stop();
  });

  it('filters recipes after tag toggle (immediate, no debounce)', () => {
    const actor = createActor(catalogMachine, {
      input: { recipes: mockRecipes },
    });
    actor.start();

    actor.send({ type: 'TAG_TOGGLE', tag: 'vegetarian' });

    const snap = actor.getSnapshot();
    expect(snap.context.filteredRecipes).toHaveLength(1);
    expect(snap.context.filteredRecipes[0]!.slug).toBe('green-salad');
    expect(snap.context.activeTags).toEqual(['vegetarian']);

    actor.stop();
  });

  it('debounces search queries (300ms)', () => {
    const actor = createActor(catalogMachine, {
      input: { recipes: mockRecipes },
    });
    actor.start();

    actor.send({ type: 'SEARCH', query: 'spa' });

    // Before debounce completes — still in debouncing state
    let snap = actor.getSnapshot();
    expect(snap.value).toBe('debouncing');
    expect(snap.context.query).toBe('spa');
    // filteredRecipes not yet updated (still has all recipes from init)
    expect(snap.context.filteredRecipes).toHaveLength(3);

    // Advance past debounce
    vi.advanceTimersByTime(300);

    snap = actor.getSnapshot();
    expect(snap.value).toBe('filtered');
    expect(snap.context.filteredRecipes).toHaveLength(1);
    expect(snap.context.filteredRecipes[0]!.slug).toBe('spaghetti-bolognese');

    actor.stop();
  });

  it('resets debounce timer on rapid search input', () => {
    const actor = createActor(catalogMachine, {
      input: { recipes: mockRecipes },
    });
    actor.start();

    actor.send({ type: 'SEARCH', query: 's' });
    vi.advanceTimersByTime(200);

    // Another search before 300ms — should reset the debounce
    actor.send({ type: 'SEARCH', query: 'sal' });
    vi.advanceTimersByTime(200);

    // Still debouncing (only 200ms since last SEARCH)
    let snap = actor.getSnapshot();
    expect(snap.value).toBe('debouncing');

    vi.advanceTimersByTime(100);

    snap = actor.getSnapshot();
    expect(snap.value).toBe('filtered');
    expect(snap.context.filteredRecipes).toHaveLength(1);
    expect(snap.context.filteredRecipes[0]!.slug).toBe('green-salad');

    actor.stop();
  });

  it('clears all filters and returns to idle', () => {
    const actor = createActor(catalogMachine, {
      input: { recipes: mockRecipes },
    });
    actor.start();

    actor.send({ type: 'TAG_TOGGLE', tag: 'pasta' });
    expect(actor.getSnapshot().context.filteredRecipes).toHaveLength(2);

    actor.send({ type: 'CLEAR_FILTERS' });

    const snap = actor.getSnapshot();
    expect(snap.value).toBe('idle');
    expect(snap.context.query).toBe('');
    expect(snap.context.activeTags).toEqual([]);
    expect(snap.context.filteredRecipes).toHaveLength(3);

    actor.stop();
  });

  it('toggling same tag twice removes it', () => {
    const actor = createActor(catalogMachine, {
      input: { recipes: mockRecipes },
    });
    actor.start();

    actor.send({ type: 'TAG_TOGGLE', tag: 'vegetarian' });
    expect(actor.getSnapshot().context.activeTags).toEqual(['vegetarian']);
    expect(actor.getSnapshot().context.filteredRecipes).toHaveLength(1);

    actor.send({ type: 'TAG_TOGGLE', tag: 'vegetarian' });
    expect(actor.getSnapshot().context.activeTags).toEqual([]);
    expect(actor.getSnapshot().context.filteredRecipes).toHaveLength(3);

    actor.stop();
  });

  it('combines tag filter with search', () => {
    const actor = createActor(catalogMachine, {
      input: { recipes: mockRecipes },
    });
    actor.start();

    // First filter by tag
    actor.send({ type: 'TAG_TOGGLE', tag: 'pasta' });
    expect(actor.getSnapshot().context.filteredRecipes).toHaveLength(2);

    // Then search within filtered results
    actor.send({ type: 'SEARCH', query: 'lasagne' });
    vi.advanceTimersByTime(300);

    const snap = actor.getSnapshot();
    expect(snap.context.filteredRecipes).toHaveLength(1);
    expect(snap.context.filteredRecipes[0]!.slug).toBe('classic-lasagne');

    actor.stop();
  });

  it('filteredRecipes are sorted alphabetically', () => {
    const actor = createActor(catalogMachine, {
      input: { recipes: mockRecipes },
    });
    actor.start();

    const snap = actor.getSnapshot();
    const titles = snap.context.filteredRecipes.map(r => r.title);
    expect(titles).toEqual(['Classic Lasagne', 'Green Salad', 'Spaghetti Bolognese']);

    actor.stop();
  });
});
