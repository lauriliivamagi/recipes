import { describe, expect, it, vi } from 'vitest';
import type { Agent } from '@atproto/api';
import type { Recipe, RecipeSlug } from '@recipe/domain';
import {
  ing,
  op,
  secs,
} from '@recipe/domain/recipe/test-helpers.js';
import { recipeToLexicon } from '../adapter/recipe.js';
import {
  fetchAllRecipes,
  fetchRecipe,
  fetchRecipes,
  resolveHandle,
} from './recipes.js';

function makeRecipe(slug: string, title: string): Recipe {
  return {
    meta: {
      title,
      slug: slug as RecipeSlug,
      language: 'en',
      originalText: 'x',
      tags: [],
      servings: 1,
      totalTime: {
        relaxed: { min: 60 },
        optimized: { min: 60 },
      },
      difficulty: 'easy',
    },
    ingredients: [ing('salt', 'Salt', 1, 'g', 'seasoning')],
    equipment: [],
    operations: [
      op({
        id: 'season',
        type: 'prep',
        action: 'season',
        ingredients: ['salt'],
        time: secs(30),
        activeTime: secs(30),
      }),
    ],
    subProducts: [],
  } as unknown as Recipe;
}

function lexRecord(recipe: Recipe): unknown {
  return recipeToLexicon(recipe);
}

function mockAgent(listResult: unknown, getResult?: unknown, resolveHandleResult?: unknown) {
  const listRecords = vi.fn().mockResolvedValue({ data: listResult });
  const getRecord = vi.fn().mockResolvedValue({ data: getResult });
  const resolveHandleFn = vi.fn().mockResolvedValue({ data: resolveHandleResult });
  return {
    agent: {
      com: {
        atproto: {
          repo: { listRecords, getRecord },
          identity: { resolveHandle: resolveHandleFn },
        },
      },
    } as unknown as Agent,
    listRecords,
    getRecord,
    resolveHandleFn,
  };
}

describe('fetchRecipes', () => {
  it('parses a list of records and returns recipes with rkey/uri/cid', async () => {
    const rec1 = makeRecipe('lasagne', 'Lasagne');
    const rec2 = makeRecipe('pesto', 'Pesto');
    const { agent, listRecords } = mockAgent({
      records: [
        { uri: 'at://did:plc:x/social.hob.temp.recipe/aaa', cid: 'bafy1', value: lexRecord(rec1) },
        { uri: 'at://did:plc:x/social.hob.temp.recipe/bbb', cid: 'bafy2', value: lexRecord(rec2) },
      ],
      cursor: 'next',
    });

    const page = await fetchRecipes(agent, 'did:plc:x');

    expect(listRecords).toHaveBeenCalledWith({
      repo: 'did:plc:x',
      collection: 'social.hob.temp.recipe',
      limit: 50,
    });
    expect(page.cursor).toBe('next');
    expect(page.recipes).toHaveLength(2);
    expect(page.recipes[0]).toMatchObject({
      rkey: 'aaa',
      uri: 'at://did:plc:x/social.hob.temp.recipe/aaa',
      cid: 'bafy1',
    });
    if ('recipe' in page.recipes[0]!) {
      expect(page.recipes[0].recipe.meta.slug).toBe('lasagne');
    }
  });

  it('surfaces malformed records as invalid rather than throwing', async () => {
    const good = makeRecipe('good', 'Good');
    const { agent } = mockAgent({
      records: [
        { uri: 'at://x/c/g', cid: 'bafy1', value: lexRecord(good) },
        { uri: 'at://x/c/bad', cid: 'bafy2', value: { $type: 'social.hob.temp.recipe' /* missing fields */ } },
      ],
    });

    const page = await fetchRecipes(agent, 'did:plc:x');
    expect(page.recipes).toHaveLength(2);
    expect('recipe' in page.recipes[0]!).toBe(true);
    expect('invalid' in page.recipes[1]!).toBe(true);
  });

  it('rejects records that fail DAG validation (dangling operation reference)', async () => {
    const bad = makeRecipe('bad', 'Bad');
    // Introduce a dangling depends reference. The lexicon record is
    // structurally fine but the DAG is invalid.
    const lex = lexRecord(bad) as {
      operations: Array<{ depends: string[] }>;
    };
    lex.operations[0]!.depends = ['does-not-exist'];
    const { agent } = mockAgent({
      records: [{ uri: 'at://x/c/bad', cid: 'bafy', value: lex }],
    });

    const page = await fetchRecipes(agent, 'did:plc:x');
    expect(page.recipes).toHaveLength(1);
    expect('invalid' in page.recipes[0]!).toBe(true);
  });

  it('passes cursor, limit, reverse to listRecords', async () => {
    const { agent, listRecords } = mockAgent({ records: [] });
    await fetchRecipes(agent, 'did:plc:x', { cursor: 'c', limit: 10, reverse: true });
    expect(listRecords).toHaveBeenCalledWith({
      repo: 'did:plc:x',
      collection: 'social.hob.temp.recipe',
      limit: 10,
      cursor: 'c',
      reverse: true,
    });
  });
});

