import { describe, it, expect } from 'vitest';
import { computeSchedule, computeTotalTime } from './schedule.js';
import type { Phase } from './types.js';
import { makeRecipe, ing, op, equip, subProd, slug } from '../recipe/test-helpers.js';

const sampleRecipe = makeRecipe({
  meta: {
    title: 'Spaghetti Bolognese',
    slug: slug('spaghetti-bolognese'),
    language: 'en',
    originalText: 'test',
    tags: ['italian'],
    servings: 4,
    totalTime: { relaxed: 0, optimized: 0 },
    difficulty: 'easy' as const,
  },
  ingredients: [
    ing('onion', 'Onion', 1, 'whole', 'vegetables'),
    ing('garlic', 'Garlic', 3, 'cloves', 'vegetables'),
    ing('mince', 'Beef mince', 500, 'g', 'meat'),
    ing('tomatoes', 'Crushed tomatoes', 400, 'g', 'canned'),
    ing('spaghetti', 'Spaghetti', 400, 'g', 'pasta'),
    ing('parmesan', 'Parmesan', 50, 'g', 'dairy'),
  ],
  equipment: [
    equip('large-pan', 'Large pan', 1),
    equip('large-pot', 'Large pot', 1),
    equip('cutting-board', 'Cutting board', 1),
    equip('grater', 'Grater', 1),
  ],
  operations: [
    op({ id: 'dice-onion', type: 'prep', action: 'dice', inputs: ['onion'], equipment: { use: 'cutting-board', release: true }, time: 3, activeTime: 3 }),
    op({ id: 'mince-garlic', type: 'prep', action: 'mince', inputs: ['garlic'], equipment: { use: 'cutting-board', release: true }, time: 2, activeTime: 2 }),
    op({ id: 'saute-veg', type: 'cook', action: 'sauté', inputs: ['dice-onion', 'mince-garlic'], equipment: { use: 'large-pan', release: false }, time: 5, activeTime: 5, heat: 'medium' }),
    op({ id: 'brown-mince', type: 'cook', action: 'brown', inputs: ['saute-veg', 'mince'], equipment: { use: 'large-pan', release: false }, time: 8, activeTime: 8, heat: 'medium-high' }),
    op({ id: 'simmer-sauce', type: 'cook', action: 'simmer', inputs: ['brown-mince', 'tomatoes'], equipment: { use: 'large-pan', release: true }, time: 20, activeTime: 0, scalable: false, heat: 'low', output: 'sauce' }),
    op({ id: 'boil-pasta', type: 'cook', action: 'boil', inputs: ['spaghetti'], equipment: { use: 'large-pot', release: true }, time: 8, activeTime: 1, heat: 'high', output: 'pasta' }),
    op({ id: 'grate-parmesan', type: 'prep', action: 'grate', inputs: ['parmesan'], equipment: { use: 'grater', release: true }, time: 2, activeTime: 2 }),
  ],
  subProducts: [
    subProd('sauce', 'Bolognese Sauce', 'simmer-sauce'),
    subProd('pasta', 'Cooked Spaghetti', 'boil-pasta'),
  ],
  finishSteps: [
    { action: 'drain', inputs: ['boil-pasta'], details: 'Reserve pasta water' },
    { action: 'toss', inputs: ['simmer-sauce', 'boil-pasta'], details: 'Combine' },
    { action: 'top', inputs: ['grate-parmesan'], details: 'Serve' },
  ],
});

describe('computeSchedule — relaxed', () => {
  const phases = computeSchedule(sampleRecipe, 'relaxed');

  it('first phase is prep with all prep ops', () => {
    expect(phases[0]!.type).toBe('prep');
    expect(phases[0]!.name).toBe('Prep');
    const prepIds = phases[0]!.operations.map((op) => ('id' in op ? op.id : ''));
    expect(prepIds).toContain('dice-onion');
    expect(prepIds).toContain('mince-garlic');
    expect(prepIds).toContain('grate-parmesan');
  });

  it('prep time is sum of individual prep times', () => {
    expect(phases[0]!.time).toBe(3 + 2 + 2); // dice + mince + grate
  });

  it('no cook phase before prep', () => {
    const firstCookIdx = phases.findIndex((p) => p.type === 'cook' || p.type === 'simmer');
    const prepIdx = phases.findIndex((p) => p.type === 'prep');
    expect(prepIdx).toBeLessThan(firstCookIdx);
  });

  it('finish is last phase', () => {
    expect(phases[phases.length - 1]!.type).toBe('finish');
  });
});

