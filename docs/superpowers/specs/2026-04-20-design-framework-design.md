# Design framework: chunking UX/UI work for Hob

## Status

Draft — pre-implementation. Pre-MVP product, framework not yet adopted.

## Problem

Hob (formerly the recipe app) has mature **strategy** (`docs/strategy/`) and **scenarios** (`docs/scenarios/`) layers, but its **design** layer is fragmented:

- Wireframes exist for 9 surfaces as standalone PNGs and a single `.pen` file, with no consistent structure or per-surface metadata.
- Several surfaces (suggestion engine, multi-recipe `/cook.html`, partner track `/partner.html`, import flow, energy-tier UI) have behavioral scenarios but no visual artifact.
- Vision-status surfaces lack accessibility scenarios.
- There is no design-system / design-tokens documentation, no micro-interaction catalog, and no shared brand-voice doc.
- Every design pass currently requires re-reading the entire strategy stack to reconstruct context.

Going forward, design work will be **AI-led with human review**, executed primarily through **Claude Design** (Anthropic Labs). The framework needs to:

1. Package per-surface context tightly enough to fit one focused Claude Design session.
2. Carry behavioral, persona, journey, and brand context into Claude Design without recreating the strategy stack each time.
3. Capture Claude Design output back into the repo in a form that Claude Code can implement against.
4. Avoid biasing Claude Design toward existing wireframes — let fresh design thinking lead, with existing artifacts introduced selectively in iteration.
5. Stay coherent with the existing static-HTML-tools-on-GitHub-Pages architecture.

## Goals

- Define a repeatable, chunked workflow for designing each Hob surface.
- Produce a single source-of-truth Design Kernel that drives Claude Design's organization-level design system.
- Ship a brief template and capture pattern that scales to ~11 surfaces without context-window bloat per chunk.
- Sequence the work so the highest-leverage missing surfaces are designed first.
- Build a feedback loop so the kernel improves as surfaces are designed.

## Non-goals

- Building a full atomic-design component library in markdown. Claude Design extracts patterns from kernel + codebase pointers; over-documenting components is busywork that decays.
- Replacing or migrating the existing `.pen` wireframe file or PNG wireframes. They become per-surface inputs when (and only when) needed.
- Specifying implementation. Each surface design produces a handoff bundle; turning that into HTML in `/site/` is a separate work item with its own plan.
- Designing for platforms outside the existing static-HTML + atproto PDS architecture.

## Architecture

### Repository structure

```text
docs/design/
├── README.md                       # Framework explainer + sequencing
├── _kernel/                        # Source material for Claude Design org onboarding
│   ├── brand-voice.md              # "Calm friend in the kitchen"; what we never say
│   ├── design-principles.md        # 11 principles as design directives
│   ├── micro-interactions.md       # Behavioral spec only — no visual prescriptions
│   ├── design-intent.md            # Color/type/spacing/motion intent statements
│   └── codebase-pointers.md        # Subdirs to link in Claude Design (data/structure only)
├── _template/
│   └── brief.md                    # The per-surface brief template
├── _validation/
│   └── (populated in Phase 3)
└── <surface>/                      # One folder per IA surface
    ├── brief.md
    ├── inputs/
    │   ├── persona-excerpt.md
    │   ├── journey-moment.md
    │   ├── scenarios.md            # Curated subset, links back to docs/scenarios/
    │   └── wireframe-ref.png       # OPTIONAL — only if a behavior cannot be described in words
    ├── outputs/
    │   ├── share-link.md           # Org-internal Claude Design URL + last-updated timestamp
    │   ├── screenshots/
    │   │   ├── 01-primary.png
    │   │   ├── 02-empty.png
    │   │   └── manifest.md         # Captions for each screenshot
    │   ├── handoff/                # Bundle from "Handoff to Claude Code" export
    │   └── chat-excerpts.md        # Decisions worth remembering (not the full chat)
    └── decisions.md                # Kept / discarded / open questions / kernel feedback
```

### The Design Kernel

The kernel teaches Claude Design how the product should *feel and behave*, not what it should *look like*. Visual treatment is Claude Design's job. We anchor with intent and constraints.

**`brand-voice.md`** — Voice ("calm friend in the kitchen"), the invisible-accommodation principle, the explicit "what we never say" list (no "expired", "missed", "failed", "you haven't…", no clinical language, no diagnosis names), conventions for progress acknowledgment.

**`design-principles.md`** — The 11 principles already extracted at the bottom of `docs/strategy/journey-maps.md`, restated as design directives:

1. One thing at a time
2. The app watches what you can't
3. Resumable state
4. Warmth over efficiency
5. Show, don't configure
6. Fill idle time
7. Forgiveness over compliance
8. Constraint is the feature
9. Zero-friction handoff
10. Graceful degradation
11. Fresh start, not failure state

**`micro-interactions.md`** — Behavioral spec only for the five reusable patterns: focus card, awareness bar, timer (with audio alarm), phase card, suggestion chip. Each pattern documented with: purpose, structure, states, accessibility expectations (keyboard, screen reader, reduced-motion), where it appears. **No visual prescriptions, no example screenshots.** Claude Design decides how a focus card *looks*; we decide what a focus card *is*.