describe('fetchRecipe', () => {
  it('fetches a single record and returns the parsed recipe', async () => {
    const rec = makeRecipe('my', 'Mine');
    const { agent, getRecord } = mockAgent(
      { records: [] },
      { uri: 'at://did:plc:x/c/r', cid: 'bafy', value: lexRecord(rec) },
    );
    const result = await fetchRecipe(agent, 'did:plc:x', 'r');
    expect(getRecord).toHaveBeenCalledWith({
      repo: 'did:plc:x',
      collection: 'social.hob.temp.recipe',
      rkey: 'r',
    });
    expect(result.recipe.meta.slug).toBe('my');
    expect(result.rkey).toBe('r');
  });
});

describe('fetchAllRecipes', () => {
  it('paginates via cursor until exhausted', async () => {
    const r1 = makeRecipe('a', 'A');
    const r2 = makeRecipe('b', 'B');
    const r3 = makeRecipe('c', 'C');

    const pages = [
      {
        records: [{ uri: 'at://x/c/1', cid: 'b1', value: lexRecord(r1) }],
        cursor: 'p2',
      },
      {
        records: [{ uri: 'at://x/c/2', cid: 'b2', value: lexRecord(r2) }],
        cursor: 'p3',
      },
      {
        records: [{ uri: 'at://x/c/3', cid: 'b3', value: lexRecord(r3) }],
      },
    ];
    const listRecords = vi.fn();
    pages.forEach((p) => listRecords.mockResolvedValueOnce({ data: p }));
    const agent = {
      com: { atproto: { repo: { listRecords } } },
    } as unknown as Agent;

    const all = await fetchAllRecipes(agent, 'did:plc:x', { pageSize: 1 });
    expect(all).toHaveLength(3);
    expect(listRecords).toHaveBeenCalledTimes(3);
  });

  it('honors the cap', async () => {
    const listRecords = vi.fn().mockResolvedValue({
      data: {
        records: new Array(100).fill(null).map((_, i) => ({
          uri: `at://x/c/${i}`,
          cid: `bafy${i}`,
          value: lexRecord(makeRecipe(`r${i}`, `R${i}`)),
        })),
        cursor: 'next',
      },
    });
    const agent = {
      com: { atproto: { repo: { listRecords } } },
    } as unknown as Agent;

    const all = await fetchAllRecipes(agent, 'did:plc:x', { cap: 50, pageSize: 100 });
    expect(all).toHaveLength(50);
  });
});

describe('resolveHandle', () => {
  it('wraps com.atproto.identity.resolveHandle', async () => {
    const { agent, resolveHandleFn } = mockAgent({ records: [] }, undefined, {
      did: 'did:plc:xyz',
    });
    const did = await resolveHandle(agent, 'alice.bsky.social');
    expect(resolveHandleFn).toHaveBeenCalledWith({ handle: 'alice.bsky.social' });
    expect(did).toBe('did:plc:xyz');
  });
});
