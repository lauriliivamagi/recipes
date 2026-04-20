# Decisions — Suggestion engine

Outcome of the first Claude Design session for this surface. Source materials: [`brief.md`](brief.md), kernel files at HEAD, and the handoff bundle at [`outputs/handoff/hob-social-v2/`](outputs/handoff/hob-social-v2/).

Session date: 2026-04-20. Claude Design project: see [`outputs/share-link.md`](outputs/share-link.md) (TODO — paste the share URL when next opening the project).

## Scope note

The brief asked for the Suggestion engine alone. Claude Design delivered three connected surfaces: catalog (with suggestion engine inline), recipe overview (phase cards + Relaxed/Optimized toggle), and cooking view (focus card + ring timer + awareness bar). The overshoot is documented as a learning, not endorsed as the new scope. A second focused session for the zombie-mode prompt sub-flow is recommended before declaring the suggestion engine "designed."

## What we kept

- **Hob brand voice across catalog + completion state.** "What sounds good tonight?", "Three options. No scrolling.", "Spaghetti bolognese done.", "Lasagne next?" — the kernel's voice landed cleanly. The completion state respects the kernel revision that requires "may surface a reentry point — never a performance review."
- **Color palette extraction from `_kernel/design-intent.md`.** Paper #F4EFE6 / ink #2A2521 / clay accent #C96F3E. Three additional palettes (clay, oat, sage) all honor the "warm and unclinical" intent. Light-mode default, dark-mode supported as "calm reading."
- **Type system.** Inter (UI) + Fraunces (display) + JetBrains Mono (numerals with `tnum`). Body 17px, focus action `clamp(30px, 5.5vw, 48px)`. Matches the kernel's "type scale optimized for kitchen-distance reading" intent.
- **Five micro-interaction patterns realized.** Focus card single-step, awareness bar fixed-bottom, timer ring-fill with idle/running/paused/done, phase card with sub-product, suggestion chip with energy-tier dot.
- **Reduced-motion support.** `prefers-reduced-motion: reduce` honored at `.focus`, `.awareness-pill`, `.ring-fill`, dot pulse.
- **Accessibility primitives.** `aria-live="polite"` on focus card; `role="progressbar"` on step counter; `aria-label="Suggestion N of 3, ..."` on chips; `role="switch"` on dark-mode toggle.
- **Empty state when filter yields fewer than 3 suggestions.** Honors `_kernel/micro-interactions.md`'s "exactly 3 or empty state, never partial" rule.
- **Token system in CSS variables.** Clean light/dark switching; survives translation to vanilla CSS during implementation.

## What we discarded

- **The "Typical recipe app" copy register** — exposed via the Tweaks panel toggle as a kernel-validation demo, not a real product mode. Would not ship to users. Worth keeping as an internal tool for PM/designer reviews.
- **React+Babel-via-CDN delivery format.** Hob's `/site/` is static HTML / vanilla JS / no build step. The handoff's runtime stack (React 18 + ReactDOM + Babel-standalone via unpkg) doesn't fit. Implementation will translate JSX → vanilla JS or adopt a small build step. Not yet decided which.
- **The Tweaks panel itself.** Designer/PM affordance for prototype iteration. Strips out before any production surface.
- **Awareness-bar pill click handler stub.** Currently `/* could jump to step */`. Either implement the navigation or remove the click affordance — visible cursor on a no-op is misleading.

## Open questions

- **Three-surface design coherence.** Claude Design produced visual harmony across catalog, overview, and cooking by virtue of one session. Phase 2 surfaces (web checklist, partner track, etc.) will be designed in separate sessions against the same kernel. Do they need a "harmony review" pass against this baseline, or does the kernel + screenshots-from-prior-surfaces in `inputs/` suffice? Defer until Phase 2 starts.
- **Pool concept.** The implementation has no notion of a "pool" — every recipe in `data.js` is fair game for suggestions. The brief's resolved "no pool" first-time state ("suggestion section does not render") was not modeled. Either model the pool now or defer to Pool-planner surface design (Phase 2 #1). Recommend deferring; revisit when Pool-planner brief is authored.
- **Three-screen prototype as `/site/` baseline.** The handoff is essentially a complete redesign of catalog + overview + cooking. Implementing three surfaces in one go is a much larger undertaking than implementing the suggestion engine alone. Recommend breaking implementation into three plans (one per surface), starting with the suggestion engine to validate the implementation pattern before scaling.
- **Touch target audit.** `.chip-btn` is 36px min-height; `_kernel/design-intent.md` floor is 44px equivalent. The slip suggests the kernel guidance is not visible enough at design time. Either tighten the floor language or accept that small chips are a kitchen-OK exception. Decide before Phase 2.

