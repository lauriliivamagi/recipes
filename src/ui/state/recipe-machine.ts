import { setup, assign, spawnChild, stopChild, fromCallback, raise, enqueueActions } from 'xstate';
import type { ActorRefFrom, AnyActorRef } from 'xstate';
import type { Recipe } from '../../domain/recipe/types.js';
import type { Phase, ScheduleMode } from '../../domain/schedule/types.js';
import { timerActor } from './timer-actor.js';
import { playTimerAlarm } from './audio.js';
import { loadState, saveState } from './persistence.js';


// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface RecipeContext {
  recipe: Recipe;
  scheduleModes: Record<ScheduleMode, Phase[]>;
  mode: ScheduleMode;
  servings: number;
  originalServings: number;
  currentStep: number;
  totalSteps: number;
  timerRefs: Map<string, AnyActorRef>;
  timerStates: Map<string, { remaining: number; total: number }>;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type RecipeEvent =
  | { type: 'SWITCH_VIEW'; view: 'overview' | 'cooking' }
  | { type: 'SET_MODE'; mode: ScheduleMode }
  | { type: 'ADJUST_SERVINGS'; delta: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'JUMP_TO_STEP'; step: number }
  | { type: 'START_TIMER'; opId: string; seconds: number }
  | { type: 'CANCEL_TIMER'; opId: string }
  | { type: 'TIMER.TICK'; opId: string; remaining: number }
  | { type: 'TIMER.DONE'; opId: string }
  | { type: 'ANIMATION_COMPLETE' };

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export type RecipeInput = {
  recipe: Recipe;
  scheduleModes: Record<ScheduleMode, Phase[]>;
  mode: ScheduleMode;
  servings: number;
  originalServings: number;
  totalSteps: number;
  currentStep?: number;
};

// ---------------------------------------------------------------------------
// Machine
// ---------------------------------------------------------------------------

