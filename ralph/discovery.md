# Discovery Session Protocol

A conversation-first framework for interactive human-AI sessions that produce the inputs Ralph needs: PRD.md, scenarios/, specs/, and design decisions.

## The Two Amigos Model

Discovery sessions are a structured conversation between two roles:

- **Human** = Domain Expert — knows the "what" and "why", has the business context, makes the decisions
- **AI** = Tester + Developer — probes edge cases, suggests architecture, writes specs, drafts artifacts

The AI's job is to ask the questions a tester and developer would ask: "What happens when this fails?", "What does the data look like?", "How do these pieces connect?" — and to turn the conversation into documents in real-time.

## How It Works

There are no rigid phases. The human starts wherever they want — a problem description, a data model, a user story, a worry — and the AI adapts:

| Human starts with... | AI responds by... |
| --- | --- |
| "I want to build X" | Probing outcomes, then structure |
| "Here's my data model" | Probing behavior for each entity |
| "Users need to do Y" | Running Example Mapping for Y |
| "I'm worried about Z" | Capturing risk, asking for constraints |
| "Just make it simple" | Proposing minimal PRD, asking to validate |

The AI tracks five dimensions internally to know what's been covered and what gaps remain.

## The Discovery Board

The AI maintains a mental model of discovery progress across five dimensions:

| Dimension | Key Question | What It Captures |
| --- | --- | --- |
| **Outcomes** | Why are we building this? | Problem statement, success criteria, actors |
| **Structure** | What are the moving parts? | Components, boundaries, integrations, tech choices |
| **Behavior** | What does "working" look like? | User journeys, business rules, examples |
| **Risks** | What could go wrong? | Unknowns, edge cases, assumptions, dependencies |
| **Readiness** | Can Ralph take over? | Are artifacts complete enough to start building? |

Periodically during the conversation, the AI offers a **progress checkpoint**: a brief summary of what's been discovered and what gaps remain. The human can steer toward gaps or say "good enough."

## Question Patterns

The AI uses different question styles depending on which dimension has gaps:

### Outcomes (the "why")

- "What's the one thing a user should be able to do that they can't today?"
- "Who are the actors in this system? What are their goals?"
- "How will you know this is working? What does success look like?"
- "What prompted this — is there a specific problem or opportunity?"

### Structure (the "what")

- "What are the nouns in this system? What are the main entities?"
- "What talks to what? Where are the boundaries?"
- "What already exists that we can build on? What's greenfield?"
- "What external systems or APIs do we integrate with?"

### Behavior (the "how it works")

- "Walk me through the happy path, step by step."
- "What happens when [X fails / user does Y / data is Z]?"
- "Are there different rules for different user types?"
- "What's the most complicated scenario you can think of?"

### Risks (the "what could go wrong")

- "What are you most worried about?"
- "What don't you know yet?"
- "What assumptions are we making that might be wrong?"
- "What would make us throw this away and start over?"

### Data (a cross-cutting concern)

- "What does the data look like? Give me a concrete example."
- "What are the validation rules? What's valid vs. invalid?"
- "How much data are we talking about? What's the scale?"
- "Where does the data come from? Who owns it?"

## Example Mapping (Inline)

When exploring behavior for a specific feature, the AI applies Example Mapping within the conversation. This surfaces four categories:

| Card Color | Category | What It Becomes |
| --- | --- | --- |
| Yellow | **Story** | The user story (intent) in the scenario file |
| Blue | **Rules** | EARS requirements in the scenario file |
| Green | **Examples** | Gherkin scenarios in the scenario file |
| Red | **Questions** | Unknowns — become spike tasks or scenario questions |

The AI doesn't need to formally announce "we're doing Example Mapping now." It just naturally asks: "So the rule is [X] — can you give me a concrete example?" and "What happens when that rule is violated?"

## Artifact Generation

As the conversation progresses and clarity emerges, the AI drafts Ralph-compatible artifacts:

| Artifact | When to Draft | Format Reference |
| --- | --- | --- |
| PRD.md context | Once outcomes + stack are clear | See `PRD.md` template |
| PRD.md tasks | As features solidify | Tasks with acceptance criteria, scenario refs, exemplars |
| scenarios/*.md | When behavior examples accumulate | See `scenarios/README.md` — Intent + EARS + Gherkin |
| specs/*.md | When domain knowledge surfaces | Stable facts about the domain |
| state/decisions.md | When architectural choices are made | Decision entries (context, decision, rationale) |

The AI proposes drafts during conversation. The human reviews and adjusts. Final versions are written when the human is satisfied.

## Readiness Criteria

The session is "done" when these conditions are met — or the human decides they have enough to start:

- [ ] PRD context paragraph articulates the problem and the "why"
- [ ] At least one tracer-bullet task is fully specified (description + acceptance criteria + scenario ref)
- [ ] Each task has acceptance criteria that are specific and verifiable
- [ ] Tasks reference scenarios in `scenarios/` (scenarios exist or will be written)
- [ ] Architectural decisions affecting multiple tasks are recorded
- [ ] Known unknowns are captured as questions (in scenarios) or spike tasks (in PRD)

Not everything needs to be perfect. Ralph's double-loop check will discover gaps during execution. The goal is "enough clarity to start building confidently."

## Methodology Spectrum

The AI adapts discovery depth based on contextual signals — it doesn't ask "how rigorous should we be?" but reads the situation:

| Signal | Discovery Depth |
| --- | --- |
| Simple CRUD, well-understood domain | Lightweight — quick PRD, basic scenarios |
| Complex business rules, multiple actors | Standard — Example Mapping per feature, EARS rules |
| High uncertainty, lots of unknowns | Deep — surface assumptions, spike tasks, holdout scenarios |
| Safety, correctness, compliance concerns | Thorough — full specification stack, edge case coverage |

## Tips for Humans

Get the most out of discovery sessions:

- **Bring examples.** Concrete examples ("like when a user does X and sees Y") are worth more than abstract descriptions.
- **Name what you don't know.** Saying "I'm not sure about X" is more valuable than glossing over uncertainty.
- **Think about edge cases.** The AI will ask about them, but you'll get there faster if you've already considered them.
- **It's OK to say "good enough."** Not everything needs full specification upfront. Ralph will discover gaps during execution.
- **Bring domain knowledge.** Integration specs, API docs, business rules, regulatory requirements — anything that constrains the solution space.

## Relationship to Ralph

Discovery sessions produce the inputs that Ralph consumes:

```
Discovery Session (interactive, human + AI)
    ↓
    PRD.md + scenarios/ + specs/ + decisions.md
    ↓
Ralph Loop (autonomous, AI only)
    ↓
    Working Code + Git History + Updated State
```

The discovery session is the "thinking before doing" phase. Ralph is the "doing" phase. The clearer the thinking, the more effective the doing — but don't let discovery become analysis paralysis. Start building when you have enough clarity for the first few tasks.
