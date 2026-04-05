import { setup, assign } from 'xstate';
import type { CatalogRecipe } from '../../domain/catalog/types.js';
import { filterRecipes } from '../../domain/catalog/filter.js';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface CatalogContext {
  recipes: CatalogRecipe[];
  query: string;
  activeTags: string[];
  filteredRecipes: CatalogRecipe[];
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type CatalogEvent =
  | { type: 'SEARCH'; query: string }
  | { type: 'TAG_TOGGLE'; tag: string }
  | { type: 'CLEAR_FILTERS' };

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export type CatalogInput = {
  recipes: CatalogRecipe[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeFiltered(recipes: CatalogRecipe[], query: string, tags: string[]): CatalogRecipe[] {
  return filterRecipes(recipes, query, tags)
    .sort((a, b) => a.title.localeCompare(b.title));
}

// ---------------------------------------------------------------------------
// Machine
// ---------------------------------------------------------------------------

export const catalogMachine = setup({
  types: {
    context: {} as CatalogContext,
    events: {} as CatalogEvent,
    input: {} as CatalogInput,
  },

  guards: {
    hasActiveFilters: ({ context }) =>
      context.query.length > 0 || context.activeTags.length > 0,
  },

  actions: {
    setQuery: assign({
      query: ({ event }) => (event as { query: string }).query,
    }),

    toggleTag: assign({
      activeTags: ({ context, event }) => {
        const tag = (event as { tag: string }).tag;
        return context.activeTags.includes(tag)
          ? context.activeTags.filter(t => t !== tag)
          : [...context.activeTags, tag];
      },
    }),

    applyFilters: assign({
      filteredRecipes: ({ context }) =>
        computeFiltered(context.recipes, context.query, context.activeTags),
    }),

    clearAllFilters: assign({
      query: () => '',
      activeTags: () => [] as string[],
      filteredRecipes: ({ context }) => computeFiltered(context.recipes, '', []),
    }),
  },
}).createMachine({
  id: 'catalog',

  context: ({ input }) => ({
    recipes: input.recipes,
    query: '',
    activeTags: [],
    filteredRecipes: computeFiltered(input.recipes, '', []),
  }),

  initial: 'idle',

  states: {
    idle: {
      on: {
        SEARCH: {
          actions: 'setQuery',
          target: 'debouncing',
        },
        TAG_TOGGLE: {
          actions: ['toggleTag', 'applyFilters'],
          target: 'filtered',
        },
      },
    },

    // Search input triggers a debounce — waits 300ms before filtering
    debouncing: {
      on: {
        SEARCH: {
          actions: 'setQuery',
          target: 'debouncing',
          reenter: true,
        },
        TAG_TOGGLE: {
          actions: ['toggleTag', 'applyFilters'],
          target: 'filtered',
        },
      },
      after: {
        300: {
          actions: 'applyFilters',
          target: 'filtered',
        },
      },
    },

    filtered: {
      on: {
        SEARCH: {
          actions: 'setQuery',
          target: 'debouncing',
        },
        TAG_TOGGLE: {
          actions: ['toggleTag', 'applyFilters'],
        },
        CLEAR_FILTERS: {
          actions: 'clearAllFilters',
          target: 'idle',
        },
      },
    },
  },
});
