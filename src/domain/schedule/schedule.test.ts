import { describe, it, expect } from 'vitest';
import { computeSchedule, computeTotalTime } from './schedule.js';
import type { Phase } from './types.js';
import { makeRecipe, ing, op, equip, subProd, slug, secs } from '../recipe/test-helpers.js';

const sampleRecipe = makeRecipe({
  meta: {
    title: 'Spaghetti Bolognese',
    slug: slug('spaghetti-bolognese'),
    language: 'en',
    originalText: 'test',
    tags: ['italian'],
    servings: 4,
    totalTime: { relaxed: { min: 0 }, optimized: { min: 0 } },
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
    op({ id: 'dice-onion', type: 'prep', action: 'dice', ingredients: ['onion'], equipment: [{ use: 'cutting-board', release: true }], time: secs(180), activeTime: secs(180) }),
    op({ id: 'mince-garlic', type: 'prep', action: 'mince', ingredients: ['garlic'], equipment: [{ use: 'cutting-board', release: true }], time: secs(120), activeTime: secs(120) }),
    op({ id: 'saute-veg', type: 'cook', action: 'sauté', depends: ['dice-onion', 'mince-garlic'], equipment: [{ use: 'large-pan', release: false }], time: secs(300), activeTime: secs(300), temperature: { min: 170, unit: 'C' } }),
    op({ id: 'brown-mince', type: 'cook', action: 'brown', ingredients: ['mince'], depends: ['saute-veg'], equipment: [{ use: 'large-pan', release: false }], time: secs(480), activeTime: secs(480), temperature: { min: 200, unit: 'C' } }),
    op({ id: 'simmer-sauce', type: 'cook', action: 'simmer', ingredients: ['tomatoes'], depends: ['brown-mince'], equipment: [{ use: 'large-pan', release: true }], time: secs(1200), activeTime: secs(0), scalable: false, temperature: { min: 100, unit: 'C' }, output: 'sauce' }),
    op({ id: 'boil-pasta', type: 'cook', action: 'boil', ingredients: ['spaghetti'], equipment: [{ use: 'large-pot', release: true }], time: secs(480), activeTime: secs(60), temperature: { min: 100, unit: 'C' }, output: 'pasta' }),
    op({ id: 'grate-parmesan', type: 'prep', action: 'grate', ingredients: ['parmesan'], equipment: [{ use: 'grater', release: true }], time: secs(120), activeTime: secs(120) }),
    op({ id: 'assemble-plate', type: 'assemble', action: 'plate and serve', depends: ['simmer-sauce', 'boil-pasta', 'grate-parmesan'], time: secs(120), activeTime: secs(120) }),
  ],
  subProducts: [
    subProd('sauce', 'Bolognese Sauce', 'simmer-sauce'),
    subProd('pasta', 'Cooked Spaghetti', 'boil-pasta'),
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
    expect(phases[0]!.time.min).toBe(180 + 120 + 120); // dice + mince + grate
  });

  it('no cook phase before prep', () => {
    const firstCookIdx = phases.findIndex((p) => p.type === 'cook' || p.type === 'simmer');
    const prepIdx = phases.findIndex((p) => p.type === 'prep');
    expect(prepIdx).toBeLessThan(firstCookIdx);
  });

  it('assemble is last phase', () => {
    expect(phases[phases.length - 1]!.type).toBe('assemble');
  });
});

