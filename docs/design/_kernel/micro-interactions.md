# Micro-interactions

Five reusable behavioral patterns the entire product is built around. This file specifies what each pattern *does*, not what it *looks like*. Visual treatment is for Claude Design to decide; behavior is non-negotiable.

Source material: this file synthesizes patterns documented behaviorally in [docs/scenarios/](../../scenarios/) and [docs/strategy/journey-maps.md](../../strategy/journey-maps.md). When in doubt, those sources win.

---

## Pattern: Focus card

**Purpose.** Show the cook exactly one recipe step at a time, with all the context needed to complete that step and nothing else.

**Where it appears.** Cooking view throughout the active cooking session. See [docs/scenarios/cooking/step-navigation.md](../../scenarios/cooking/step-navigation.md).

**Structural elements.**
- Step action text (the verb-led instruction)
- Ingredients inline, scaled to the current serving count, with quantities
- Equipment required for this step
- Heat level where applicable
- Step counter in the form "Step N of M"
- Detail or clarifying notes when present in the recipe

**States.**
- `idle` — cooking view has been entered; focus card displays step 1
- `active` — user is on any step between 1 and M; step content is fully visible; Previous/Next enabled as applicable
- `completed` — user has advanced past the last step; recipe is finished

**Behavior.**
- Entering cooking view always opens step 1.
- Next advances one step; Previous returns one step.
- Previous is disabled on step 1.
- Pressing Next on the last step does not advance past it; the system signals recipe completion instead.
- The step counter updates on every navigation event.
- Navigating away from cooking view and returning within the same session restores the exact step the user was on. The back/forward state is resumable after real-world interruptions.
- Only one step is visible at a time; no scrolling through multiple steps.
- Right arrow key advances; left arrow key returns. See keyboard section below.

**Accessibility.**
- Keyboard: right arrow advances to next step; left arrow returns to previous step; Previous/Next buttons are focusable and activatable; Escape exits cooking view to recipe overview.
- Screen reader: announces the full focus card content on every step change via an ARIA live region — action, ingredients, equipment. Step counter is announced as "Step N of M" on navigation.
- Reduced motion: step transitions use an instant content swap; no slide or crossfade animation when `prefers-reduced-motion: reduce` is active.

**What it must never do.**
- Show more than one step at a time.
- Separate ingredients from the step that uses them (no separate ingredient list screen during cooking).
- Lose the current step position across navigation within the session.
- Advance automatically without user input.

---

## Pattern: Awareness bar

**Purpose.** Keep the cook informed of every running timer across all steps without requiring them to leave the current step.

**Where it appears.** Cooking view, persistent across all steps while any timer is running. Also surfaces in multi-recipe mode. See [docs/scenarios/cooking/parallel-tasks.md](../../scenarios/cooking/parallel-tasks.md).

**Structural elements.**
- A list of active timer pills, one per running timer
- Each pill contains: the operation's label and the remaining time in M:SS format
- When a timer completes, its pill shows the label and a "Done!" indicator

**States.**
- `empty` — no timers running; awareness bar is not shown
- `one-timer` — exactly one timer running; bar shows a single pill
- `multiple-timers` — two or more timers running concurrently; bar shows one pill per timer
- `timer-done` — one or more timers have reached zero; their pills show the completion indicator until dismissed

**Behavior.**
- The bar appears as soon as any timer starts and is present on every subsequent step as long as at least one timer is running.
- Each pill's countdown updates every second.
- When a timer reaches zero, its pill transitions to the "Done!" state; it does not disappear until the alarm is acknowledged.
- Tapping a pill navigates to the step that owns that timer. (This behavior is documented as an open question in the scenarios; treat as intended behavior unless explicitly reversed.)
- The bar clears automatically when the last active timer is dismissed.
- In multi-recipe mode, pills are labeled by recipe name to distinguish concurrent timers across recipes.
- Updates are instant under reduced motion — no animation on pill updates.

