import { setup, assign } from 'xstate';
import type { Recipe } from '../../domain/recipe/types.js';
import type { Phase, ScheduleMode } from '../../domain/schedule/types.js';

export interface RecipeContext {
  recipe: Recipe;
  scheduleModes: Record<ScheduleMode, Phase[]>;
  mode: ScheduleMode;
  servings: number;
  originalServings: number;
  currentStep: number;
  totalSteps: number;
  timers: Map<string, { remaining: number; total: number }>;
  wakeLockActive: boolean;
}

export type RecipeEvent =
  | { type: 'SWITCH_VIEW'; view: 'overview' | 'cooking' }
  | { type: 'SET_MODE'; mode: ScheduleMode }
  | { type: 'ADJUST_SERVINGS'; delta: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'JUMP_TO_STEP'; step: number }
  | { type: 'START_TIMER'; opId: string; seconds: number }
  | { type: 'CANCEL_TIMER'; opId: string }
  | { type: 'TIMER_TICK'; opId: string }
  | { type: 'TIMER_DONE'; opId: string };

export type RecipeInput = Omit<RecipeContext, 'currentStep' | 'timers' | 'wakeLockActive'>;

export const recipeMachine = setup({
  types: {
    context: {} as RecipeContext,
    events: {} as RecipeEvent,
    input: {} as RecipeInput,
  },
  actions: {
    setMode: assign({
      mode: ({ event }) => (event as { type: 'SET_MODE'; mode: ScheduleMode }).mode,
    }),
    adjustServings: assign({
      servings: ({ context, event }) =>
        Math.max(1, context.servings + (event as { type: 'ADJUST_SERVINGS'; delta: number }).delta),
    }),
    nextStep: assign({
      currentStep: ({ context }) => Math.min(context.currentStep + 1, context.totalSteps - 1),
    }),
    prevStep: assign({
      currentStep: ({ context }) => Math.max(context.currentStep - 1, 0),
    }),
    jumpToStep: assign({
      currentStep: ({ event }) => (event as { type: 'JUMP_TO_STEP'; step: number }).step,
    }),
  },
}).createMachine({
  id: 'recipe',
  context: ({ input }) => ({
    ...input,
    currentStep: 0,
    timers: new Map(),
    wakeLockActive: false,
  }),
  initial: 'overview',
  states: {
    overview: {
      on: {
        SWITCH_VIEW: [
          { guard: ({ event }) => event.view === 'cooking', target: 'cooking' },
        ],
        SET_MODE: { actions: 'setMode' },
        ADJUST_SERVINGS: { actions: 'adjustServings' },
      },
    },
    cooking: {
      on: {
        SWITCH_VIEW: [
          { guard: ({ event }) => event.view === 'overview', target: 'overview' },
        ],
        NEXT_STEP: { actions: 'nextStep' },
        PREV_STEP: { actions: 'prevStep' },
        JUMP_TO_STEP: { actions: 'jumpToStep' },
        SET_MODE: { actions: 'setMode' },
        ADJUST_SERVINGS: { actions: 'adjustServings' },
      },
    },
  },
});
