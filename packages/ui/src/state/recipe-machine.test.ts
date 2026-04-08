import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor } from 'xstate';
import { recipeMachine } from './recipe-machine.js';
import type { RecipeInput } from './recipe-machine.js';
import type { Recipe } from '@recipe/domain/recipe/types.js';
import type { Phase } from '@recipe/domain/schedule/types.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockRecipe: Recipe = {
  meta: {
    title: 'Test Recipe',
    slug: 'test-recipe' as any,
    language: 'en',
    originalText: '',
    tags: ['test'],
    servings: 4,
    totalTime: { relaxed: { min: 3600 }, optimized: { min: 2700 } },
    difficulty: 'medium',
  },
  ingredients: [
    { id: 'ing-1' as any, name: 'Salt', quantity: { min: 1, unit: 'tsp' }, group: 'spices' },
  ],
  equipment: [
    { id: 'eq-1' as any, name: 'Pan', count: 1 },
  ],
  operations: [
    { id: 'op-1' as any, type: 'prep', action: 'chop onions', ingredients: ['ing-1' as any], depends: [], equipment: [], time: { min: 300 }, activeTime: { min: 300 }, scalable: true },
    { id: 'op-2' as any, type: 'cook', action: 'sauté onions', ingredients: [], depends: ['op-1' as any], equipment: [{ use: 'eq-1' as any, release: false }], time: { min: 600 }, activeTime: { min: 180 }, scalable: true },
    { id: 'op-3' as any, type: 'cook', action: 'simmer sauce', ingredients: [], depends: ['op-2' as any], equipment: [{ use: 'eq-1' as any, release: true }], time: { min: 1200 }, activeTime: { min: 120 }, scalable: true },
    { id: 'op-4' as any, type: 'assemble', action: 'plate and serve', ingredients: [], depends: ['op-3' as any], equipment: [], time: { min: 120 }, activeTime: { min: 120 }, scalable: true },
  ],
  subProducts: [],
};

const mockPhases: Phase[] = [
  {
    name: 'Prep',
    type: 'prep',
    time: { min: 300 },
    operations: [mockRecipe.operations[0]!],
    parallel: false,
  },
  {
    name: 'Cook',
    type: 'cook',
    time: { min: 600 },
    operations: [mockRecipe.operations[1]!],
    parallel: false,
  },
  {
    name: 'Simmer',
    type: 'simmer',
    time: { min: 1200 },
    operations: [mockRecipe.operations[2]!],
    parallel: false,
  },
  {
    name: 'Assemble',
    type: 'assemble',
    time: { min: 120 },
    operations: [mockRecipe.operations[3]!],
    parallel: false,
  },
];

function createTestInput(overrides?: Partial<RecipeInput>): RecipeInput {
  return {
    recipe: mockRecipe,
    scheduleModes: { relaxed: mockPhases, optimized: mockPhases },
    mode: 'relaxed',
    servings: 4,
    originalServings: 4,
    totalSteps: 4,
    ...overrides,
  };
}

