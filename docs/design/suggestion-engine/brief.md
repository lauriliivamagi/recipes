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

- **No pool, no theme set** — first-time-user state. The suggestion section may not appear at all, or may appear with a different fallback (designer to decide and justify).
- **Pool active, 3+ matching meals** — primary state. Three suggestion chips, energy filter visible.
- **Pool active, fewer than 3 matches** — fewer chips, no padding, no full-catalog fallback.
- **All 3 dismissed (`Not these`)** — three new chips slide in. Track dismissed across the session.
- **Theme night active** — chips filtered by today's cuisine theme.
- **Zombie mode** — accessed via "Not tonight" → "Really low energy?" path. Curated subset, 3 options, even simpler.
- **No suggestions possible** — graceful empty state ("Nothing matches today's filters. [Adjust] / [Browse all]"). This is the only place the full catalog can be reached.

## Behavioral rules

Authoritative source: `inputs/scenarios.md` (curated from [docs/scenarios/decide/](../../scenarios/decide/)).

Key rules to honor (drawn from the energy-aware-suggestions, zombie-mode, and theme-night-rotation files — quoted verbatim in `inputs/scenarios.md`):

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