**Accessibility.**
- Keyboard: each pill is reachable via the tab order; the tab sequence in cooking view is: step content → timer controls → navigation controls → awareness bar.
- Screen reader: the awareness bar is a landmark region; navigating to it reads each pill's label and remaining time, e.g., "Simmer sauce: 5:30 remaining, Boil pasta: 2:15 remaining". Timer completion is announced via an ARIA live region: "[label] timer complete".
- Reduced motion: pill values update instantly with no transition animation when `prefers-reduced-motion: reduce` is active.

**What it must never do.**
- Disappear from view while a timer is still running.
- Show timers from a different session or recipe without a label distinguishing the source.
- Auto-dismiss a "Done!" pill without user acknowledgment.

---

## Pattern: Timer

**Purpose.** Count down a single cooking operation's duration and alarm when time is up, so the cook does not have to watch the clock.

**Where it appears.** Embedded in individual cooking-view steps that contain passive operations. See [docs/scenarios/cooking/timers.md](../../scenarios/cooking/timers.md) and [docs/scenarios/cooking/timer-failure-modes.md](../../scenarios/cooking/timer-failure-modes.md). Reference state model: [docs/wireframes/analog-timer.machine.js](../../wireframes/analog-timer.machine.js).

**Structural elements.**
- Label identifying the operation (e.g., "Simmer sauce")
- Total duration
- Remaining time in M:SS format
- Start control
- Pause/resume control
- Cancel/reset control
- Extend controls (e.g., "+1 min") available while running or after alarm
- Elapsed overshoot display in +M:SS format after zero

**States.**
- `idle` — timer not yet started; duration is set; awaiting user action
- `running` — counting down; remaining time decrements every second; ticker active
- `paused` — countdown suspended; remaining time preserved; awaiting resume or reset
- `done` (ringing) — remaining time has reached zero; alarm active; overshoot counting in +M:SS; awaiting dismiss
- `dismissed` — alarm acknowledged; timer returns to idle (reset) or is removed

**Behavior.**
- The timer starts only on explicit user action; it never starts automatically.
- While running, the display updates every second.
- When the user pauses, the countdown halts and resumes exactly where it stopped.
- When the countdown reaches zero, an audio alarm plays.
- The alarm continues until the user explicitly dismisses it.
- After zero, overshoot time is displayed in +M:SS format (e.g., "+1:00", "+5:30") so the cook knows how far past the target they are.
- When two or more timers expire within 30 seconds of each other, their alarms are staggered — not overlaid simultaneously.
- If audio playback is blocked (browser permission denied, silent mode, or hardware restriction), the system displays a persistent visual alarm that remains until dismissed.
- The timer survives navigating between steps within the session; it continues running in the background using a Web Worker.
- If the browser tab goes to the background or the screen locks, the timer reconciles elapsed real time on return so remaining time stays accurate.
- If the page is refreshed during a running timer, the timer resumes with correct remaining time based on real elapsed time.

**Accessibility.**
- Keyboard: the timer button (start/cancel) is focusable; pressing Space toggles the timer when focused. Dismiss is also keyboard-activatable.
- Screen reader: announces remaining time and label when the timer starts; announces "[label] timer complete" via an ARIA live region when the alarm fires; announces remaining time when the user cancels. All timer controls carry ARIA labels.
- Reduced motion: the countdown display still updates every second (functional, not decorative); no pulsing, bouncing, or sweep animation accompanies the countdown when `prefers-reduced-motion: reduce` is active.

**What it must never do.**
- Start automatically without user action.
- Allow the alarm to be silently swallowed (audio blocked with no visual fallback).
- Lose running state when the user navigates to another step.
- Overlay two alarm notifications simultaneously.

---

## Pattern: Phase card

**Purpose.** Give the cook a scannable summary of a recipe's structure — phases, times, and what gets produced — before they start cooking.

**Where it appears.** Recipe overview screen. See [docs/scenarios/overview/recipe-overview.md](../../scenarios/overview/recipe-overview.md).

**Structural elements.**
- Phase label (e.g., Prep, Cook, Simmer, Finish)
- Total wall-clock time for the phase
- Count of steps within the phase
- Sub-products produced by the phase (e.g., "Bolognese Sauce", "Cooked Pasta") when present

**States.**
- `relaxed` — all prep operations grouped upfront; phases shown in sequential order; total time reflects sequential execution
- `optimized` — prep operations distributed into idle cooking windows; phases rearranged to reflect the parallel schedule; total time reflects optimized execution
- `error` — recipe DAG cannot be resolved (e.g., circular dependency or missing step data); phase cards cannot be rendered