function startMachine(overrides?: Partial<RecipeInput>) {
  const actor = createActor(recipeMachine, {
    input: createTestInput(overrides),
  });
  actor.start();
  return actor;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('recipeMachine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock navigator.wakeLock and localStorage for invoked actors
    vi.stubGlobal('navigator', {
      ...navigator,
      wakeLock: { request: vi.fn().mockResolvedValue({ release: vi.fn() }) },
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  // Parallel regions
  // -----------------------------------------------------------------------
  describe('parallel regions', () => {
    it('starts with overview + idle timers in parallel', () => {
      const actor = startMachine();
      const snap = actor.getSnapshot();

      expect(snap.value).toEqual({
        view: { overview: 'browsing' },
        timers: 'idle',
      });

      actor.stop();
    });

    it('timers region is independent of view region', () => {
      const actor = startMachine();

      // Switch to cooking
      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });

      const snap = actor.getSnapshot();
      expect(snap.value).toEqual({
        view: { cooking: { active: 'navigating' } },
        timers: 'idle',
      });

      actor.stop();
    });
  });

  // -----------------------------------------------------------------------
  // View state transitions
  // -----------------------------------------------------------------------
  describe('view transitions', () => {
    it('switches from overview to cooking', () => {
      const actor = startMachine();

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      expect(actor.getSnapshot().matches({ view: 'cooking' })).toBe(true);

      actor.stop();
    });

    it('switches from cooking back to overview', () => {
      const actor = startMachine();

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'SWITCH_VIEW', view: 'overview' });
      expect(actor.getSnapshot().matches({ view: 'overview' })).toBe(true);

      actor.stop();
    });

    it('ignores SWITCH_VIEW to current view (overview → overview)', () => {
      const actor = startMachine();

      actor.send({ type: 'SWITCH_VIEW', view: 'overview' });
      expect(actor.getSnapshot().matches({ view: { overview: 'browsing' } })).toBe(true);

      actor.stop();
    });
  });

  // -----------------------------------------------------------------------
  // History state
  // -----------------------------------------------------------------------
  describe('history state', () => {
    it('returns to last cooking step via deep history', () => {
      const actor = startMachine();

      // Enter cooking, advance to step 2
      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'NEXT_STEP' });
      vi.advanceTimersByTime(300); // clear stepTransition
      actor.send({ type: 'NEXT_STEP' });
      vi.advanceTimersByTime(300);

      expect(actor.getSnapshot().context.currentStep).toBe(2);

      // Switch to overview
      actor.send({ type: 'SWITCH_VIEW', view: 'overview' });
      expect(actor.getSnapshot().matches({ view: 'overview' })).toBe(true);

      // Switch back — should restore step 2 via history
      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      expect(actor.getSnapshot().context.currentStep).toBe(2);

      actor.stop();
    });
  });

  // -----------------------------------------------------------------------
  // Guards
  // -----------------------------------------------------------------------
  describe('guards', () => {
    it('canGoNext prevents going past totalSteps', () => {
      const actor = startMachine({ totalSteps: 2 });

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });

      actor.send({ type: 'NEXT_STEP' }); // 0 → 1
      vi.advanceTimersByTime(300);
      actor.send({ type: 'NEXT_STEP' }); // 1 → 2 (completed)

      // At completed, NEXT_STEP should not be handled
      actor.send({ type: 'NEXT_STEP' });
      expect(actor.getSnapshot().context.currentStep).toBe(2);

      actor.stop();
    });

    it('canGoPrev prevents going below 0', () => {
      const actor = startMachine();

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'PREV_STEP' }); // at 0, should stay at 0

      expect(actor.getSnapshot().context.currentStep).toBe(0);

      actor.stop();
    });

    it('servingsAboveMin prevents servings going below 1', () => {
      const actor = startMachine({ servings: 1 });

      actor.send({ type: 'ADJUST_SERVINGS', delta: -1 });
      expect(actor.getSnapshot().context.servings).toBe(1); // unchanged

      actor.send({ type: 'ADJUST_SERVINGS', delta: 1 });
      expect(actor.getSnapshot().context.servings).toBe(2);

      actor.stop();
    });
  });

  // -----------------------------------------------------------------------
  // Cooking navigation + animation-phase states
  // -----------------------------------------------------------------------
  describe('cooking navigation', () => {
    it('NEXT_STEP enters stepTransition, then auto-exits after 300ms', () => {
      const actor = startMachine();

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'NEXT_STEP' });

      expect(actor.getSnapshot().matches({
        view: { cooking: { active: 'stepTransition' } },
      })).toBe(true);

      vi.advanceTimersByTime(300);

      expect(actor.getSnapshot().matches({
        view: { cooking: { active: 'navigating' } },
      })).toBe(true);

      actor.stop();
    });

    it('ANIMATION_COMPLETE exits stepTransition early', () => {
      const actor = startMachine();

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'NEXT_STEP' });

      expect(actor.getSnapshot().matches({
        view: { cooking: { active: 'stepTransition' } },
      })).toBe(true);

      actor.send({ type: 'ANIMATION_COMPLETE' });

      expect(actor.getSnapshot().matches({
        view: { cooking: { active: 'navigating' } },
      })).toBe(true);

      actor.stop();
    });

    it('last step transitions to completed', () => {
      const actor = startMachine({ totalSteps: 2 });

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'NEXT_STEP' }); // 0 → 1
      vi.advanceTimersByTime(300);
      actor.send({ type: 'NEXT_STEP' }); // 1 → 2, isLastStep → completed

      expect(actor.getSnapshot().matches({
        view: { cooking: 'completed' },
      })).toBe(true);
      expect(actor.getSnapshot().context.currentStep).toBe(2);

      actor.stop();
    });

    it('PREV_STEP from completed returns to active', () => {
      const actor = startMachine({ totalSteps: 1 });

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'NEXT_STEP' }); // → completed

      expect(actor.getSnapshot().matches({ view: { cooking: 'completed' } })).toBe(true);

      actor.send({ type: 'PREV_STEP' });
      vi.advanceTimersByTime(300);

      expect(actor.getSnapshot().matches({
        view: { cooking: { active: 'navigating' } },
      })).toBe(true);
      expect(actor.getSnapshot().context.currentStep).toBe(0);

      actor.stop();
    });

    it('JUMP_TO_STEP navigates to specific step', () => {
      const actor = startMachine();

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'JUMP_TO_STEP', step: 3 });
      vi.advanceTimersByTime(300);

      expect(actor.getSnapshot().context.currentStep).toBe(3);

      actor.stop();
    });
  });

  // -----------------------------------------------------------------------
  // Mode transitions
  // -----------------------------------------------------------------------
  describe('mode transitions', () => {
    it('SET_MODE changes mode in overview', () => {
      const actor = startMachine();

      actor.send({ type: 'SET_MODE', mode: 'optimized' });
      expect(actor.getSnapshot().context.mode).toBe('optimized');

      actor.stop();
    });

    it('SET_MODE in overview enters modeTransition state', () => {
      const actor = startMachine();

      actor.send({ type: 'SET_MODE', mode: 'optimized' });

      expect(actor.getSnapshot().matches({
        view: { overview: 'modeTransition' },
      })).toBe(true);

      vi.advanceTimersByTime(300);

      expect(actor.getSnapshot().matches({
        view: { overview: 'browsing' },
      })).toBe(true);

      actor.stop();
    });
  });

  // -----------------------------------------------------------------------
  // Servings
  // -----------------------------------------------------------------------
  describe('servings', () => {
    it('ADJUST_SERVINGS changes servings', () => {
      const actor = startMachine();

      actor.send({ type: 'ADJUST_SERVINGS', delta: 2 });
      expect(actor.getSnapshot().context.servings).toBe(6);

      actor.send({ type: 'ADJUST_SERVINGS', delta: -3 });
      expect(actor.getSnapshot().context.servings).toBe(3);

      actor.stop();
    });

    it('ADJUST_SERVINGS works in both overview and cooking', () => {
      const actor = startMachine();

      actor.send({ type: 'ADJUST_SERVINGS', delta: 1 });
      expect(actor.getSnapshot().context.servings).toBe(5);

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'ADJUST_SERVINGS', delta: 1 });
      expect(actor.getSnapshot().context.servings).toBe(6);

      actor.stop();
    });
  });

  // -----------------------------------------------------------------------
  // Timer spawned actors
  // -----------------------------------------------------------------------
  describe('timer actors', () => {
    it('START_TIMER transitions timers region to running', () => {
      const actor = startMachine();

      actor.send({ type: 'START_TIMER', opId: 'op-1', seconds: 60 });

      const snap = actor.getSnapshot();
      expect(snap.value).toMatchObject({ timers: 'running' });
      expect(snap.context.timerStates.size).toBe(1);
      expect(snap.context.timerStates.get('op-1')).toEqual({ remaining: 60, total: 60 });

      actor.stop();
    });

    it('TIMER.TICK updates timer state', () => {
      const actor = startMachine();

      actor.send({ type: 'START_TIMER', opId: 'op-1', seconds: 60 });

      // Simulate tick from spawned actor
      vi.advanceTimersByTime(1000);

      const snap = actor.getSnapshot();
      const timer = snap.context.timerStates.get('op-1');
      expect(timer).toBeDefined();
      // Timer should have ticked down
      expect(timer!.remaining).toBeLessThan(60);

      actor.stop();
    });

    it('CANCEL_TIMER removes timer and transitions to idle if last', () => {
      const actor = startMachine();

      actor.send({ type: 'START_TIMER', opId: 'op-1', seconds: 60 });
      expect(actor.getSnapshot().value).toMatchObject({ timers: 'running' });

      actor.send({ type: 'CANCEL_TIMER', opId: 'op-1' });

      const snap = actor.getSnapshot();
      expect(snap.value).toMatchObject({ timers: 'idle' });
      expect(snap.context.timerStates.size).toBe(0);

      actor.stop();
    });

    it('timers continue across view switches (parallel regions)', () => {
      const actor = startMachine();

      actor.send({ type: 'SWITCH_VIEW', view: 'cooking' });
      actor.send({ type: 'START_TIMER', opId: 'op-1', seconds: 60 });

      expect(actor.getSnapshot().value).toMatchObject({ timers: 'running' });

      // Switch to overview — timer should still be running
      actor.send({ type: 'SWITCH_VIEW', view: 'overview' });

      expect(actor.getSnapshot().value).toMatchObject({
        view: { overview: 'browsing' },
        timers: 'running',
      });
      expect(actor.getSnapshot().context.timerStates.size).toBe(1);

      actor.stop();
    });
  });

  // -----------------------------------------------------------------------
  // Context initialization
  // -----------------------------------------------------------------------
  describe('initialization', () => {
    it('initializes with provided input', () => {
      const actor = startMachine({
        servings: 8,
        mode: 'optimized',
        currentStep: 2,
      });

      const ctx = actor.getSnapshot().context;
      expect(ctx.servings).toBe(8);
      expect(ctx.mode).toBe('optimized');
      expect(ctx.currentStep).toBe(2);
      expect(ctx.originalServings).toBe(4);

      actor.stop();
    });

    it('defaults currentStep to 0 when not provided', () => {
      const actor = startMachine();

      expect(actor.getSnapshot().context.currentStep).toBe(0);

      actor.stop();
    });

    it('starts with empty timer maps', () => {
      const actor = startMachine();

      const ctx = actor.getSnapshot().context;
      expect(ctx.timerRefs.size).toBe(0);
      expect(ctx.timerStates.size).toBe(0);

      actor.stop();
    });
  });
});