**`design-intent.md`** — Color, typography, spacing, radius, motion stated as *intent*, not extracted CSS values: "warm and unclinical, never sterile-white"; "type scale optimized for kitchen-distance reading on a propped phone"; "motion subdued by default, respects `prefers-reduced-motion`"; "high contrast in cooking view (one-handed, possibly wet hands, glance-readable)"; "touch targets sized for kitchen use".

**`codebase-pointers.md`** — Critical given Claude Design's "link subdirs, not monorepo" limitation. Explicitly:

- **Link**: `/packages/build/recipes/` (recipe JSON shape examples), `/lexicons/` (atproto type definitions).
- **Do not link**: `/site/` (would bias against fresh design thinking), repo root, `node_modules`, `tmp/`.

**Reference screenshots** — Deliberately not in the kernel. No org-level visual anchoring. Existing wireframes and working-HTML screenshots are introduced selectively in per-surface `inputs/` only when a behavior cannot be described in words.

### The Surface Brief

One file per surface (`docs/design/<surface>/brief.md`), pasted as the opening message to a Claude Design project. Kept under ~300 lines.

**Template structure** (`docs/design/_template/brief.md`):

```markdown
# Brief: <Surface name>

## What we're designing
One paragraph. Surface's purpose, position in IA, user moment it serves.

## Who it's for
The 1-2 personas this surface primarily serves (not all 4).
Link to docs/strategy/personas.md, don't paste.

## The user moment
The journey beat this surface owns.
Link to the relevant docs/strategy/journey-maps.md row(s).

## Behavior to design (state matrix)
- Empty / first-use
- Primary / loaded
- Loading
- Error
- Edge cases specific to this surface

## Behavioral rules
Inline-quote (or link) the EARS rules and Gherkin scenarios from docs/scenarios/<domain>/.
Don't restate — quote the source.

## Constraints
- Responsiveness target
- A11y requirements (keyboard, screen reader, reduced-motion)
- Performance constraint if any
- "What we never say" reminders specific to this surface

## Success criteria
3-5 bullets. "A user in <persona> situation, opening this surface,
can <action> in <time/taps> without <friction>."

## Ask Claude Design to
- Produce N variations of <specific aspect>
- Review against <specific principle>
- Show responsive behavior at <breakpoints>

## Wireframe reference (optional)
Default: don't attach. Attach only if a behavior cannot be described in words alone.
```

The accompanying `inputs/` folder holds the linked source files (persona excerpt, journey row, scenario file). Curated, not the full strategy doc dump.

### Workflow (per-surface execution loop)

