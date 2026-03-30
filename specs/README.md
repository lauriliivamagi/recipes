# Specs

Stable domain knowledge not discoverable from code.

Put documentation here when:

- It describes algorithms, business rules, or domain concepts
- It captures architecture decisions that aren't obvious from the code
- It provides context that would be lost without explicit documentation

Do NOT put here:

- API documentation (use OpenAPI/Zod schemas)
- Code comments (put those in the code)
- Temporary notes (use state/ directory)

## Task Specs (Ralph AFK)

Implementation specs for complex PRD tasks. Each is self-contained for autonomous execution. Create a spec when a task involves new entities + new endpoints + new UI and the PRD acceptance criteria alone aren't sufficient.

## Algorithm Specs

Self-contained algorithm descriptions for novel computations not obvious from existing code. Store in `specs/algorithms/`.

Write an algorithm spec when:

- The algorithm has domain-specific logic (not a standard library call)
- The implementation involves non-obvious mathematical formulas
- Multiple tasks depend on the same algorithm

## Shared File Conflict Strategy (Team Mode)

When running Ralph in team mode, multiple teammates may modify the same files. Document append-only and coordinate-on files here to prevent merge conflicts.

| File | Strategy |
|------|----------|
| `packages/shared/types/src/*.ts` | Append new types at bottom |
| `packages/backend/src/app.ts` | Coordinate — routes registered here |
| `packages/backend/src/db/mikro-orm.config.ts` | Append entities to array |

Update this table during discovery sessions when identifying parallel work.

## Engineering Patterns

[`specs/patterns.md`](patterns.md) is an index of software engineering patterns (Gang of Four style) that inform implementation decisions. It covers universal patterns, DDD patterns, requirements definition, and domain-specific patterns. Full pattern details are stored in the Cognee knowledge graph — use `/cognee search for: [pattern name] pattern` to retrieve them.

## Integrations

Document third-party API behaviors in `specs/integrations/`. This enables future [Digital Twin](https://factory.strongdm.ai/techniques)-style testing — behavioral clones of external services for high-volume validation.

For each integration, capture:

```markdown
# Integration: [Service Name]

## API Surface
- Endpoints used and their behavior
- Authentication method
- Rate limits and quotas

## Edge Cases
- Known error responses and status codes
- Timeout behavior
- Pagination quirks

## Behavioral Contracts
- What the service guarantees (e.g., eventual consistency, ordering)
- What it does NOT guarantee
- Observed vs documented behavior differences
```

These specs make it possible to build mock services that replicate real API behavior for testing without hitting production limits.
