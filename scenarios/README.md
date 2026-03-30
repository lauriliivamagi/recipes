# Scenarios

End-to-end user scenarios for behavioral validation. Inspired by [StrongDM's Software Factory](https://factory.strongdm.ai/) and BDD's specification stack — scenarios go beyond boolean tests to validate real user journeys.

## What Are Scenarios?

Scenarios describe how a user accomplishes a goal through the system. They are:

- **End-to-end**: Cover the full stack, not isolated units
- **Behavioral**: Describe observable outcomes, not implementation details
- **Natural language**: Written as user stories, not code assertions
- **Holdout-capable**: Some scenarios are withheld during development and used only for final validation (like a test/train split in ML)

## The Specification Stack

Scenarios sit within a three-layer specification stack. Each layer adds precision:

```
┌─────────────────────────────────────────┐
│  INTENT — User Stories                  │  "As a user, I want to..."
│  Why are we building this?              │  (placeholder for conversation)
├─────────────────────────────────────────┤
│  RULES — EARS Patterns                  │  "When X, the system shall Y"
│  What are the business constraints?     │  (unambiguous requirements)
├─────────────────────────────────────────┤
│  EXAMPLES — Gherkin Scenarios           │  "Given/When/Then"
│  How does this look concretely?         │  (executable specifications)
└─────────────────────────────────────────┘
```

You don't need all three layers for every feature. Use what adds clarity:

- Simple features: just examples
- Complex features: rules + examples
- Uncertain features: intent + discovery session + rules + examples

## Discovery

Before writing scenarios, run a **discovery session** to clarify what you're building. See [`ralph/discovery.md`](../ralph/discovery.md) for the full protocol — it produces PRD tasks, scenario files, and design decisions through interactive human-AI conversation.

Within discovery sessions, **Example Mapping** is the primary technique for surfacing behavior. Run one per feature (20-30 minutes) using four categories:

| Color | Card | Purpose |
|---|---|---|
| Yellow | **Story** | The user story being explored |
| Blue | **Rules** | Business rules discovered during discussion |
| Green | **Examples** | Concrete scenarios that illustrate each rule |
| Red | **Questions** | Unknowns, edge cases, "dragons" to investigate |

The output feeds directly into scenario files. Blue cards become EARS rules. Green cards become Gherkin scenarios. Red cards become TODOs or spike tasks in the PRD.

## Format

Each scenario file uses the full specification stack:

```markdown
# Feature: [Short Name]

## Story
As a [actor], I want to [goal], so that [benefit].

## Rules

Use EARS (Easy Approach to Requirements Syntax) patterns for unambiguous rules:

- **Ubiquitous** (always active): "The system shall [behavior]"
- **When** (event-driven): "When [trigger], the system shall [response]"
- **While** (state-driven): "While [condition], the system shall [behavior]"
- **If/Then** (unwanted behavior): "If [condition], then the system shall [response]"
- **Where** (optional feature): "Where [variant], the system shall [behavior]"

Example:
- When a user submits the registration form with valid data, the system shall create an account
- If the email is already registered, then the system shall display an error message
- While the user is unauthenticated, the system shall redirect protected routes to login

## Scenarios

### Scenario: [Happy path name]
- Given [precondition]
- When [actor action]
- Then [expected outcome]

### Scenario: [Edge case name]
- Given [precondition]
- When [actor action]
- Then [expected outcome]

### Scenario Outline: [Parameterized name]
- Given [precondition]
- When [actor enters <input>]
- Then [system shows <output>]

| input | output |
|---|---|
| valid@email.com | Success message |
| not-an-email | Validation error |
| (empty) | Required field error |

## Questions
- [Unresolved edge cases or unknowns — red cards from Example Mapping]

## Holdout: false
```

## EARS Quick Reference

| Pattern | Template | Example |
|---|---|---|
| Ubiquitous | The system shall [X] | The system shall log all API requests |
| When | When [trigger], the system shall [X] | When session expires, the system shall redirect to login |
| While | While [state], the system shall [X] | While uploading, the system shall show a progress bar |
| If/Then | If [condition], then the system shall [X] | If payment fails, then the system shall retry once |
| Where | Where [variant], the system shall [X] | Where admin role, the system shall show user management |

## Relationship to Tests

| Concept | Purpose | Location |
|---|---|---|
| **Unit tests** | Verify individual functions/components | `packages/*/tests/` |
| **E2E tests** | Automate browser/API interaction | `packages/frontend/tests/` |
| **Scenarios** | Define what "working" means for users | `scenarios/` |

Scenarios inform both unit and E2E tests. Rules become assertions. Gherkin steps map to E2E test steps. Scenario Outlines become parameterized test cases.

## Validation

During Ralph iterations, scenarios are validated by:

1. Reading each scenario's **rules** — are they all implemented?
2. Walking through each **Gherkin scenario** — does the implementation support every step?
3. Running related E2E tests if they exist
4. Flagging **questions** that remain unresolved
5. Updating satisfaction count (scenarios passing / total referenced)

## Holdout Scenarios

Mark scenarios with `## Holdout: true` to exclude them from the development feedback loop. These are used only for final validation, preventing the implementation from being over-fitted to known scenarios.

## Organization

```
scenarios/
├── README.md           # This file
├── auth/               # Authentication scenarios
├── onboarding/         # First-time user flows
└── core/               # Core feature workflows
```

Group by domain, not by technical layer. One file per feature.
