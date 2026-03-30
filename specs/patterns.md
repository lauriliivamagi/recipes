# Software Engineering Patterns

A collection of patterns extracted from safety-critical C development, documented in Gang of Four style. This is an index — full pattern details (intent, motivation, structure, sample code) are available via the Cognee knowledge graph:

```
/cognee search for: [pattern name] pattern
```

## Universal Patterns

| Pattern | Core Question It Answers |
| --- | --- |
| Contract-First API Design | What does this function promise? |
| Baseline Verification | What was broken before I started? |
| Intentional Comments | Why does this non-obvious thing exist? |
| Separate Config from State | What can change here, and what can't? |
| Invariant-Protected State Machine | What must always be true about this state? |
| Statecharts | How do I manage complex hierarchical state? |
| Actor Model | How do I organize concurrent systems without shared state? |
| Atomic Step (Reentrancy Guard) | How do I prevent concurrent mutation? |
| Sticky Fault | How do I ensure faults are never silently ignored? |
| Total Functions | What happens with pathological input? |
| Minimal Sufficient State | What's the least I need to remember? |
| Proof-Harness Testing | How do I test correctness, not just coverage? |
| Hypothesis-Driven Debugging | How do I debug systematically? |
| Three-State Logic | How do I represent "I don't know"? |
| Methodology Spectrum | How much rigor does this problem need? |
| Branded Types | How do I prevent mixing semantically different values? |
| Fail-Fast Initialization | How do I catch config errors at startup? |
| Circuit Breaker | How do I prevent cascading failures? |
| Exponential Backoff | How do I retry without overwhelming systems? |
| Idempotent Operations | How do I make retries safe? |
| Capability Token | How do I encode permissions in types? |
| Finite Resource Pool | How do I manage bounded resources safely? |
| Command-Query Separation | Should this function change state or return information? |
| Dead Man's Switch | What happens if the controller dies mid-operation? |
| Error Context Chain | How do I preserve debugging context as errors propagate? |
| Graceful Degradation | How do I continue operating with reduced functionality? |
| Poison Pill | How do I signal clean shutdown to worker threads? |
| Bulkhead | How do I isolate failures to prevent cascade? |
| Bulkhead (Architectural) | How do I isolate failures at infrastructure level? |
| Feature Flags | How do I control execution paths at runtime? |
| Throttle | How do I limit rate to prevent overload? |
| Idempotent Receiver | How do I guarantee exactly-once processing? |
| Sequence Verifier | How do I verify events occur in prescribed order? |
| Double-Entry Budget | How do I ensure value conservation with provable correctness? |

## Domain-Driven Design Patterns

Patterns for managing complexity in business domains, based on CodeOpinion's pragmatic take on DDD.

| Pattern | Core Question It Answers |
| --- | --- |
| Aggregate Design | How do I enforce invariants across related objects? |
| Rich Domain Model | How do I encapsulate data with behavior? |
| Value Objects | How do I make domain concepts explicit and always valid? |
| Transaction Script | When is a domain model overkill? |
| Bounded Context | How do I handle the same term meaning different things? |
| Event Sourcing | How do I know how I got to the current state? |
| Vertical Slice Architecture | How do I organize code by features instead of layers? |

## Requirements Definition Patterns

Patterns for expressing requirements and specifications clearly and testably.

| Pattern | Core Question It Answers |
| --- | --- |
| EARS Requirements Syntax | How do I write unambiguous, testable requirements? |
| Gherkin Specification | How do I specify behavior as executable examples? |
| Mermaid Requirement Diagram | How do I visualize requirement traceability? |
| Mermaid ER Diagram | How do I document domain entities and relationships? |
| Mermaid Sequence Diagram | How do I visualize component interactions over time? |
| Mermaid Block Diagram | How do I visualize system architecture and components? |
| Mermaid Sankey Diagram | How do I visualize flow magnitudes between components? |
| Mermaid State Diagram | How do I model entity lifecycles and transitions? |
| Mermaid Class Diagram | How do I model object-oriented type structures? |

## Domain-Specific Patterns

| Pattern | Domain | Core Question |
| --- | --- | --- |
| Tick-Based Scheduling | Real-time/embedded | How do I make execution reproducible? |
| Deterministic Replay | Safety-critical | How do I replay exact execution? |
| Variance Floor | Numerical computing | How do I avoid division by near-zero? |
| Modular Time Arithmetic | Distributed systems | How do I handle clock wraparound? |
| Monotonic Sequence Guard | Security/distributed | How do I prevent replay attacks? |
| Watchdog Timer | Real-time/embedded | How do I detect and recover from hung components? |
| Heartbeat/Liveness | Distributed systems | How do I know a remote component is still alive? |
| Write-Ahead Log | Databases/persistence | How do I survive crashes during state changes? |
| Outbox Pattern | Distributed systems | How do I atomically save state and publish events? |
| Web-Queue-Worker | Distributed systems | How do I separate sync requests from async work? |

## Pattern Format

Each pattern follows Gang of Four structure:

- **Intent**: What the pattern does
- **Motivation**: Scenario illustrating the problem
- **Applicability**: When to use it
- **Structure**: Visual representation
- **Participants**: Key components
- **Consequences**: Benefits and liabilities
- **Implementation**: How to build it
- **Sample Code**: Working examples
- **Known Uses**: Real-world applications
- **Related Patterns**: Connections to other patterns