export const recipeMachine = setup({
  types: {
    context: {} as RecipeContext,
    events: {} as RecipeEvent,
    input: {} as RecipeInput,
  },

  // -- Named actors ---------------------------------------------------------
  actors: {
    timerActor,

    persistenceActor: fromCallback(({ system }) => {
      let debounceTimer: ReturnType<typeof setTimeout> | undefined;

      // Subscribe to the root actor to persist state on changes
      const rootActor = system.get('recipe') as AnyActorRef | undefined;
      const sub = rootActor?.subscribe((snapshot: any) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const ctx = snapshot.context as RecipeContext;
          const slug = ctx.recipe.meta.slug;
          const persisted = loadState();
          saveState({
            ...persisted,
            lastRecipeSlug: slug,
            mode: ctx.mode,
            servings: { ...persisted.servings, [slug]: ctx.servings },
            currentStep: { ...persisted.currentStep, [slug]: ctx.currentStep },
          });
        }, 500);
      });

      return () => {
        clearTimeout(debounceTimer);
        sub?.unsubscribe();
      };
    }),

    wakeLockActor: fromCallback(() => {
      let sentinel: WakeLockSentinel | null = null;

      // Guard for non-browser environments (tests)
      if (typeof document === 'undefined') {
        return () => {};
      }

      const acquireLock = async () => {
        try {
          if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
            sentinel = await navigator.wakeLock.request('screen');
          }
        } catch {
          // Wake lock not available or low battery
        }
      };

      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !sentinel) {
          acquireLock();
        }
      };

      acquireLock();
      document.addEventListener('visibilitychange', onVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        sentinel?.release();
        sentinel = null;
      };
    }),
  },

  // -- Named guards ---------------------------------------------------------
  guards: {
    canGoNext: ({ context }) => context.currentStep < context.totalSteps,
    canGoPrev: ({ context }) => context.currentStep > 0,
    isLastStep: ({ context }) => context.currentStep >= context.totalSteps - 1,
    isValidStep: ({ context, event }) => {
      const step = (event as { step: number }).step;
      return step >= 0 && step <= context.totalSteps;
    },
    servingsAboveMin: ({ context, event }) =>
      context.servings + (event as { delta: number }).delta >= 1,
    isViewCooking: ({ event }) => (event as { view: string }).view === 'cooking',
    isViewOverview: ({ event }) => (event as { view: string }).view === 'overview',
    hasTimerRunning: ({ context, event }) => {
      const opId = (event as { opId: string }).opId;
      return context.timerRefs.has(opId);
    },
  },

  // -- Named actions --------------------------------------------------------
  actions: {
    setMode: assign({
      mode: ({ event }) => (event as { type: 'SET_MODE'; mode: ScheduleMode }).mode,
    }),

    adjustServings: assign({
      servings: ({ context, event }) =>
        Math.max(1, context.servings + (event as { delta: number }).delta),
    }),

    nextStep: assign({
      currentStep: ({ context }) => Math.min(context.currentStep + 1, context.totalSteps),
    }),

    prevStep: assign({
      currentStep: ({ context }) => Math.max(context.currentStep - 1, 0),
    }),

    jumpToStep: assign({
      currentStep: ({ event }) => (event as { step: number }).step,
    }),

    spawnTimer: enqueueActions(({ context, event, enqueue }) => {
      const { opId, seconds } = event as { type: 'START_TIMER'; opId: string; seconds: number };

      // Stop existing timer for this operation if any
      const existing = context.timerRefs.get(opId);
      if (existing) {
        enqueue(stopChild(existing));
      }

      enqueue(spawnChild('timerActor', {
        id: `timer-${opId}`,
        input: { opId, seconds },
      }));

      enqueue(assign({
        timerRefs: ({ context: ctx, self }) => {
          const next = new Map(ctx.timerRefs);
          // The spawned actor is now available via the system
          const ref = self.system.get(`timer-${opId}`);
          if (ref) next.set(opId, ref);
          return next;
        },
        timerStates: ({ context: ctx }) => {
          const next = new Map(ctx.timerStates);
          next.set(opId, { remaining: seconds, total: seconds });
          return next;
        },
      }));
    }),

    cancelTimerActor: enqueueActions(({ context, event, enqueue }) => {
      const { opId } = event as { opId: string };
      const ref = context.timerRefs.get(opId);
      if (ref) {
        enqueue(stopChild(ref));
      }
      enqueue(assign({
        timerRefs: ({ context: ctx }) => {
          const next = new Map(ctx.timerRefs);
          next.delete(opId);
          return next;
        },
        timerStates: ({ context: ctx }) => {
          const next = new Map(ctx.timerStates);
          next.delete(opId);
          return next;
        },
      }));
    }),

    updateTimerState: assign({
      timerStates: ({ context, event }) => {
        const { opId, remaining } = event as { opId: string; remaining: number };
        const next = new Map(context.timerStates);
        const timer = next.get(opId);
        if (timer) {
          next.set(opId, { ...timer, remaining });
        }
        return next;
      },
    }),

    handleTimerDone: enqueueActions(({ context, event, enqueue }) => {
      const { opId } = event as { opId: string };
      const ref = context.timerRefs.get(opId);
      if (ref) {
        enqueue(stopChild(ref));
      }
      enqueue(assign({
        timerRefs: ({ context: ctx }) => {
          const next = new Map(ctx.timerRefs);
          next.delete(opId);
          return next;
        },
        timerStates: ({ context: ctx }) => {
          const next = new Map(ctx.timerStates);
          next.delete(opId);
          return next;
        },
      }));
    }),

    playAlarm: () => {
      playTimerAlarm();
    },
  },
}).createMachine({
  id: 'recipe',
  systemId: 'recipe',

  context: ({ input }) => ({
    recipe: input.recipe,
    scheduleModes: input.scheduleModes,
    mode: input.mode,
    servings: input.servings,
    originalServings: input.originalServings,
    totalSteps: input.totalSteps,
    currentStep: input.currentStep ?? 0,
    timerRefs: new Map(),
    timerStates: new Map(),
  }),

  type: 'parallel',

  states: {
    // =====================================================================
    // VIEW REGION — manages which view is active
    // =====================================================================
    view: {
      initial: 'overview',

      // Global events handled regardless of view state
      on: {
        SET_MODE: { actions: 'setMode' },
        ADJUST_SERVINGS: {
          guard: 'servingsAboveMin',
          actions: 'adjustServings',
        },
      },

      states: {
        // -----------------------------------------------------------------
        // OVERVIEW
        // -----------------------------------------------------------------
        overview: {
          initial: 'browsing',
          states: {
            browsing: {
              on: {
                SWITCH_VIEW: {
                  guard: 'isViewCooking',
                  target: '#recipe.view.cooking.hist',
                },
              },
            },
            modeTransition: {
              on: {
                ANIMATION_COMPLETE: { target: 'browsing' },
              },
              after: {
                300: { target: 'browsing' },
              },
            },
          },
          on: {
            SET_MODE: {
              actions: 'setMode',
              target: '.modeTransition',
            },
          },
        },

        // -----------------------------------------------------------------
        // COOKING — with deep history and sub-states
        // -----------------------------------------------------------------
        cooking: {
          initial: 'active',

          invoke: {
            src: 'wakeLockActor',
            id: 'wakeLock',
          },

          on: {
            SWITCH_VIEW: {
              guard: 'isViewOverview',
              target: 'overview',
            },
          },

          states: {
            hist: {
              type: 'history',
              history: 'deep',
              target: 'active',
            },

            active: {
              initial: 'navigating',
              states: {
                navigating: {
                  on: {
                    NEXT_STEP: [
                      {
                        guard: 'isLastStep',
                        actions: 'nextStep',
                        target: '#recipe.view.cooking.completed',
                      },
                      {
                        guard: 'canGoNext',
                        actions: 'nextStep',
                        target: 'stepTransition',
                      },
                    ],
                    PREV_STEP: {
                      guard: 'canGoPrev',
                      actions: 'prevStep',
                      target: 'stepTransition',
                    },
                    JUMP_TO_STEP: {
                      guard: 'isValidStep',
                      actions: 'jumpToStep',
                      target: 'stepTransition',
                    },
                  },
                },
                stepTransition: {
                  on: {
                    ANIMATION_COMPLETE: { target: 'navigating' },
                  },
                  after: {
                    300: { target: 'navigating' },
                  },
                },
              },
            },

            completed: {
              on: {
                PREV_STEP: {
                  actions: 'prevStep',
                  target: 'active.stepTransition',
                },
                JUMP_TO_STEP: {
                  guard: 'isValidStep',
                  actions: 'jumpToStep',
                  target: 'active.stepTransition',
                },
              },
            },
          },
        },
      },
    },

    // =====================================================================
    // TIMERS REGION — runs in parallel with view
    // =====================================================================
    timers: {
      initial: 'idle',

      on: {
        START_TIMER: {
          actions: 'spawnTimer',
          target: '.running',
        },
      },

      states: {
        idle: {},

        running: {
          always: {
            guard: ({ context }) => context.timerStates.size === 0,
            target: 'idle',
          },
          on: {
            'TIMER.TICK': {
              actions: 'updateTimerState',
            },
            'TIMER.DONE': {
              actions: ['handleTimerDone', 'playAlarm'],
            },
            CANCEL_TIMER: {
              actions: 'cancelTimerActor',
            },
          },
        },
      },
    },
  },

  // Persistence actor — invoked at root level, debounces state saves
  invoke: {
    src: 'persistenceActor',
    id: 'persistence',
  },
});
