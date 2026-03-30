import { setup, assign, fromPromise } from "xstate";

/**
 * Exemplar: XState v5 machine with multiple states, actors, guards, and input.
 *
 * Patterns demonstrated:
 * - setup() API with typed context, events, and input
 * - fromPromise actor for async data fetching (invoke)
 * - Guards for conditional transitions
 * - Named actions via assign()
 * - Error state with recovery (RETRY)
 * - Input with defaults for configurable machines
 *
 * XState manages all workflow state in this architecture.
 * useState should ONLY be used for transient UI state (dialog open/close, hover).
 */
export const exampleMachine = setup({
  types: {
    context: {} as {
      items: string[];
      currentIndex: number;
      processedCount: number;
      error: string | null;
      source: string;
    },
    events: {} as
      | { type: "LOAD" }
      | { type: "PROCESS" }
      | { type: "SKIP" }
      | { type: "RETRY" }
      | { type: "RESET" },
    input: {} as { source?: string },
  },
  actors: {
    fetchItems: fromPromise(async ({ input }: { input: { source: string } }) => {
      const res = await fetch(`/api/${input.source}`);
      if (!res.ok) throw new Error("Fetch failed");
      return (await res.json()).data as string[];
    }),
  },
  guards: {
    hasMoreItems: ({ context }) => context.currentIndex < context.items.length - 1,
  },
  actions: {
    markProcessed: assign({
      processedCount: ({ context }) => context.processedCount + 1,
    }),
    advance: assign({
      currentIndex: ({ context }) => context.currentIndex + 1,
    }),
    storeError: assign({
      error: ({ event }) =>
        "error" in event && event.error instanceof Error
          ? event.error.message
          : "Unknown error",
    }),
    clearError: assign({ error: null }),
    resetContext: assign({
      items: [],
      currentIndex: 0,
      processedCount: 0,
      error: null,
    }),
  },
}).createMachine({
  id: "example",
  initial: "idle",
  context: ({ input }) => ({
    items: [],
    currentIndex: 0,
    processedCount: 0,
    error: null,
    source: input?.source ?? "widgets",
  }),
  states: {
    idle: {
      on: {
        LOAD: "loading",
      },
    },
    loading: {
      invoke: {
        src: "fetchItems",
        input: ({ context }) => ({ source: context.source }),
        onDone: {
          target: "reviewing",
          actions: assign({ items: ({ event }) => event.output }),
        },
        onError: {
          target: "error",
          actions: "storeError",
        },
      },
    },
    reviewing: {
      on: {
        PROCESS: [
          {
            guard: "hasMoreItems",
            target: "reviewing",
            actions: ["markProcessed", "advance"],
          },
          { target: "done", actions: "markProcessed" },
        ],
        SKIP: [
          { guard: "hasMoreItems", target: "reviewing", actions: "advance" },
          { target: "done" },
        ],
      },
    },
    done: { type: "final" },
    error: {
      on: {
        RETRY: {
          target: "loading",
          actions: "clearError",
        },
      },
    },
  },
  on: {
    RESET: {
      target: ".idle",
      actions: "resetContext",
    },
  },
});