## Kernel feedback

These changes should land in `_kernel/` before the next surface session. Each becomes a row in [`_kernel/CHANGES.md`](../_kernel/CHANGES.md).

### KF-1 — `micro-interactions.md`: explicit zombie-mode sub-flow on Suggestion chip

Current Suggestion chip pattern documents "Not these" (replace 3 chips) and "Not tonight" (exit) but does not specify that "Not tonight" triggers a *prompt* phase ("Really low energy? Here are meals with 5 or fewer decisions.") before showing zombie chips. The handoff implementation correctly omitted the prompt because the pattern doc doesn't require it.

**Proposed addition** under "Pattern: Suggestion chip > Behavior":

> "Not tonight" enters a two-step zombie-mode flow: (1) prompt — single permission-giving line ("Really low energy? Here are meals with 5 or fewer decisions.") and (2) zombie chips — exactly 3 curated minimal-decision recipes. Returning to the regular suggestion state requires explicit user action ("Not even this tonight" → catalog, no guilt).

### KF-2 — `brand-voice.md`: clarify zombie-mode prompt is a single line, not a screen

Current "Low-energy / Zombie mode" entry implies the chips just appear. Add: "The transition is a *prompt*, not a separate screen — one short line: 'Really low energy? Here are meals with 5 or fewer decisions.' Then the chips appear inline below."

### KF-3 — `design-intent.md`: tighten chip-style touch target floor

Current intent says "Minimum 44px equivalent; cooking view targets larger." The handoff's `.chip-btn` at 36px min-height suggests the rule isn't catching chip-style elements. Either:

- (a) Change floor to "Minimum 44px equivalent for any tappable element, including chips and pills," or
- (b) Add an exception: "Chips clustered in a horizontal row may use 36px height where they are not the primary action; this trades hit-area for density. Standalone chips remain at 44px."

Recommendation: option (a). Density wins should not override usability floors.

### KF-4 — `micro-interactions.md`: clarify timer audio alarm is non-negotiable

Current Timer pattern says "alarm continues until dismissed" but doesn't explicitly say *audio*. Implementation produced visual-only ringing. Tighten to: "Audio alarm fires at zero (per `docs/scenarios/cooking/timer-failure-modes.md` audio-fallback rules); the visual ringing state is reinforcement, not the primary signal."

### KF-5 — `micro-interactions.md`: awareness bar pill navigation is required, not optional

Current Awareness bar pattern says "tapping a timer focuses its source step." Implementation noted this as optional (`/* could jump to step */`). Either upgrade the kernel from suggestion to requirement, or remove the click affordance from the kernel spec. Recommend upgrade — the cooking-view feedback loop depends on it.

## What changed about the brief

- Add a future state matrix entry for "first-run / no pool" once the Pool-planner surface is designed (currently deferred per Open question above).
- The brief's "Ask Claude Design to" section asked for 3 layout variations. The session produced one layout per surface and exposed variation through the Tweaks panel (palette, typography, density). This worked well in practice — record the pattern as: "Ask for variations via tweakable tokens rather than separate static layouts where possible."

## What's NOT in this decisions.md

- Screenshots — to be captured into [`outputs/screenshots/`](outputs/screenshots/) by opening the prototype, exercising each meaningful state (catalog primary, catalog with Typical-app copy tone, overview Relaxed, overview Optimized, cooking step with simmer timer + awareness bar, completion state) and saving with the manifest convention.
- The Claude Design project share URL — to be filled into [`outputs/share-link.md`](outputs/share-link.md).
- Implementation plan — separate work item under `docs/superpowers/plans/`. Per the framework's outputs-skeleton, implementation is gated on `decisions.md` being reviewed and kernel feedback being applied.
