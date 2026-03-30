# XState v5 State Machines

All workflow state is managed by XState v5 state machines.

## Rules

- **XState manages**: Workflow state, navigation, form data, API request state
- **useState ONLY for**: Dialog open/close, transient input, UI-only effects (hover, expand)
- **NEVER use useState for workflow state**

## Pattern

```typescript
// Define machine with setup() API
export const myMachine = setup({
  types: {
    context: {} as {
      /* typed context */
    },
    events: {} as { type: "EVENT_NAME" } | { type: "OTHER" },
  },
  actions: {
    /* named actions */
  },
  guards: {
    /* named guards */
  },
}).createMachine({
  id: "my-machine",
  initial: "idle",
  context: {
    /* initial context */
  },
  states: {
    /* state definitions */
  },
});
```

## Testing

Use `createActor` for unit testing:

```typescript
import { createActor } from "xstate";
import { myMachine } from "./my.machine";

const actor = createActor(myMachine);
actor.start();
actor.send({ type: "EVENT_NAME" });
expect(actor.getSnapshot().context.value).toBe(expected);
actor.stop();
```