describe('computeSchedule — optimized', () => {
  const relaxedPhases = computeSchedule(sampleRecipe, 'relaxed');
  const optimizedPhases = computeSchedule(sampleRecipe, 'optimized');

  it('shorter total time than relaxed', () => {
    const relaxedTime = computeTotalTime(relaxedPhases);
    const optimizedTime = computeTotalTime(optimizedPhases);
    expect(optimizedTime).toBeLessThanOrEqual(relaxedTime);
  });

  it('has at least one phase with parallel ops', () => {
    const hasParallel = optimizedPhases.some(
      (p) => p.parallel && p.parallelOps && p.parallelOps.length > 0,
    );
    expect(hasParallel).toBe(true);
  });

  it('early prep has only the prep ops needed before first idle window (dice-onion, mince-garlic)', () => {
    const prepPhase = optimizedPhases.find((p) => p.type === 'prep' && p.name === 'Prep');
    expect(prepPhase).toBeDefined();
    const prepIds = prepPhase!.operations.map((op) => ('id' in op ? op.id : ''));
    expect(prepIds).toContain('dice-onion');
    expect(prepIds).toContain('mince-garlic');
    expect(prepIds.length).toBe(2);
  });
});

describe('computeSchedule — relaxed with ungrouped cook ops', () => {
  const noSubProductRecipe = makeRecipe({
    meta: {
      title: 'Simple Stir Fry',
      slug: slug('simple-stir-fry'),
      language: 'en',
      originalText: 'test',
      tags: [],
      servings: 2,
      totalTime: { relaxed: 0, optimized: 0 },
      difficulty: 'easy' as const,
    },
    ingredients: [
      ing('veg', 'Vegetables', 300, 'g', 'produce'),
      ing('oil', 'Oil', 1, 'tbsp', 'pantry'),
    ],
    equipment: [equip('wok', 'Wok', 1)],
    operations: [
      op({ id: 'chop', type: 'prep', action: 'chop', inputs: ['veg'], time: 5, activeTime: 5 }),
      op({ id: 'fry', type: 'cook', action: 'stir fry', inputs: ['chop', 'oil'], equipment: { use: 'wok', release: true }, time: 8, activeTime: 8, heat: 'high' }),
    ],
    finishSteps: [
      { action: 'plate', inputs: ['fry'], details: 'Serve hot' },
    ],
  });

  it('handles cook ops not assigned to any sub-product', () => {
    const phases = computeSchedule(noSubProductRecipe, 'relaxed');
    const cookPhase = phases.find((p) => p.type === 'cook');
    expect(cookPhase).toBeDefined();
    expect(cookPhase!.operations).toHaveLength(1);
  });
});

describe('computeSchedule — optimized with no early prep', () => {
  const noEarlyPrepRecipe = makeRecipe({
    meta: {
      title: 'Test',
      slug: slug('test-no-early-prep'),
      language: 'en',
      originalText: 'test',
      tags: [],
      servings: 1,
      totalTime: { relaxed: 0, optimized: 0 },
      difficulty: 'easy' as const,
    },
    ingredients: [
      ing('a', 'A', 1, 'g', 'x'),
      ing('b', 'B', 1, 'g', 'x'),
      ing('c', 'C', 1, 'g', 'x'),
    ],
    equipment: [
      equip('pan', 'Pan', 1),
      equip('pot', 'Pot', 1),
    ],
    operations: [
      op({ id: 'fry', type: 'cook', action: 'fry', inputs: ['a'], equipment: { use: 'pan', release: true }, time: 10, activeTime: 10, heat: 'high' }),
      op({ id: 'boil', type: 'cook', action: 'boil', inputs: ['b'], equipment: { use: 'pot', release: true }, time: 8, activeTime: 8, heat: 'high' }),
      op({ id: 'garnish', type: 'prep', action: 'chop garnish', inputs: ['c'], time: 2, activeTime: 2 }),
    ],
    finishSteps: [
      { action: 'plate', inputs: ['fry', 'boil', 'garnish'], details: '' },
    ],
  });

  it('defers prep ops to remaining prep when no passive window exists', () => {
    const phases = computeSchedule(noEarlyPrepRecipe, 'optimized');
    const firstPhase = phases[0];
    expect(firstPhase!.type).not.toBe('prep');
    const hasGarnish = phases.some((p) =>
      p.operations.some((op) => 'id' in op && op.id === 'garnish'),
    );
    expect(hasGarnish).toBe(true);
  });
});

