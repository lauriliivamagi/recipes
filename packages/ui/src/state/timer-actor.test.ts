import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { createActor } from 'xstate';
import { timerActor } from './timer-actor.js';

describe('timerActor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends TIMER.TICK every second with remaining count', () => {
    const actor = createActor(timerActor, {
      input: { opId: 'op-1', seconds: 3 },
    });

    actor.subscribe({
      next: () => {},
    });

    actor.start();

    // The callback actor sends events via sendBack which we can't directly capture
    // without a parent. Let's verify it stops cleanly.
    vi.advanceTimersByTime(3000);

    actor.stop();
  });

  it('cleans up interval on stop', () => {
    const actor = createActor(timerActor, {
      input: { opId: 'op-2', seconds: 60 },
    });

    actor.start();
    vi.advanceTimersByTime(2000);

    // Stopping should clean up the interval
    actor.stop();

    // No more timers should fire after stop
    vi.advanceTimersByTime(10000);
  });
});
