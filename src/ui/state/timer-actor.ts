import { fromCallback } from 'xstate';

export interface TimerInput {
  opId: string;
  seconds: number;
}

export type TimerEvent =
  | { type: 'TIMER.TICK'; opId: string; remaining: number }
  | { type: 'TIMER.DONE'; opId: string };

/**
 * Callback actor that counts down from `seconds` to 0, sending TIMER.TICK
 * every second and TIMER.DONE when complete. Cleans up its interval on stop.
 */
export const timerActor = fromCallback<{ type: string }, TimerInput>(
  ({ sendBack, input }) => {
    let remaining = input.seconds;

    const interval = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearInterval(interval);
        sendBack({ type: 'TIMER.DONE', opId: input.opId });
      } else {
        sendBack({ type: 'TIMER.TICK', opId: input.opId, remaining });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  },
);