describe('computeSchedule — optimized with equipment conflicts', () => {
  const conflictRecipe = makeRecipe({
    meta: {
      title: 'Conflict Test',
      slug: slug('conflict-test'),
      language: 'en',
      originalText: 'test',
      tags: [],
      servings: 1,
      totalTime: { relaxed: 0, optimized: 0 },
      difficulty: 'easy' as const,
    },
    ingredients: [
      ing('a', 'A', 1, 'g', 'x'),
      ing('b', 'B', 1, 'g', 'x'),
      ing('c', 'C', 1, 'g', 'x'),
    ],
    equipment: [equip('pan', 'Pan', 1)],
    operations: [
      op({ id: 'fry', type: 'cook', action: 'fry', inputs: ['a'], equipment: { use: 'pan', release: false }, time: 5, activeTime: 5, heat: 'high' }),
      op({ id: 'simmer', type: 'cook', action: 'simmer', inputs: ['fry'], equipment: { use: 'pan', release: true }, time: 30, activeTime: 2, heat: 'low' }),
      op({ id: 'sear', type: 'cook', action: 'sear', inputs: ['b'], equipment: { use: 'pan', release: true }, time: 5, activeTime: 5, heat: 'high' }),
      op({ id: 'garnish', type: 'prep', action: 'chop', inputs: ['c'], time: 2, activeTime: 2 }),
    ],
    finishSteps: [
      { action: 'plate', inputs: ['simmer', 'sear', 'garnish'], details: '' },
    ],
  });

  it('schedules parallel cook chain in passive window when equipment is available', () => {
    const phases = computeSchedule(conflictRecipe, 'optimized');
    const simmerPhase = phases.find((p) => p.type === 'simmer');
    expect(simmerPhase).toBeDefined();
    expect(simmerPhase!.parallel).toBe(true);
    const parallelIds = simmerPhase!.parallelOps!.map((op) => op.id);
    expect(parallelIds).toContain('sear');
  });

  it('schedules prep ops in parallel during passive window', () => {
    const phases = computeSchedule(conflictRecipe, 'optimized');
    const simmerPhase = phases.find((p) => p.type === 'simmer');
    expect(simmerPhase).toBeDefined();
    if (simmerPhase?.parallelOps) {
      const parallelIds = simmerPhase.parallelOps.map((op) => op.id);
      expect(parallelIds).toContain('garnish');
    }
  });
});

describe('computeTotalTime', () => {
  it('sequential phases sum correctly', () => {
    const phases: Phase[] = [
      { name: 'A', type: 'prep', time: 5, operations: [], parallel: false },
      { name: 'B', type: 'cook', time: 10, operations: [], parallel: false },
      { name: 'C', type: 'finish', time: 3, operations: [], parallel: false },
    ];
    expect(computeTotalTime(phases)).toBe(18);
  });

  it('parallel phase with no parallelOps uses main time only', () => {
    const phases: Phase[] = [
      { name: 'Simmer', type: 'simmer', time: 20, operations: [], parallel: true },
    ];
    expect(computeTotalTime(phases)).toBe(20);
  });

  it('parallel phase with empty parallelOps uses main time only', () => {
    const phases: Phase[] = [
      { name: 'Simmer', type: 'simmer', time: 20, operations: [], parallel: true, parallelOps: [] },
    ];
    expect(computeTotalTime(phases)).toBe(20);
  });

  it('parallel phases use max of main vs parallel time', () => {
    const phases: Phase[] = [
      {
        name: 'Simmer + Parallel',
        type: 'simmer',
        time: 20,
        operations: [],
        parallel: true,
        parallelOps: [
          op({ id: 'p1', type: 'prep', action: 'grate', inputs: [], time: 2, activeTime: 2 }),
          op({ id: 'p2', type: 'cook', action: 'boil', inputs: [], time: 8, activeTime: 1 }),
        ],
      },
    ];
    // max(20, 2+8) = 20
    expect(computeTotalTime(phases)).toBe(20);
  });
});