describe('computeSchedule — optimized', () => {
  const relaxedPhases = computeSchedule(sampleRecipe, 'relaxed');
  const optimizedPhases = computeSchedule(sampleRecipe, 'optimized');

  it('shorter total time than relaxed', () => {
    const relaxedTime = computeTotalTime(relaxedPhases);
    const optimizedTime = computeTotalTime(optimizedPhases);
    expect(optimizedTime.min).toBeLessThanOrEqual(relaxedTime.min);
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
      totalTime: { relaxed: { min: 0 }, optimized: { min: 0 } },
      difficulty: 'easy' as const,
    },
    ingredients: [
      ing('veg', 'Vegetables', 300, 'g', 'produce'),
      ing('oil', 'Oil', 1, 'tbsp', 'pantry'),
    ],
    equipment: [equip('wok', 'Wok', 1)],
    operations: [
      op({ id: 'chop', type: 'prep', action: 'chop', ingredients: ['veg'], time: secs(300), activeTime: secs(300) }),
      op({ id: 'fry', type: 'cook', action: 'stir fry', ingredients: ['oil'], depends: ['chop'], equipment: [{ use: 'wok', release: true }], time: secs(480), activeTime: secs(480), temperature: { min: 230, unit: 'C' } }),
      op({ id: 'plate', type: 'assemble', action: 'plate', depends: ['fry'], time: secs(60), activeTime: secs(60) }),
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
      totalTime: { relaxed: { min: 0 }, optimized: { min: 0 } },
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
      op({ id: 'fry', type: 'cook', action: 'fry', ingredients: ['a'], equipment: [{ use: 'pan', release: true }], time: secs(600), activeTime: secs(600), temperature: { min: 230, unit: 'C' } }),
      op({ id: 'boil', type: 'cook', action: 'boil', ingredients: ['b'], equipment: [{ use: 'pot', release: true }], time: secs(480), activeTime: secs(480), temperature: { min: 100, unit: 'C' } }),
      op({ id: 'garnish', type: 'prep', action: 'chop garnish', ingredients: ['c'], time: secs(120), activeTime: secs(120) }),
      op({ id: 'plate', type: 'assemble', action: 'plate', depends: ['fry', 'boil', 'garnish'], time: secs(60), activeTime: secs(60) }),
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
      totalTime: { relaxed: { min: 0 }, optimized: { min: 0 } },
      difficulty: 'easy' as const,
    },
    ingredients: [
      ing('a', 'A', 1, 'g', 'x'),
      ing('b', 'B', 1, 'g', 'x'),
      ing('c', 'C', 1, 'g', 'x'),
    ],
    equipment: [equip('pan', 'Pan', 1)],
    operations: [
      op({ id: 'fry', type: 'cook', action: 'fry', ingredients: ['a'], equipment: [{ use: 'pan', release: false }], time: secs(300), activeTime: secs(300), temperature: { min: 230, unit: 'C' } }),
      op({ id: 'simmer', type: 'cook', action: 'simmer', depends: ['fry'], equipment: [{ use: 'pan', release: true }], time: secs(1800), activeTime: secs(120), temperature: { min: 100, unit: 'C' } }),
      op({ id: 'sear', type: 'cook', action: 'sear', ingredients: ['b'], equipment: [{ use: 'pan', release: true }], time: secs(300), activeTime: secs(300), temperature: { min: 230, unit: 'C' } }),
      op({ id: 'garnish', type: 'prep', action: 'chop', ingredients: ['c'], time: secs(120), activeTime: secs(120) }),
      op({ id: 'plate', type: 'assemble', action: 'plate', depends: ['simmer', 'sear', 'garnish'], time: secs(60), activeTime: secs(60) }),
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
      { name: 'A', type: 'prep', time: { min: 300 }, operations: [], parallel: false },
      { name: 'B', type: 'cook', time: { min: 600 }, operations: [], parallel: false },
      { name: 'C', type: 'assemble', time: { min: 180 }, operations: [], parallel: false },
    ];
    expect(computeTotalTime(phases).min).toBe(1080);
  });

  it('parallel phase with no parallelOps uses main time only', () => {
    const phases: Phase[] = [
      { name: 'Simmer', type: 'simmer', time: { min: 1200 }, operations: [], parallel: true },
    ];
    expect(computeTotalTime(phases).min).toBe(1200);
  });

  it('parallel phase with empty parallelOps uses main time only', () => {
    const phases: Phase[] = [
      { name: 'Simmer', type: 'simmer', time: { min: 1200 }, operations: [], parallel: true, parallelOps: [] },
    ];
    expect(computeTotalTime(phases).min).toBe(1200);
  });

  it('parallel phases use max of main vs parallel time', () => {
    const phases: Phase[] = [
      {
        name: 'Simmer + Parallel',
        type: 'simmer',
        time: { min: 1200 },
        operations: [],
        parallel: true,
        parallelOps: [
          op({ id: 'p1', type: 'prep', action: 'grate', time: secs(120), activeTime: secs(120) }),
          op({ id: 'p2', type: 'cook', action: 'boil', time: secs(480), activeTime: secs(60) }),
        ],
      },
    ];
    // max(1200, 120+480) = 1200
    expect(computeTotalTime(phases).min).toBe(1200);
  });
});