**Behavior.**
- The overview defaults to Relaxed mode on first visit.
- Toggling the mode rearranges phase cards and updates time badges to reflect the new schedule; total time changes accordingly (e.g., 75 min relaxed vs 62 min optimized).
- Tapping a phase card expands it to show the operations within that phase.
- Tapping "Start Cooking" on a phase card enters cooking view at the first step of that phase.
- Tapping a top-level "Start Cooking" action (not phase-specific) enters cooking view at step 1.
- In error state, the system does not attempt to render partial or incorrect phase cards; it surfaces the error clearly so the user is not guided into a broken cooking flow.

**Accessibility.**
- Keyboard: each phase card is focusable; expand and "Start Cooking" actions are keyboard-activatable; the mode toggle is keyboard-operable and announces the new mode to screen readers.
- Screen reader: describes each phase with its label, total time, and step count, e.g., "Prep phase, 15 minutes, 4 steps". Sub-products announced when present. Mode toggle announces "Switched to Optimized mode" or "Switched to Relaxed mode".
- Reduced motion: mode toggle rearranges phase cards with an instant layout change; no slide or animated transition when `prefers-reduced-motion: reduce` is active.

**What it must never do.**
- Show inaccurate time totals (times must reflect the actual selected mode).
- Enter cooking view with a corrupt or unresolvable step order.
- Require mode selection before the user can start cooking (Relaxed is always the safe default).

---

## Pattern: Suggestion chip

**Purpose.** Surface exactly three recipe options filtered to the cook's current energy level so they can decide what to make without browsing the full catalog.

**Where it appears.** Hub catalog page suggestion section. See [docs/scenarios/decide/energy-aware-suggestions.md](../../scenarios/decide/energy-aware-suggestions.md) and [docs/scenarios/decide/zombie-mode.md](../../scenarios/decide/zombie-mode.md).

**Structural elements.**
- Recipe title
- Total time
- Energy tier label (zombie, moderate, or project)

**States.**
- `empty` — no recipes match the active filters; graceful empty state shown; full catalog is never used as fallback
- `filled` — exactly 3 suggestion chips are displayed
- `all-dismissed` — user has tapped "Not these"; the 3 chips are replaced with 3 new options; dismissed recipes do not reappear in the replacement set

**Behavior.**
- The suggestion screen always shows exactly 3 options or a graceful empty state. The full catalog is never shown as a fallback.
- Tapping a chip navigates directly to that recipe's overview.
- Tapping "Not these" replaces all 3 chips with 3 new options drawn from the catalog, excluding the dismissed set. No commentary or judgment language accompanies the replacement.
- Tapping "Not tonight" exits to the zombie-mode prompt ("Really low energy? Here are meals with 5 or fewer decisions.") and surfaces 3 zombie-tier recipes. Pool-sourced zombie recipes appear before catalog ones.
- Tapping "Not even this tonight" from zombie mode returns the user to the catalog hub with no guilt language and the pool unchanged.
- Suggestions are filtered by the active energy tier and time limit; when the user changes filters, the 3 chips update to match.
- Zombie-tier chips navigate directly to cooking view in Relaxed mode with no mode-selection prompt.

**Accessibility.**
- Keyboard: each chip is a button and is individually focusable and activatable; "Not these" and "Not tonight" are also keyboard-operable.
- Screen reader: each chip announces "Suggestion N of 3, [title], [time], [energy tier]". Tapping "Not these" triggers an announcement of "Showing 3 new suggestions." Tapping "Not tonight" announces entry into zombie mode.
- Reduced motion: no animated transitions between chip sets; replacement is an instant swap when `prefers-reduced-motion: reduce` is active.

**What it must never do.**
- Show more than 3 chips at once.
- Fall back to the full catalog when fewer than 3 matches exist.
- Use language that frames skipping a suggestion as failure ("still looking?", "picky today?", "gave up?").
- Navigate to cooking view without passing through the recipe overview (except for zombie-mode chips, which go directly to cooking view per the zombie-mode scenario).
