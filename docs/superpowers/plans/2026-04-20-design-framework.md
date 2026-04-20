# Design framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Hob design framework: directory skeleton, brief template, five kernel files drafted, and one pilot surface (Suggestion engine) briefed end-to-end.

**Architecture:** Documentation-only work. All artifacts live under `docs/design/`. Source-of-truth content is extracted from existing strategy/scenarios/journey-maps documents — the kernel files compress and re-frame that material as design directives. The pilot brief demonstrates how to compose kernel + persona excerpt + journey moment + scenarios into one Claude Design starting prompt.

**Tech Stack:** Markdown only. No code, no tests in the conventional sense. Validation = file presence checks, internal link resolution, length caps, and human review at task boundaries.

**Source documents the engineer must read before starting:**

- `docs/superpowers/specs/2026-04-20-design-framework-design.md` (this plan's spec)
- `docs/strategy/jtbd.md`
- `docs/strategy/personas.md`
- `docs/strategy/journey-maps.md` (especially Journey 6, the bottom "Design Principles Extracted" table)
- `docs/strategy/information-architecture.md`
- `docs/strategy/service-blueprint.md`
- `docs/scenarios/README.md`
- `docs/scenarios/decide/` (all three files — these source the pilot brief)
- `docs/wireframes/analog-timer.html` and `docs/wireframes/analog-timer.machine.js` (reference for micro-interaction documentation)

**Conventions for this plan:**

- Each kernel file has a hard length cap. Exceeding it is a defect — kernel files are read every Claude Design session.
- All cross-references use markdown links with relative paths from the file being written.
- "Verify" steps are explicit: a command or a manual check the engineer must perform before checking the box.
- Commit at the end of each task. Commit messages follow the existing repo style (lowercase verb, no scope prefix needed; see `git log --oneline -10`).

---

## File structure

The plan produces this tree under `docs/design/`:

```text
docs/design/
├── README.md                                  # Task 2
├── _kernel/                                   # Tasks 4-8
│   ├── brand-voice.md
│   ├── design-principles.md
│   ├── micro-interactions.md
│   ├── design-intent.md
│   └── codebase-pointers.md
├── _template/
│   └── brief.md                               # Task 3
└── suggestion-engine/                         # Task 10 (pilot)
    ├── brief.md
    └── inputs/
        ├── persona-excerpt.md
        ├── journey-moment.md
        └── scenarios.md
```

Empty placeholder folders for the remaining Phase 1 surfaces (`multi-recipe/`, `partner-track/`, `import-flow/`, `energy-tier/`) are created in Task 9 with a single `.gitkeep` each so the structure is discoverable.

---

## Task 1: Scaffold directory structure

**Files:**

- Create: `docs/design/` and subdirectories listed above.

- [ ] **Step 1: Create the directory tree**

```bash
mkdir -p docs/design/_kernel \
         docs/design/_template \
         docs/design/suggestion-engine/inputs \
         docs/design/suggestion-engine/outputs/screenshots \
         docs/design/suggestion-engine/outputs/handoff \
         docs/design/multi-recipe \
         docs/design/partner-track \
         docs/design/import-flow \
         docs/design/energy-tier
```

- [ ] **Step 2: Add `.gitkeep` to placeholder folders**

```bash
touch docs/design/multi-recipe/.gitkeep \
      docs/design/partner-track/.gitkeep \
      docs/design/import-flow/.gitkeep \
      docs/design/energy-tier/.gitkeep \
      docs/design/suggestion-engine/outputs/screenshots/.gitkeep \
      docs/design/suggestion-engine/outputs/handoff/.gitkeep
```

- [ ] **Step 3: Verify structure**

Run: `find docs/design -type d | sort`
Expected: 11 lines listing every directory created above.

- [ ] **Step 4: Commit**

```bash
git add docs/design
git commit -m "Scaffold docs/design/ skeleton for design framework"
```

---

## Task 2: Write `docs/design/README.md`

**Files:**

- Create: `docs/design/README.md`

**Purpose:** A short orientation page (under 120 lines) that answers four questions: what is this folder, who is it for, what's the workflow, where do I look next. Links to the spec for the full rationale — does not duplicate it.

- [ ] **Step 1: Write the README**

````markdown
# Design

This folder holds Hob's per-surface design work. It exists because the [strategy](../strategy/) and [scenarios](../scenarios/) layers are mature, but design has been fragmented across loose wireframes. This is the bridge layer.

## Who is this for

Primary executor: AI sessions (Claude Code + Claude Design), with human review at defined gates. See the [framework spec](../superpowers/specs/2026-04-20-design-framework-design.md) for the full rationale, persona alignment, and risk analysis.

## Folder layout

```text
_kernel/      # Source material for Claude Design's organization-level design system
_template/    # Templates new surfaces are scaffolded from
<surface>/    # One folder per IA surface (see Sequencing below)
```

Each surface folder contains:

- `brief.md` — the Claude Design starting prompt
- `inputs/` — files attached to the Claude Design project (persona excerpt, journey moment, curated scenarios, optional wireframe reference)
- `outputs/` — what comes back: share link, screenshots, handoff bundle, chat excerpts
- `decisions.md` — what was kept, discarded, why; kernel feedback

## Workflow (per surface)

1. AI authors `<surface>/brief.md` from kernel + scenarios + journey. Curates `inputs/`.
2. Human reviews the brief. Approved or revised.
3. AI opens a Claude Design project, pastes the brief, attaches inputs, iterates.
4. AI exports the result back to `<surface>/outputs/` and writes `decisions.md`.
5. Human reviews the design.
6. Implementation pass (separate plan): handoff bundle integrated into `/site/`.

The kernel evolves: each `decisions.md` may flag changes to `_kernel/` files. Apply those before starting the next surface.

## Sequencing

**Phase 0 — Kernel.** Five kernel files drafted; fed into Claude Design organization onboarding.

**Phase 1 — Missing surfaces (no wireframe today).** In JTBD priority order:

1. Suggestion engine (pilot)
2. Multi-recipe `/cook.html`
3. Partner track `/partner.html`
4. Import flow
5. Energy-tier UI

**Phase 2 — Existing surfaces refresh.** Pool planner first (owns Wednesday Gap), then catalog hub, recipe overview, cooking view, web checklist, grocery list.

**Phase 3 — Validation.** Walk all 10 [journey maps](../strategy/journey-maps.md) through the resulting designs; document breaks.

## Reference

- [Framework spec](../superpowers/specs/2026-04-20-design-framework-design.md) — full rationale, scope, risks
- [Brief template](_template/brief.md) — what every surface brief contains
- [Information architecture](../strategy/information-architecture.md) — surface inventory and URL map
- [Personas](../strategy/personas.md), [JTBD](../strategy/jtbd.md), [Journey maps](../strategy/journey-maps.md) — strategic source material the kernel and briefs draw from
````

Write the above content to `docs/design/README.md`.

- [ ] **Step 2: Verify links resolve**

Run from repo root:

```bash
for link in \
  docs/strategy \
  docs/scenarios \
  docs/superpowers/specs/2026-04-20-design-framework-design.md \
  docs/strategy/journey-maps.md \
  docs/design/_template/brief.md \
  docs/strategy/information-architecture.md \
  docs/strategy/personas.md \
  docs/strategy/jtbd.md; do
  test -e "$link" && echo "OK: $link" || echo "MISSING: $link"
done
```

Expected: every line says `OK`. The `docs/design/_template/brief.md` link will say `MISSING` until Task 3 runs — that's expected at this point. Note it for re-verification after Task 3.

- [ ] **Step 3: Length check**

Run: `wc -l docs/design/README.md`
Expected: < 120 lines.

- [ ] **Step 4: Commit**

```bash
git add docs/design/README.md
git commit -m "Add docs/design/README.md framework orientation"
```

---

## Task 3: Write the brief template

**Files:**

- Create: `docs/design/_template/brief.md`

**Purpose:** The skeleton every new surface brief is copied from. Includes inline guidance comments (HTML comments, so they render invisibly but instruct the AI authoring a brief).

- [ ] **Step 1: Write the template**

Write the following content to `docs/design/_template/brief.md`:

```markdown
# Brief: <Surface name>

<!--
This is the file pasted as the opening message to a Claude Design project.
Keep under ~300 lines. Link, don't paste, when source documents are long.
The accompanying inputs/ folder holds attachments for Claude Design.
-->

## What we're designing

<!-- One paragraph. Surface's purpose, position in IA, user moment it serves. -->

## Who it's for

<!--
The 1-2 personas this surface primarily serves (not all 4).
Link to docs/strategy/personas.md sections, don't paste here.
The persona-excerpt.md in inputs/ holds the curated excerpt for Claude Design.
-->

## The user moment

<!--
The journey beat this surface owns.
Link to the relevant docs/strategy/journey-maps.md row(s).
The journey-moment.md in inputs/ holds the curated excerpt for Claude Design.
-->

## Behavior to design (state matrix)

<!--
Bullet list of states the surface must handle. Be specific to this surface.
Common categories:
- Empty / first-use
- Primary / loaded
- Loading
- Error
- Edge cases specific to this surface
-->

## Behavioral rules

<!--
Quote (or link) the EARS rules and Gherkin scenarios from docs/scenarios/<domain>/.
Don't restate — quote the source.
The scenarios.md in inputs/ holds the curated subset for Claude Design.
-->

## Constraints

<!--
- Responsiveness target (mobile-first; assume propped phone in kitchen)
- A11y requirements (keyboard, screen reader, reduced-motion)
- Performance constraint if any (e.g., must work offline)
- "What we never say" reminders specific to this surface
  (see _kernel/brand-voice.md)
-->

## Success criteria

<!--
3-5 bullets. Format:
"A user in <persona> situation, opening this surface, can <action> in <time/taps> without <friction>."
-->

## Ask Claude Design to

<!--
Specific asks for the first generation:
- Produce N variations of <specific aspect>
- Review against <specific principle from _kernel/design-principles.md>
- Show responsive behavior at <breakpoints>
-->

## Wireframe reference

<!--
Default: don't attach.
Attach only if a behavior cannot be described in words alone.
If attaching, place the file in inputs/ and reference it here.
-->
```

- [ ] **Step 2: Verify template length**

Run: `wc -l docs/design/_template/brief.md`
Expected: < 100 lines.

- [ ] **Step 3: Re-verify Task 2's link check**

Run the same loop from Task 2, Step 2. Now `docs/design/_template/brief.md` should be `OK`.

- [ ] **Step 4: Commit**

```bash
git add docs/design/_template/brief.md
git commit -m "Add design brief template"
```

---

## Task 4: Write `_kernel/brand-voice.md`

**Files:**

- Create: `docs/design/_kernel/brand-voice.md`

**Purpose:** Voice, tone, and the explicit "what we never say" list. Length cap: 200 lines.

**Source material to draw from (read first):**

- `docs/strategy/personas.md` — note the design implications sections that mention micro-copy
- `docs/strategy/journey-maps.md` — especially Journeys 5, 6, 9 (the "without" columns reveal what tone the app rejects; the "Recovery Design" column in Journey 9 names anti-patterns explicitly)
- `docs/strategy/jtbd.md` — the "Invisible Accommodation" section

- [ ] **Step 1: Draft the file with this required structure**

```markdown
# Brand voice

The voice that holds the entire product together. Every micro-copy decision references this file.

## Core stance

One paragraph. The "calm friend in the kitchen" framing. Not clinical, not chirpy, not coachy. Speaks to the user at their hardest moment (6pm, depleted, possibly ashamed) without naming that hardness.

## What we never say

Hard-list. Each item: the phrase + why. Minimum coverage:

- "expired", "missed", "failed", "you haven't…" — these turn the app into a judgment
- Diagnosis names (ADHD, executive dysfunction, neurodivergent) — invisible accommodation, not clinical tool
- "you should", "you need to", "don't forget" — instructional voice the user has fired
- "great job!", "amazing!" — performative praise
- Streaks, scores, gamification language
- "let's…" prefixes that imply the app is doing the cooking
- Notification copy that nags ("you haven't planned this week")

## What we say instead

Examples paired with the rejected version:

- Not "You missed Wednesday's meal." → Use "Three meals left this week."
- Not "Great job!" → Use "Step 8 of 12 — sauce is building."
- Not "You haven't planned this week." → No notification at all; or a value-only nudge: "20-minute dinner idea?"
- Not "Time's up!" → Use "Sauce is ready."

(Aim for 6-10 paired examples drawn from the journey maps.)

## Tone qualities

Three to five qualities, each with a one-line clarifier. Examples to include:

- Quiet — the app does not interrupt; it informs only when value is delivered
- Warm — without being saccharine
- Specific — "29:45 left on the simmer" beats "almost done"
- Trustworthy — the app does what it said it would do, in the moment it said it would

## Progress acknowledgment

Specific patterns for cooking-mode progress copy. Format: short, factual, present-tense. Examples drawn from Journey 1 and Journey 2 ("Step 6 of 12", "Sauce is building", "Both pots simmering"). 4-6 examples.

## Handoff voice

When the app talks about another actor (the partner, the shopper), it never apologizes for them. The link sent to the shopper opens to "Shopping list" — not "Thanks for helping!"

## Voice across surfaces

One paragraph each for the surfaces with distinct voice considerations:

- Catalog / hub — quiet, no pushy CTAs
- Suggestion engine — exactly 3 options, no "we picked these for you" framing
- Cooking view — present-tense, factual, glance-readable
- Pool planner — meals that haven't been cooked are "remaining", never "overdue"
- Web checklist (shopper voice) — instructional and minimal; the shopper does not know the rest of the ecosystem exists
- Empty states and absence — never accusatory; "What sounds good tonight?" not "You haven't planned"
```

- [ ] **Step 2: Verify length**

Run: `wc -l docs/design/_kernel/brand-voice.md`
Expected: < 200 lines.

- [ ] **Step 3: Verify required sections present**

Run:

```bash
grep -E '^## ' docs/design/_kernel/brand-voice.md
```

Expected: at least 7 H2 sections (Core stance, What we never say, What we say instead, Tone qualities, Progress acknowledgment, Handoff voice, Voice across surfaces).

- [ ] **Step 4: Commit**

```bash
git add docs/design/_kernel/brand-voice.md
git commit -m "Add brand-voice kernel document"
```

---

## Task 5: Write `_kernel/design-principles.md`

**Files:**

- Create: `docs/design/_kernel/design-principles.md`

**Purpose:** Restate the 11 principles already extracted at the bottom of `docs/strategy/journey-maps.md` as **design directives** (imperatives, not observations). Length cap: 200 lines.

- [ ] **Step 1: Read the source**

Open `docs/strategy/journey-maps.md` and read the section "Design Principles Extracted from Journey Maps" at the very bottom. The 11 principles, in order, are: One thing at a time / The app watches what you can't / Resumable state / Warmth over efficiency / Show, don't configure / Fill idle time / Forgiveness over compliance / Constraint is the feature / Zero-friction handoff / Graceful degradation / Fresh start, not failure state.

- [ ] **Step 2: Write the file with this required structure**

```markdown
# Design principles

Eleven principles distilled from Hob's journey maps. Each is a design directive: when in doubt during a Claude Design session, ask "does this respect principle N?"

The principles are derived from observed user pain in `docs/strategy/journey-maps.md`. The "Design Principles Extracted" table at the bottom of that file is the source.

## How to use this file

Each principle below has three parts:

- **The directive** (imperative form — what designs must do)
- **The pain it addresses** (one sentence — drawn from journey maps)
- **What violating it looks like** (one concrete example — so you can spot drift)

## 1. One thing at a time

- **Directive:** Show one task on screen during execution. Never two. Never a list.
- **Pain:** Wall-of-text recipes trigger overwhelm at the cognitive lowest point.
- **Violation:** A cooking screen that lists steps 6, 7, and 8 in a sidebar.

## 2. The app watches what you can't

- **Directive:** Any time-based or state-based thing that can be lost track of (a pot on the stove, a step in progress, a timer running) is something the app must surface even when the user has switched contexts.
- **Pain:** Time blindness scorches the sauce.
- **Violation:** A timer that only shows on the step that started it.

## 3. Resumable state

- **Directive:** Every screen the user might be interrupted on must restore exactly where they were, with no "are you sure?" friction.
- **Pain:** Kids interrupt cooking; the app must be picked up and put down many times per session.
- **Violation:** A cooking session that resets to step 1 on reopen.

## 4. Warmth over efficiency

- **Directive:** Choose the option that lowers emotional load over the option that saves clicks.
- **Pain:** The emotional job is "feel competent", not "cook faster".
- **Violation:** A "Streak: 3 days!" badge in the catalog header.

## 5. Show, don't configure

- **Directive:** No screen should require the user to set anything before getting value. Zero-config first run. Sensible defaults visible immediately.
- **Pain:** "Want To But Can't" persona will never read instructions or configure settings.
- **Violation:** An onboarding modal asking for cuisine preferences.

## 6. Fill idle time

- **Directive:** Wait windows (simmer, bake, marinate) are surfaces. Use them to suggest a useful adjacent action — never to push notifications or upsells.
- **Pain:** Idle time is either lost or weaponized by other apps.
- **Violation:** A "While you wait, rate this recipe!" prompt during simmer.

## 7. Forgiveness over compliance

- **Directive:** Skipping, abandoning, or rearranging anything must be a zero-friction action that produces no judgment-laden state.
- **Pain:** Wednesday Gap — rigid plans cascade into abandonment when the user's brain rejects today's planned meal.
- **Violation:** A "missed meal" badge or strikethrough on yesterday's plan.

## 8. Constraint is the feature

- **Directive:** Where decisions cause paralysis, surface fewer options, never more. Three suggestions, not a catalog. Two energy tiers, not a slider.
- **Pain:** Decision paralysis at 6pm with infinite options.
- **Violation:** A "show me 12 more options" link below the 3 suggestions.

## 9. Zero-friction handoff

- **Directive:** Anything shared with another person opens in a phone browser without an install, account, or login.
- **Pain:** Asymmetric households — the partner won't install another app.
- **Violation:** A shopping list that requires the recipient to sign in to view.

## 10. Graceful degradation

- **Directive:** Every tool works on its own. No tool's value depends on another tool being actively used.
- **Pain:** When users abandon part of the ecosystem, dependent features cascade into uselessness.
- **Violation:** A cooking view that shows "Add this to your plan first" before letting the user start.

## 11. Fresh start, not failure state

- **Directive:** Reopening the app after absence shows a fresh, inviting state — never expired meals, missed plans, or guilt-laden notifications.
- **Pain:** Apps that punish absence get deleted.
- **Violation:** A red banner on reopen: "You haven't planned this week."

## Cross-principle tensions

Brief notes on the few places principles can pull against each other and which wins:

- "Show, don't configure" vs. "The app watches what you can't" — the app must be useful with no setup, but it can opt the user into watch behaviors automatically (no toggle), staying out of their way until needed.
- "Fill idle time" vs. "One thing at a time" — secondary task suggestions appear only when the primary task is paused (timer running). Never compete for attention with the active task.
- "Constraint is the feature" vs. "Forgiveness over compliance" — the constraint is on options shown, not on user actions. Three suggestions, but unlimited "not these" presses.
```

- [ ] **Step 3: Verify length and structure**

Run:

```bash
wc -l docs/design/_kernel/design-principles.md
grep -c '^## [0-9]' docs/design/_kernel/design-principles.md
```

Expected: < 200 lines, and exactly 11 numbered H2 sections.

- [ ] **Step 4: Commit**

```bash
git add docs/design/_kernel/design-principles.md
git commit -m "Add design-principles kernel document"
```

---

## Task 6: Write `_kernel/micro-interactions.md`

**Files:**

- Create: `docs/design/_kernel/micro-interactions.md`

**Purpose:** Behavioral spec only for the five reusable patterns: focus card, awareness bar, timer, phase card, suggestion chip. **No visual prescriptions.** Length cap: 300 lines.

**Source material:**

- `docs/strategy/journey-maps.md` — Journeys 1, 2, 3 describe how these patterns behave in use
- `docs/strategy/service-blueprint.md` — Section 1 lists the surfaces these patterns appear on
- `docs/scenarios/cooking/timers.md`, `docs/scenarios/cooking/parallel-tasks.md`, `docs/scenarios/cooking/step-navigation.md` — behavioral requirements
- `docs/scenarios/accessibility/screen-reader.md`, `docs/scenarios/accessibility/keyboard-navigation.md`, `docs/scenarios/accessibility/reduced-motion.md` — a11y requirements
- `docs/wireframes/analog-timer.html` and `docs/wireframes/analog-timer.machine.js` — the timer pattern's working reference (state machine and behavior, not the visual)

- [ ] **Step 1: Write the file with one section per pattern**

Each pattern section uses the same sub-structure:

```markdown
## Pattern: <Name>

**Purpose.** One sentence — the user job this pattern serves.

**Where it appears.** Which surfaces use it (link to the relevant `docs/scenarios/` files).

**Structural elements.** What information the pattern conveys. Not visual — content elements only.

**States.** Bullet list of every state this pattern must handle (e.g., for timer: idle, running, ringing, dismissed).

**Behavior.** What the pattern does over time / in response to input. State transitions if relevant.

**Accessibility.**
- Keyboard: how it must be navigable
- Screen reader: what it must announce, when
- Reduced motion: what changes when `prefers-reduced-motion: reduce`

**What it must never do.** Anti-patterns specific to this primitive.
```

The five patterns to document, in this order:

1. **Focus card** — the single-task-at-a-time cooking step display
2. **Awareness bar** — persistent multi-timer status across cooking steps
3. **Timer** — single countdown with audio alarm; reference `docs/wireframes/analog-timer.machine.js` for state model
4. **Phase card** — overview-mode summary card showing prep/cook/simmer/finish blocks with time badges
5. **Suggestion chip** — the inline 3-options decide-stage element

Open the source files listed above for behavioral specifics. Do not invent behavior — extract from the journey maps and scenarios.

Begin the file with this preamble:

```markdown
# Micro-interactions

Five reusable behavioral patterns the entire product is built around. This file specifies what each pattern *does*, not what it *looks like*. Visual treatment is for Claude Design to decide; behavior is non-negotiable.

Source material: this file synthesizes patterns documented behaviorally in [docs/scenarios/](../../scenarios/) and [docs/strategy/journey-maps.md](../../strategy/journey-maps.md). When in doubt, those sources win.
```

- [ ] **Step 2: Verify all five patterns present**

Run:

```bash
grep -c '^## Pattern:' docs/design/_kernel/micro-interactions.md
```

Expected: 5.

- [ ] **Step 3: Verify length**

Run: `wc -l docs/design/_kernel/micro-interactions.md`
Expected: < 300 lines.

- [ ] **Step 4: Verify no visual prescriptions snuck in**

Run:

```bash
grep -iE 'pixel|px|color|background|border|font-size|rgb|#[0-9a-f]{3,}|tailwind|hex' docs/design/_kernel/micro-interactions.md
```

Expected: no matches. (Visual prescriptions belong in `design-intent.md` as intent, never in `micro-interactions.md`.)

- [ ] **Step 5: Commit**

```bash
git add docs/design/_kernel/micro-interactions.md
git commit -m "Add micro-interactions kernel document"
```

---

## Task 7: Write `_kernel/design-intent.md`

**Files:**

- Create: `docs/design/_kernel/design-intent.md`

**Purpose:** Color, typography, spacing, motion stated as **intent**, not as concrete CSS values. Length cap: 150 lines.

- [ ] **Step 1: Write the file**

Use this exact structure:

```markdown
# Design intent

Color, typography, spacing, and motion stated as intent. Concrete values are for Claude Design to choose — these constraints define what those values must satisfy.

## Color intent

- **Warm and unclinical.** Never sterile-white. Never the saturated red/green that reads as "alert / status".
- **High contrast in cooking view.** Glance-readable at arm's length, possibly with wet hands, possibly in dim or bright kitchen lighting.
- **Subdued, not muted.** Saturation low enough to never compete with food photography (where it appears) or with the user's actual food in front of them.
- **Status conveyed by structure, not color alone.** A11y baseline. Color is reinforcement; layout and language are the primary signals.

## Typography intent

- **Type scale optimized for kitchen-distance reading.** Body text larger than typical web defaults; phone propped on counter ≈ 60-80cm from face.
- **One font family, two at most.** A single readable sans for everything is acceptable; if a second family is used, reserve it for recipe titles and phase labels.
- **Numerals stand out.** Quantities, times, and timers read at a glance. Tabular figures where they appear in counters.
- **No decorative text in the cooking view.** Cooking view is purely functional.

## Spacing intent

- **Generous touch targets.** Kitchen use: occasional misses with a knuckle or a fingertip. Minimum 44px equivalent; cooking view targets larger.
- **Breathing room over density.** Catalog and overview can be dense; cooking and suggestion screens must not be.
- **One-handed phone use respected.** Critical actions (next step, dismiss, start timer) reachable with thumb.

## Motion intent

- **Subdued by default.** Motion communicates state change, never delight.
- **Respect `prefers-reduced-motion: reduce` everywhere.** No exceptions for "subtle" animations.
- **Timers are a special case.** A countdown is *information*, not *animation*. The visual treatment of the countdown counts as motion under this rule but must remain enabled (with simplified transitions) under reduced-motion.

## Mode intent

- **Light mode is the default.** Most kitchens are bright.
- **Dark mode supported, not pushed.** Some users cook with dim lighting. The dark mode is "calm reading", not "cinematic".

## What this file is not

This file does not pin specific color hex values, font families, or px values. Claude Design extracts concrete values during organization onboarding (see `codebase-pointers.md`) and refines them per project. If a per-surface brief needs to override a default for a specific reason, that override goes in the brief, not here.
```

- [ ] **Step 2: Verify length**

Run: `wc -l docs/design/_kernel/design-intent.md`
Expected: < 150 lines.

- [ ] **Step 3: Verify no concrete values snuck in**

Two checks. First, look for color values (no acceptable matches):

```bash
grep -niE '#[0-9a-f]{3,6}\b|rgb\(|hsl\(' docs/design/_kernel/design-intent.md
```

Expected: no matches.

Second, list every `px` mention so you can review by eye:

```bash
grep -niE '[0-9]+px' docs/design/_kernel/design-intent.md
```

Expected: only the "44px equivalent" line for the minimum touch target. Any other concrete pixel value should be reworded as intent.

- [ ] **Step 4: Commit**

```bash
git add docs/design/_kernel/design-intent.md
git commit -m "Add design-intent kernel document"
```

---

## Task 8: Write `_kernel/codebase-pointers.md`

**Files:**

- Create: `docs/design/_kernel/codebase-pointers.md`

**Purpose:** Tell Claude Design exactly which subdirectories to link during organization onboarding (it can't handle the whole monorepo — known limitation). Length cap: 80 lines.

- [ ] **Step 1: Confirm subdirectories exist**

Run:

```bash
test -d packages/build/recipes && echo "OK: packages/build/recipes" || echo "MISSING"
test -d lexicons && echo "OK: lexicons" || echo "MISSING"
```

Both should report `OK`. If either reports `MISSING`, stop and reconcile against the spec — the framework assumes these paths.

- [ ] **Step 2: Write the file**

```markdown
# Codebase pointers for Claude Design

Claude Design's "Set up your design system" onboarding can link source repositories. Per the [Anthropic Labs documentation](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), linking very large repositories causes lag — link specific subdirectories instead.

This file specifies exactly which subdirectories to link, and which to deliberately exclude.

## Link these

| Path | Why |
| --- | --- |
| [`packages/build/recipes/`](../../../packages/build/recipes/) | Recipe JSON shape — examples of the data the product organizes |
| [`lexicons/`](../../../lexicons/) | ATproto lexicons — the type definitions for synced records |

## Do not link

| Path | Why excluded |
| --- | --- |
| Repository root | Too large; causes lag per Claude Design's known limitations |
| `site/` | Existing rendered HTML and CSS would bias the extracted design system toward the current aesthetic — we want fresh design thinking, anchored only by intent |
| `node_modules/` | Vendor code |
| `tmp/` | Working artifacts, market research output, transient scratch |
| `docs/wireframes/` | Existing wireframes are introduced selectively in per-surface `inputs/`, not at the org-design-system level |

## Reference docs to consult separately

These are not codebase links — they are docs we may quote in per-surface briefs:

- [Strategy](../../strategy/) — JTBD, personas, journey maps, IA, service blueprint, data model
- [Scenarios](../../scenarios/) — behavioral specs by domain

## Re-validation

If the repository structure changes (e.g., `packages/build/recipes/` is moved), update this file and re-run the Claude Design organization onboarding. The kernel is the contract; codebase paths drift faster than the kernel does.
```

- [ ] **Step 3: Verify length and that linked paths exist**

Run:

```bash
wc -l docs/design/_kernel/codebase-pointers.md
test -d packages/build/recipes && echo "linked path 1: OK"
test -d lexicons && echo "linked path 2: OK"
```

Expected: < 80 lines, both paths OK.

- [ ] **Step 4: Commit**

```bash
git add docs/design/_kernel/codebase-pointers.md
git commit -m "Add codebase-pointers kernel document"
```

---

## Task 9: Verify Phase 1 surface placeholder folders

**Files:**

- Already created in Task 1.

- [ ] **Step 1: Confirm placeholders are in place**

Run:

```bash
for surface in multi-recipe partner-track import-flow energy-tier; do
  test -f "docs/design/$surface/.gitkeep" \
    && echo "OK: $surface" \
    || echo "MISSING: $surface"
done
```

Expected: all four `OK`.

- [ ] **Step 2: No commit needed** if all four are in place from Task 1's commit. If anything is missing, restore via Task 1, Step 2 commands and commit:

```bash
git add docs/design/multi-recipe docs/design/partner-track docs/design/import-flow docs/design/energy-tier
git commit -m "Restore Phase 1 surface placeholders"
```

---

## Task 10: Pilot brief — Suggestion engine

**Files:**

- Create: `docs/design/suggestion-engine/brief.md`
- Create: `docs/design/suggestion-engine/inputs/persona-excerpt.md`
- Create: `docs/design/suggestion-engine/inputs/journey-moment.md`
- Create: `docs/design/suggestion-engine/inputs/scenarios.md`

**Purpose:** End-to-end worked example of the framework before scaling. Pilot serves the highest-leverage moment: the 6pm decision.

**Source material:**

- `docs/strategy/personas.md` — Persona 1 ("Want To But Can't"), specifically the "Ecosystem Needs" row about the suggestion engine
- `docs/strategy/journey-maps.md` — Journey 6 ("6pm Decision Paralysis")
- `docs/strategy/jtbd.md` — Stage: Decide section
- `docs/strategy/information-architecture.md` — Section 8 ("Catalog Hub Design") which describes the suggestion engine's placement
- `docs/strategy/service-blueprint.md` — Section 5 ("Journey: 6pm Decision")
- `docs/scenarios/decide/energy-aware-suggestions.md`
- `docs/scenarios/decide/zombie-mode.md`
- `docs/scenarios/decide/theme-night-rotation.md`

- [ ] **Step 1: Write `inputs/persona-excerpt.md`**

This file holds the curated persona context for Claude Design — it's what gets attached to the project, so it must stand alone without the rest of `personas.md`.

```markdown
# Persona excerpt — for the Suggestion engine brief

Source: [docs/strategy/personas.md](../../../strategy/personas.md) — "Want To But Can't" (the primary beachhead user) and "Family Feeder Under Pressure" (secondary).

## Primary persona: "Want To But Can't"

Age 25-35, working full-time. Knows how to cook. Cannot reliably execute due to cognitive load at the end of the workday.

The defining moment for this surface: 6pm, exhausted from work. Opens the fridge. Has ingredients. Cannot decide what to cook. Browses Pinterest for 45 minutes, orders takeout. The gap between aspirational ("complex Thai") and actual ("scrambled eggs") drives shame.

What this persona needs from the suggestion engine, verbatim from personas.md:

> 2-3 options at 6pm filtered by "zombie mode" energy tier. Never show the full catalog.

## Secondary persona: "Family Feeder Under Pressure"

Age 30-45, parent. Theme nights (Taco Tuesday, Pasta Monday) are this persona's survival strategy. They want suggestions that respect today's theme: "It's Pasta Monday, here are 3 pasta recipes your family hasn't had in 2 weeks."

## Constraints both personas share

- The full catalog must never be the fallback when filters return nothing.
- "Not tonight" must be a zero-guilt, zero-consequence exit.
- Energy-tier filtering ("zombie mode" vs. "moderate" vs. "project mode") is the key innovation here.
- Constraint is the feature: 3 options, never more.
```

- [ ] **Step 2: Write `inputs/journey-moment.md`**

```markdown
# Journey moment — for the Suggestion engine brief

Source: [docs/strategy/journey-maps.md](../../../strategy/journey-maps.md) — Journey 6, "6pm Decision Paralysis"

## The "Without the Ecosystem" baseline

| Phase | Action | Emotion |
| --- | --- | --- |
| Trigger | 6pm. Exhausted. Opens fridge. | Obligation |
| Browse | Opens Pinterest. Saves 3 recipes. Makes none. 45 min pass. | Paralysis |
| Give up | Closes Pinterest. Orders pad thai. | Resignation > shame |

## The "With the Ecosystem" target

| Phase | Action | Emotion | Surface touchpoint |
| --- | --- | --- | --- |
| Trigger | 6pm. Opens app. Taps "What should I cook?" | Low-effort curiosity | Suggestion engine entry on hub |
| Suggest | App shows 3 options from her pool, filtered by "quick" energy tier | Relief | The surface this brief covers |
| Decide | Taps Pasta. Overview loads. | Momentum | One tap from suggestion to recipe |
| Cook | Focus cards, timer for the pasta water. Done in 28 min. | Surprise > pride | Existing cooking flow |

## What if none of the 3 appeal?

| Phase | Action | Emotion | Surface touchpoint |
| --- | --- | --- | --- |
| Dismiss | "Not these." Three new options. Still not feeling it. "Not tonight." | Honesty without guilt | Suggestion engine — must support |
| Zombie mode | App offers: "Really low energy? Here are meals with 5 or fewer decisions." | Permission | Energy-tier UI within suggestion engine |

## Critical design implications drawn from this journey

- Surface exactly 3 options, never more.
- Energy-tier filtering is the key innovation.
- "Not tonight" must be zero-guilt, zero-consequence.
- The full catalog should never be the fallback.
- Zombie mode legitimizes minimal-effort meals.
```

- [ ] **Step 3: Write `inputs/scenarios.md`**

```markdown
# Scenarios — for the Suggestion engine brief

Source: [docs/scenarios/decide/](../../../scenarios/decide/)

This file curates the EARS rules and Gherkin scenarios for the suggestion engine. Quote-only — do not reword. The original scenario files remain authoritative.

---

## From `energy-aware-suggestions.md`

[Quote in full the Rules and Scenarios sections — copy verbatim from the source file. Include Status, Story, Rules, Scenarios, Questions, Holdout fields.]

---

## From `zombie-mode.md`

[Quote in full the Rules and Scenarios sections — copy verbatim from the source file.]

---

## From `theme-night-rotation.md`

[Quote in full the Rules and Scenarios sections — copy verbatim from the source file.]

---

## Cross-scenario notes

If any scenarios contradict each other (e.g., one says max 3 options, another implies more), flag here for the designer's attention. If no contradictions, this section says "No contradictions identified."
```

The `[Quote in full ...]` placeholders are instructions to the engineer — replace each one with the actual content of that scenario file. Use:

```bash
cat docs/scenarios/decide/energy-aware-suggestions.md
cat docs/scenarios/decide/zombie-mode.md
cat docs/scenarios/decide/theme-night-rotation.md
```

…to read each file, then paste the relevant sections (Status through Holdout) into the corresponding section of `inputs/scenarios.md`.

- [ ] **Step 4: Write `brief.md`**

This is the file pasted as the opening message to the Claude Design project. Structure follows `docs/design/_template/brief.md`. Length cap: 300 lines.

```markdown
# Brief: Suggestion engine

## What we're designing

The suggestion engine is the entry point on the hub (catalog page) that addresses the 6pm decision paralysis. It surfaces exactly 3 recipes filtered by current energy and time constraints, and provides graceful exits when none appeal. It also exposes "zombie mode" — a curated subset of minimal-decision recipes for the worst nights. This is the first surface most users will see daily.

It lives on the hub at the top of the catalog page (see [docs/strategy/information-architecture.md, Section 8](../../strategy/information-architecture.md)). It is **inline on the hub**, not a separate page.

## Who it's for

- Primary: "Want To But Can't" — see `inputs/persona-excerpt.md`
- Secondary: "Family Feeder Under Pressure" — see `inputs/persona-excerpt.md`

## The user moment

6pm. Cognitive resources at their lowest. The user opens the app and either (a) wants to cook something but can't decide, or (b) is on theme-night autopilot but wants today's variation surfaced.

Full journey context: see `inputs/journey-moment.md` (Journey 6 — "6pm Decision Paralysis").

## Behavior to design (state matrix)

The surface must handle every state below. Design each.

- **No pool, no theme set** — first-time-user state. The suggestion section appears only after the first cook? Or always with a different fallback?
- **Pool active, 3+ matching meals** — primary state. Three suggestion chips, energy filter visible.
- **Pool active, fewer than 3 matches** — fewer chips, no padding, no full-catalog fallback.
- **All 3 dismissed (`Not these`)** — three new chips slide in. Track dismissed across the session.
- **Theme night active** — chips filtered by today's cuisine theme.
- **Zombie mode** — accessed via "Not tonight" → "Really low energy?" path. Curated subset, 3 options, even simpler.
- **No suggestions possible** — graceful empty state ("Nothing matches today's filters. [Adjust] / [Browse all]"). This is the only place the full catalog can be reached.

## Behavioral rules

Authoritative source: `inputs/scenarios.md` (curated from [docs/scenarios/decide/](../../scenarios/decide/)).

Key rules to honor (from the energy-aware-suggestions, zombie-mode, and theme-night-rotation files — quote them in `inputs/scenarios.md`):

- Show exactly 3 suggestions. Never more.
- "Not these" replaces all 3 with 3 new options from the same pool.
- "Not tonight" exits to zombie mode prompt.
- Zombie mode is a curated set, not a filter result.
- Energy-tier filtering is the primary control.
- Theme-night filtering, when active, is applied before energy filtering.

## Constraints

- **Responsiveness target:** mobile-first. Phone propped on counter or held one-handed.
- **A11y requirements:**
  - Keyboard: full keyboard navigation through chips, energy tier control, dismiss, "not tonight" exit.
  - Screen reader: each chip announced as "Suggestion N of 3, <recipe title>, <time>, <energy tier>." The dismiss-and-replace action announces "Showing 3 new suggestions."
  - Reduced motion: chip replacement is a state change, not a slide animation, when reduced motion is preferred.
- **Performance:** suggestion filtering runs client-side on already-loaded recipe data. Must complete within one frame.
- **What we never say (from `_kernel/brand-voice.md`):** no "we picked these for you" framing; no streak/score language; "Not tonight" must read as a normal exit, not as a negative consequence.
- **No sign of failure on revisit:** if all 3 were dismissed last session, on next open just present 3 fresh ones — no memory of yesterday's dismissals.

## Success criteria

- A "Want To But Can't" persona at 6pm can reach a cookable recipe in under 10 seconds (open app → tap suggestion → recipe overview loaded).
- A user who dismisses all 3 and selects "Not tonight" reaches zombie mode in under 2 additional taps and feels no judgment.
- A "Family Feeder" persona on Pasta Monday sees 3 pasta recipes that exclude any cooked in the last 14 days.
- Screen-reader users can complete the same task with the same number of interactions.
- Reopening the app the next day shows fresh suggestions with no reference to yesterday's dismissals.

## Ask Claude Design to

- Produce **3 layout variations** for the primary state (pool active, 3 matching meals). The variations should explore: chip layout (horizontal row vs. vertical stack vs. grid), placement of the energy-tier control (above chips vs. inline vs. as a per-chip secondary affordance), and disclosure of the "Not tonight" exit (always-visible vs. revealed after first dismiss).
- Show the **state transition** when the user taps "Not these" — what changes on screen.
- Show the **path into zombie mode** — what the user sees after tapping "Not tonight."
- **Review the design against:**
  - Principle 1 (One thing at a time) — does the section feel uncluttered?
  - Principle 8 (Constraint is the feature) — is "3 options, never more" obvious?
  - Principle 11 (Fresh start, not failure state) — does any state look like punishment for previous dismissals?
- Show responsive behavior at: 360px (small phone), 768px (tablet), 1024px (desktop hub view).

## Wireframe reference

Not attached. The suggestion engine has no existing wireframe — that's why it's the pilot. Design from scratch.
```

- [ ] **Step 5: Verify all four files exist and the brief is within length cap**

Run:

```bash
ls -la docs/design/suggestion-engine/inputs/
wc -l docs/design/suggestion-engine/brief.md
```

Expected: `inputs/` contains `persona-excerpt.md`, `journey-moment.md`, `scenarios.md`. Brief is < 300 lines.

- [ ] **Step 6: Verify the scenarios.md placeholders were replaced**

Run:

```bash
grep -c '\[Quote in full' docs/design/suggestion-engine/inputs/scenarios.md
```

Expected: `0`. If non-zero, the placeholders weren't replaced — go back to Step 3 and replace them with actual scenario content.

- [ ] **Step 7: Verify cross-references resolve**

Run:

```bash
for link in \
  docs/design/_kernel/brand-voice.md \
  docs/strategy/information-architecture.md \
  docs/strategy/personas.md \
  docs/strategy/journey-maps.md \
  docs/scenarios/decide/energy-aware-suggestions.md \
  docs/scenarios/decide/zombie-mode.md \
  docs/scenarios/decide/theme-night-rotation.md; do
  test -e "$link" && echo "OK: $link" || echo "MISSING: $link"
done
```

Expected: every line `OK`.

- [ ] **Step 8: Commit**

```bash
git add docs/design/suggestion-engine
git commit -m "Add Suggestion engine pilot brief and inputs"
```

---

## Task 11: Final integration check and framework README cross-link verification

**Files:**

- Modify (verify only): all created files

- [ ] **Step 1: Run the directory tree and confirm**

Run: `find docs/design -type f | sort`

Expected output (every file listed):

```text
docs/design/README.md
docs/design/_kernel/brand-voice.md
docs/design/_kernel/codebase-pointers.md
docs/design/_kernel/design-intent.md
docs/design/_kernel/design-principles.md
docs/design/_kernel/micro-interactions.md
docs/design/_template/brief.md
docs/design/energy-tier/.gitkeep
docs/design/import-flow/.gitkeep
docs/design/multi-recipe/.gitkeep
docs/design/partner-track/.gitkeep
docs/design/suggestion-engine/brief.md
docs/design/suggestion-engine/inputs/journey-moment.md
docs/design/suggestion-engine/inputs/persona-excerpt.md
docs/design/suggestion-engine/inputs/scenarios.md
docs/design/suggestion-engine/outputs/handoff/.gitkeep
docs/design/suggestion-engine/outputs/screenshots/.gitkeep
```

If any file is missing, return to the corresponding task.

- [ ] **Step 2: Verify all kernel files within their length caps**

Run:

```bash
wc -l docs/design/_kernel/*.md
```

Expected:

- `brand-voice.md` < 200
- `design-principles.md` < 200
- `micro-interactions.md` < 300
- `design-intent.md` < 150
- `codebase-pointers.md` < 80

If any file exceeds its cap, trim. Kernel files are loaded every Claude Design session — ruthless YAGNI.

- [ ] **Step 3: Verify README forward links resolve to files that now exist**

Run:

```bash
for link in \
  docs/design/_template/brief.md \
  docs/design/_kernel \
  docs/superpowers/specs/2026-04-20-design-framework-design.md \
  docs/strategy/journey-maps.md \
  docs/strategy/information-architecture.md \
  docs/strategy/personas.md \
  docs/strategy/jtbd.md; do
  test -e "$link" && echo "OK: $link" || echo "MISSING: $link"
done
```

Expected: every line `OK`.

- [ ] **Step 4: Spot-check that no kernel file mentions concrete CSS values**

Run:

```bash
grep -nE '#[0-9a-f]{6}\b|rgb\(|hsl\(' docs/design/_kernel/*.md
```

Expected: no matches.

- [ ] **Step 5: Verify the spec file is consistent with the result**

Open `docs/superpowers/specs/2026-04-20-design-framework-design.md`. Confirm that "Architecture > Repository structure" matches what `find docs/design -type d` shows. If the spec drifted (e.g., it still says "six kernel files"), update the spec to match reality.

Run:

```bash
grep -n 'six kernel files\|6 kernel files' docs/superpowers/specs/2026-04-20-design-framework-design.md
```

Expected: no matches.

- [ ] **Step 6: Final commit and tag**

If any spec corrections were made in Step 5:

```bash
git add docs/superpowers/specs/2026-04-20-design-framework-design.md
git commit -m "Reconcile spec with implemented framework structure"
```

Otherwise, no commit needed. Confirm clean working tree:

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

---

## What this plan deliberately does NOT do

These are out of scope for this plan. They are next steps to schedule afterward.

- **Open the Claude Design project for the suggestion engine.** That's the first run of step 4 of the per-surface workflow described in the spec. It happens manually, not as part of scaffolding the framework.
- **Set up the Claude Design organization design system.** Requires uploading the kernel files via the Claude Design UI. Done separately, with human-in-the-loop review of the extracted system.
- **Author briefs for the other Phase 1 surfaces.** Pilot ships first; lessons from the pilot may revise the brief template before scaling.
- **Write the missing accessibility scenarios** (per the spec's risk table). Triggered on a per-surface basis at step 5 of that surface's workflow, not as part of framework scaffolding.

These belong in their own plans, scheduled after the pilot Claude Design session has produced output and `decisions.md` has been written.
