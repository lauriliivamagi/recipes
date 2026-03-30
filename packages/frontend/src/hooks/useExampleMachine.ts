import { useMachine } from "@xstate/react";
import { exampleMachine } from "@/machines/example.machine";

/**
 * Exemplar: machine accessor hook pattern.
 *
 * Wraps useMachine to provide a clean API for components.
 * Components call hook methods instead of sending raw events.
 */
export function useExampleMachine() {
  const [state, send] = useMachine(exampleMachine, {
    input: {},
  });

  return {
    state,
    load: () => send({ type: "LOAD" }),
    process: () => send({ type: "PROCESS" }),
    skip: () => send({ type: "SKIP" }),
    retry: () => send({ type: "RETRY" }),
    reset: () => send({ type: "RESET" }),
  };
}
