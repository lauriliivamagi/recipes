import { describe, it, expect } from 'vitest';
import { computeSchedule, computeTotalTime } from './schedule.js';
import type { Recipe } from '../recipe/types.js';
import type { Phase } from './types.js';

const sampleRecipe: Recipe = {
  meta: {
    title: 'Spaghetti Bolognese',
    slug: 'spaghetti-bolognese',
    language: 'en',
    originalText: 'test',
    tags: ['italian'],
    servings: 4,
    totalTime: { relaxed: 0, optimized: 0 },
    difficulty: 'easy' as const,
  },
  ingredients: [
    { id: 'onion', name: 'Onion', quantity: 1, unit: 'whole', group: 'vegetables' },
    { id: 'garlic', name: 'Garlic', quantity: 3, unit: 'cloves', group: 'vegetables' },
    { id: 'mince', name: 'Beef mince', quantity: 500, unit: 'g', group: 'meat' },
    { id: 'tomatoes', name: 'Crushed tomatoes', quantity: 400, unit: 'g', group: 'canned' },
    { id: 'spaghetti', name: 'Spaghetti', quantity: 400, unit: 'g', group: 'pasta' },
    { id: 'parmesan', name: 'Parmesan', quantity: 50, unit: 'g', group: 'dairy' },
  ],
  equipment: [
    { id: 'large-pan', name: 'Large pan', count: 1 },
    { id: 'large-pot', name: 'Large pot', count: 1 },
    { id: 'cutting-board', name: 'Cutting board', count: 1 },
    { id: 'grater', name: 'Grater', count: 1 },
  ],
  operations: [
    { id: 'dice-onion', type: 'prep' as const, action: 'dice', inputs: ['onion'], equipment: { use: 'cutting-board', release: true }, time: 3, activeTime: 3 },
    { id: 'mince-garlic', type: 'prep' as const, action: 'mince', inputs: ['garlic'], equipment: { use: 'cutting-board', release: true }, time: 2, activeTime: 2 },
    { id: 'saute-veg', type: 'cook' as const, action: 'saut\u00e9', inputs: ['dice-onion', 'mince-garlic'], equipment: { use: 'large-pan', release: false }, time: 5, activeTime: 5, heat: 'medium' },
    { id: 'brown-mince', type: 'cook' as const, action: 'brown', inputs: ['saute-veg', 'mince'], equipment: { use: 'large-pan', release: false }, time: 8, activeTime: 8, heat: 'medium-high' },
    { id: 'simmer-sauce', type: 'cook' as const, action: 'simmer', inputs: ['brown-mince', 'tomatoes'], equipment: { use: 'large-pan', release: true }, time: 20, activeTime: 0, scalable: false, heat: 'low', output: 'sauce' },
    { id: 'boil-pasta', type: 'cook' as const, action: 'boil', inputs: ['spaghetti'], equipment: { use: 'large-pot', release: true }, time: 8, activeTime: 1, heat: 'high', output: 'pasta' },
    { id: 'grate-parmesan', type: 'prep' as const, action: 'grate', inputs: ['parmesan'], equipment: { use: 'grater', release: true }, time: 2, activeTime: 2 },
  ],
  subProducts: [
    { id: 'sauce', name: 'Bolognese Sauce', finalOp: 'simmer-sauce' },
    { id: 'pasta', name: 'Cooked Spaghetti', finalOp: 'boil-pasta' },
  ],
  finishSteps: [
    { action: 'drain', inputs: ['boil-pasta'], details: 'Reserve pasta water' },
    { action: 'toss', inputs: ['simmer-sauce', 'boil-pasta'], details: 'Combine' },
    { action: 'top', inputs: ['grate-parmesan'], details: 'Serve' },
  ],
};

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

describe('computeTotalTime', () => {
  it('sequential phases sum correctly', () => {
    const phases: Phase[] = [
      { name: 'A', type: 'prep', time: 5, operations: [], parallel: false },
      { name: 'B', type: 'cook', time: 10, operations: [], parallel: false },
      { name: 'C', type: 'finish', time: 3, operations: [], parallel: false },
    ];
    expect(computeTotalTime(phases)).toBe(18);
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
          { id: 'p1', type: 'prep', action: 'grate', inputs: [], time: 2, activeTime: 2 },
          { id: 'p2', type: 'cook', action: 'boil', inputs: [], time: 8, activeTime: 1 },
        ],
      },
    ];
    // max(20, 2+8) = 20
    expect(computeTotalTime(phases)).toBe(20);
  });
});
