import { describe, it, expect, afterEach } from "vitest";
import { createActor, waitFor as xstateWaitFor, fromPromise } from "xstate";
import { exampleMachine } from "./example.machine";

/**
 * Exemplar: testing XState machines with actors, guards, and multiple states.
 *
 * Patterns demonstrated:
 * 1. waitFor() from xstate for async state transitions (not hand-rolled Promises)
 * 2. .matches() for state assertions (supports nested/compound states)
 * 3. machine.provide() to mock actors in tests
 * 4. Organized describe blocks per feature area
 * 5. Testing guards, error states, and recovery transitions
 */

describe("exampleMachine", () => {
  let actor: ReturnType<typeof createActor<typeof exampleMachine>>;

  afterEach(() => {
    actor?.stop();
  });

  /**
   * ====================================
   * Initial State
   * ====================================
   */
  describe("Initial State", () => {
    it("should start in idle state", () => {
      actor = createActor(exampleMachine, { input: {} });
      actor.start();

      expect(actor.getSnapshot().matches("idle")).toBe(true);
    });

    it("should initialize with default context", () => {
      actor = createActor(exampleMachine, { input: {} });
      actor.start();

      const context = actor.getSnapshot().context;
      expect(context.items).toEqual([]);
      expect(context.currentIndex).toBe(0);
      expect(context.processedCount).toBe(0);
      expect(context.error).toBeNull();
      expect(context.source).toBe("widgets");
    });

    it("should accept custom input", () => {
      actor = createActor(exampleMachine, { input: { source: "gadgets" } });
      actor.start();

      expect(actor.getSnapshot().context.source).toBe("gadgets");
    });
  });

  /**
   * ====================================
   * Actor Success (loading → reviewing)
   * ====================================
   */
  describe("Actor Success", () => {
    it("should transition loading → reviewing on successful fetch", async () => {
      const mockItems = ["item-a", "item-b", "item-c"];

      actor = createActor(
        exampleMachine.provide({
          actors: {
            fetchItems: fromPromise(async () => mockItems),
          },
        }),
        { input: {} },
      );
      actor.start();
      actor.send({ type: "LOAD" });

      await xstateWaitFor(actor, (s) => s.matches("reviewing"));

      const snap = actor.getSnapshot();
      expect(snap.matches("reviewing")).toBe(true);
      expect(snap.context.items).toEqual(mockItems);
      expect(snap.context.currentIndex).toBe(0);
    });
  });

  /**
   * ====================================
   * Actor Failure (loading → error)
   * ====================================
   */
  describe("Actor Failure", () => {
    it("should transition loading → error on failed fetch", async () => {
      actor = createActor(
        exampleMachine.provide({
          actors: {
            fetchItems: fromPromise<string[], { source: string }>(async () => {
              throw new Error("Network error");
            }),
          },
        }),
        { input: {} },
      );
      actor.start();
      actor.send({ type: "LOAD" });

      await xstateWaitFor(actor, (s) => s.matches("error"));

      expect(actor.getSnapshot().matches("error")).toBe(true);
      expect(actor.getSnapshot().context.error).toBe("Network error");
    });
  });

  /**
   * ====================================
   * Error Recovery (error → loading via RETRY)
   * ====================================
   */
  describe("Error Recovery", () => {
    it("should retry from error state", async () => {
      let callCount = 0;

      actor = createActor(
        exampleMachine.provide({
          actors: {
            fetchItems: fromPromise<string[], { source: string }>(async () => {
              callCount++;
              if (callCount === 1) throw new Error("Transient failure");
              return ["recovered-item"];
            }),
          },
        }),
        { input: {} },
      );
      actor.start();
      actor.send({ type: "LOAD" });

      // First attempt fails
      await xstateWaitFor(actor, (s) => s.matches("error"));
      expect(actor.getSnapshot().context.error).toBe("Transient failure");

      // Retry succeeds
      actor.send({ type: "RETRY" });
      await xstateWaitFor(actor, (s) => s.matches("reviewing"));

      expect(actor.getSnapshot().matches("reviewing")).toBe(true);
      expect(actor.getSnapshot().context.error).toBeNull();
      expect(actor.getSnapshot().context.items).toEqual(["recovered-item"]);
    });
  });

  /**
   * ====================================
   * Guard Transitions (PROCESS with hasMoreItems)
   * ====================================
   */
  describe("Guard Transitions", () => {
    it("should advance through items when guard allows", async () => {
      actor = createActor(
        exampleMachine.provide({
          actors: {
            fetchItems: fromPromise(async () => ["a", "b", "c"]),
          },
        }),
        { input: {} },
      );
      actor.start();
      actor.send({ type: "LOAD" });

      await xstateWaitFor(actor, (s) => s.matches("reviewing"));

      // Process first item — guard allows advance (2 more items)
      actor.send({ type: "PROCESS" });
      expect(actor.getSnapshot().matches("reviewing")).toBe(true);
      expect(actor.getSnapshot().context.currentIndex).toBe(1);
      expect(actor.getSnapshot().context.processedCount).toBe(1);

      // Process second item — guard allows advance (1 more item)
      actor.send({ type: "PROCESS" });
      expect(actor.getSnapshot().matches("reviewing")).toBe(true);
      expect(actor.getSnapshot().context.currentIndex).toBe(2);

      // Process third (last) item — guard fails, transitions to done
      actor.send({ type: "PROCESS" });
      expect(actor.getSnapshot().matches("done")).toBe(true);
      expect(actor.getSnapshot().context.processedCount).toBe(3);
    });
  });

  /**
   * ====================================
   * Skip Behavior (SKIP without side effects)
   * ====================================
   */
  describe("Skip Behavior", () => {
    it("should skip items without incrementing processedCount", async () => {
      actor = createActor(
        exampleMachine.provide({
          actors: {
            fetchItems: fromPromise(async () => ["a", "b"]),
          },
        }),
        { input: {} },
      );
      actor.start();
      actor.send({ type: "LOAD" });

      await xstateWaitFor(actor, (s) => s.matches("reviewing"));

      actor.send({ type: "SKIP" }); // skip first
      expect(actor.getSnapshot().context.processedCount).toBe(0);
      expect(actor.getSnapshot().context.currentIndex).toBe(1);

      actor.send({ type: "PROCESS" }); // process last → done
      expect(actor.getSnapshot().matches("done")).toBe(true);
      expect(actor.getSnapshot().context.processedCount).toBe(1);
    });
  });

  /**
   * ====================================
   * Final State Detection
   * ====================================
   */
  describe("Final State", () => {
    it("should reach final state with status done", async () => {
      actor = createActor(
        exampleMachine.provide({
          actors: {
            fetchItems: fromPromise(async () => ["only-one"]),
          },
        }),
        { input: {} },
      );
      actor.start();
      actor.send({ type: "LOAD" });

      await xstateWaitFor(actor, (s) => s.matches("reviewing"));

      actor.send({ type: "PROCESS" });
      const snap = actor.getSnapshot();
      expect(snap.matches("done")).toBe(true);
      expect(snap.status).toBe("done");
    });
  });

  /**
   * ====================================
   * Global Reset
   * ====================================
   */
  describe("Reset", () => {
    it("should reset to idle from any state", async () => {
      actor = createActor(
        exampleMachine.provide({
          actors: {
            fetchItems: fromPromise(async () => ["a", "b"]),
          },
        }),
        { input: {} },
      );
      actor.start();
      actor.send({ type: "LOAD" });

      await xstateWaitFor(actor, (s) => s.matches("reviewing"));

      actor.send({ type: "PROCESS" });
      expect(actor.getSnapshot().context.processedCount).toBe(1);

      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().matches("idle")).toBe(true);
      expect(actor.getSnapshot().context.items).toEqual([]);
      expect(actor.getSnapshot().context.processedCount).toBe(0);
      expect(actor.getSnapshot().context.error).toBeNull();
    });
  });
});
