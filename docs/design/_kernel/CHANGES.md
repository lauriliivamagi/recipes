# Kernel changelog

A row per change to any file under `_kernel/`. Each entry records the surface that surfaced the need, the file changed, what changed, and why.

This file is mandatory: the framework's success criterion says the kernel must be updated at least twice based on per-surface `decisions.md` feedback. Without this log, drift is invisible.

## Format

```markdown
| Date | Surface | File | Change | Why |
| --- | --- | --- | --- | --- |
| 2026-04-20 | (initial) | all | initial drafts | first pass at kernel |
```

## Log

| Date | Surface | File | Change | Why |
| --- | --- | --- | --- | --- |
| 2026-04-20 | (initial) | all | initial drafts | First pass; the framework's bootstrap. |
| 2026-04-20 | suggestion-engine | `micro-interactions.md` | KF-1: Added `zombie-prompt` and `zombie-chips` states to Suggestion chip pattern; rewrote "Not tonight" behavior as an explicit two-step flow. | First Claude Design session shortcut "Not tonight" to a filter switch instead of the two-step prompt → chips flow. The kernel was too easily misread. |
| 2026-04-20 | suggestion-engine | `brand-voice.md` | KF-2: Added clarification to "Low-energy / Zombie mode" that the transition is a prompt inline on the hub, not a separate screen. | Implementation placed the zombie path behind a filter toggle; the copy register and its inline placement need to travel together in the voice doc. |
| 2026-04-20 | suggestion-engine | `design-intent.md` | KF-3: Tightened 44px touch-target floor to explicitly cover chips, pills, and icon buttons. | Handoff `.chip-btn` shipped at 36px min-height; the floor was in the doc but applied only to "primary CTAs" in practice. |
| 2026-04-20 | suggestion-engine | `micro-interactions.md` | KF-4: Marked audio alarm as primary/non-negotiable in Timer pattern; reframed visual alarm as fallback for degraded environments. | Handoff shipped visual-only "Done!" state. The kernel said "alarm plays" but did not assert audio as the primary signal, leaving room for the shortcut. |
| 2026-04-20 | suggestion-engine | `micro-interactions.md` | KF-5: Upgraded awareness-bar pill navigation from "open question / intended behavior" to explicit requirement. | Handoff stubbed the click handler as "could jump to step." The cooking-view feedback loop depends on this navigation; no room for optionality. |