1. Pick next surface from sequencing rule.
2. AI session in this repo:
   1. Author `docs/design/<surface>/brief.md` from kernel + scenarios + journey.
   2. Curate `docs/design/<surface>/inputs/` (only what's actually needed).
   3. Open a PR with brief + inputs for human review.
3. Human review: brief is the contract. Approved or revised.
4. AI session opens Claude Design (separate tool):
   1. New project; paste `brief.md` as opening message; attach `inputs/`.
   2. First-pass design generated; capture share link.
   3. Iterate: ask for variations, request reviews, refine.
   4. Export: "Handoff to Claude Code" + screenshots + share link.
5. AI session in this repo:
   1. Drop handoff bundle into `docs/design/<surface>/outputs/handoff/`.
   2. Capture screenshots, share link, chat excerpts.
   3. Write `decisions.md` (what was kept, what was discarded, open questions, kernel feedback).
   4. PR for human review of the design itself.
6. Implementation pass — separate work item, separate plan:
   - Take handoff bundle, integrate into `/site/` following existing static-HTML conventions.
   - Reference brief + behavioral scenarios in implementation PR.

Steps 2, 4, 5 are AI-led with you reviewing. Step 3 and the human review at end of step 5 are the gates.

### The capture pattern

What `docs/design/<surface>/outputs/` contains after a design session:

- **`share-link.md`** — One line: org-internal Claude Design URL + last-updated timestamp. Future sessions re-open and iterate from this URL.
- **`screenshots/`** — Numbered PNGs of every meaningful state (`01-primary.png`, `02-empty.png`, etc.). Captioned in `manifest.md`.
- **`handoff/`** — Raw handoff bundle from Claude Design. Untouched.
- **`chat-excerpts.md`** — Quoted excerpts where Claude Design explained a decision worth remembering. Not the full chat — only what helps future-us understand the *why*.
- **`decisions.md`** — One page, sectioned:
  - What we kept
  - What we discarded
  - Open questions
  - **What changed about the brief or kernel as a result** ← feedback loop

The last bullet is load-bearing: if a surface design exposes a missing principle or a wrong interaction primitive, we update the kernel before doing the next surface. Otherwise the kernel rots.

### Sequencing rule

#### Phase 0 — Kernel (do first, one focused session)

- All five kernel files drafted.
- Feed into Claude Design organization onboarding.
- Run a quick test prompt (e.g., "Design a sample card showing a recipe title, time, and tags") and iterate the kernel until output feels Hob-aligned.

#### Phase 1 — Missing surfaces in JTBD priority order

These have scenarios but no wireframe. Numbered 1-5 of 11 across the full sequence.

1. Suggestion engine (Decide stage — highest 6pm leverage, Journey 6)
2. Multi-recipe `/cook.html` (Orchestration — Journey 7)
3. Partner track `/partner.html` (asymmetric handoff)
4. Import preview & flow (onboarding funnel — Journey 10)
5. Energy-tier UI (component within suggestion engine — may roll into #1)

#### Phase 2 — Existing surfaces refresh

These have wireframes and/or working HTML, may benefit from kernel-aligned redesign. Numbered 6-11 of 11.

1. Pool planner — `02-pool-planner-v2.png` exists; high priority within Phase 2 because it owns the Wednesday Gap (Journey 5)
2. Catalog hub (`/index.html`)
3. Recipe overview
4. Cooking view (focus card + awareness bar in their final form)
5. Web checklist (`/checklist.html`)
6. Grocery list (`/list.html`)

#### Phase 3 — Validation

- Walk each of the 10 journey maps through the resulting designs.
- Output: `docs/design/_validation/journey-walkthroughs.md` documenting where each journey works/breaks across the new designs.
- Update vision-status scenarios to current-status where the design exists.
- Add accessibility scenarios for vision surfaces that newly have designs.

### Scope of v1 (this framework spec ships with)

- Repository skeleton created: `docs/design/README.md`, `_kernel/`, `_template/brief.md`, empty `<surface>/` folders for the Phase 1 list.
- This README explaining the framework.
- The five kernel files **drafted** (Phase 0 work).
- One pilot surface **briefed end-to-end** (Suggestion engine) — worked example before scaling.

We do not pre-author all 11 surface briefs. The framework is the methodology, not the output.

## Data flow

```text
docs/strategy/* ─┐
docs/scenarios/* ┼─→ AI authors brief.md + curates inputs/
                 │       │
                 │       └─→ Claude Design project (separate tool)
                 │              ↓
                 │           iterate, generate variations
                 │              ↓
                 │           "Handoff to Claude Code" export
                 │              ↓
                 └─→ docs/design/<surface>/outputs/
                            ↓
                       decisions.md feedback ──→ updates _kernel/* if needed
                            ↓
                       implementation pass (separate plan) ──→ /site/
```

## Open questions

- **Variation discipline.** Claude Design supports "save and try a different direction." How many variations is the right ceiling per surface before we converge? Soft default: ask for 2-3 variations on the primary state, converge on one for state-matrix completion. Revisit after pilot.
- **Cross-surface visual consistency.** Phase 2 surfaces refreshed against the same kernel may diverge from each other if designed in isolation. The Phase 3 validation pass catches journey-level breaks; do we also need a "visual harmony" pass across surfaces? Defer until after Phase 1 — too early to know.
- **Pencil `.pen` file.** Existing `docs/wireframes/pencil-wireframes.pen` has all v2 wireframes. Do we keep maintaining it post-framework? Recommendation: archive it as historical reference, do not maintain in parallel. Decision deferred until Phase 2.
- **Implementation handoff format.** Claude Design's handoff bundle format will dictate how cleanly it integrates with `/site/`'s static-HTML conventions. We learn this from the pilot (Suggestion engine) and document the integration pattern in `docs/design/README.md` after.

## Risk and mitigation

| Risk | Mitigation |
| --- | --- |
| Kernel rots as surfaces are designed and lessons aren't fed back | `decisions.md` feedback loop is mandatory; first item in Phase 3 is a kernel reconciliation pass |
| Claude Design output drifts from existing static-HTML architecture | Pilot (Suggestion engine) tests the handoff path end-to-end before scaling |
| Per-surface briefs duplicate strategy content and drift from source | Briefs *link*, not *paste*. `inputs/` curates excerpts but cites the source path in each file's frontmatter |
| Phase 1 surface designs lack accessibility coverage (vision scenarios don't have a11y scenarios yet) | Brief template requires explicit a11y constraints; the surface designer (AI) writes the missing accessibility scenario into `docs/scenarios/accessibility/` as part of step 5 |
| Over-documentation in the kernel slows everything down | Kernel files capped: brand-voice and design-intent under 200 lines each; principles is a single referenceable list; micro-interactions one section per pattern |

## Success criteria

This framework is working if, after Phase 1:

- A new surface can go from "scenarios written" to "design briefed" in a single AI session that doesn't need to load the full strategy stack.
- Each surface has a single discoverable folder containing brief, inputs, design outputs, and decisions.
- The kernel has been updated at least twice based on `decisions.md` feedback (proves the loop works).
- The pilot surface (Suggestion engine) produced a handoff bundle that the implementation pass merged into `/site/` without re-designing.
- Phase 3 journey walkthroughs identify breaks at the design layer (not at the strategy layer or the implementation layer), and those breaks point to specific surfaces to revise.
