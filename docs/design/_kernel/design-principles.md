# Design principles

Eleven principles distilled from Hob's journey maps. Each is a design directive: when in doubt during a Claude Design session, ask "does this respect principle N?" The source evidence lives in `docs/strategy/journey-maps.md`.

## How to use this file

Each principle below has three parts:

- **Directive** — imperative; what every design must do.
- **Pain** — one sentence drawn from the journey maps explaining what goes wrong without this principle.
- **Violation** — one concrete example of drift so you can recognise it in a design review.

---

## 1. One thing at a time

- **Directive:** Show one task on screen during execution. Never two. Never a list.
- **Pain:** Wall-of-text recipes trigger overwhelm at the cognitive lowest point of the day.
- **Violation:** A cooking screen that lists steps 6, 7, and 8 in a sidebar while step 5 is active.

## 2. The app watches what you can't

- **Directive:** Surface any time-based or state-based thing that can be lost track of — a pot on the stove, a step in progress, a timer running — even when the user has switched contexts.
- **Pain:** Time blindness scorches the sauce; the user has no external reminder that something is happening on the hob.
- **Violation:** A timer that only shows on the step that started it and disappears when the user navigates away.

## 3. Resumable state

- **Directive:** Restore every screen the user might be interrupted on to exactly where they were, with no "are you sure?" friction.
- **Pain:** Kids interrupt cooking; the app must be picked up and put down many times per session without losing progress.
- **Violation:** A cooking session that resets to step 1 when the app is reopened mid-recipe.

## 4. Warmth over efficiency

- **Directive:** Choose the option that lowers emotional load over the option that saves clicks.
- **Pain:** The emotional job is "feel competent", not "cook faster" — efficiency framing makes users feel judged.
- **Violation:** A "Streak: 3 days!" badge in the catalog header that highlights missed days.

## 5. Show, don't configure

- **Directive:** Deliver value on first open with zero configuration — no modals, no preference screens, no setup required.
- **Pain:** The "Want To But Can't" persona will never read instructions or fill in a settings form before seeing the app.
- **Violation:** An onboarding modal asking for cuisine preferences before showing the recipe catalog.

## 6. Fill idle time

- **Directive:** Use wait windows (simmer, bake, marinate) to suggest a useful adjacent action — never to push notifications or upsells.
- **Pain:** Idle time is either lost entirely or weaponised by other apps as an advertising surface.
- **Violation:** A "While you wait, rate this recipe!" prompt displayed during a 30-minute simmer timer.

## 7. Forgiveness over compliance

- **Directive:** Make skipping, abandoning, or rearranging anything a zero-friction action that produces no judgment-laden state.
- **Pain:** Rigid plans cascade into total abandonment when the user's brain rejects today's planned meal on a Wednesday.
- **Violation:** A "missed meal" badge or strikethrough on yesterday's planned dinner.

## 8. Constraint is the feature

- **Directive:** Where decisions cause paralysis, surface fewer options, never more — three suggestions, not a catalog; two energy tiers, not a slider.
- **Pain:** Decision paralysis at 6pm with infinite options is indistinguishable from having no app at all.
- **Violation:** A "show me 12 more options" link displayed below the three meal suggestions.

## 9. Zero-friction handoff

- **Directive:** Anything shared with another person must open in a phone browser with no install, account, or login required.
- **Pain:** The partner in an asymmetric household won't install another app to see a shopping list.
- **Violation:** A shared shopping list that requires the recipient to create an account before viewing it.

## 10. Graceful degradation

- **Directive:** Make every tool work on its own; no tool's value may depend on another tool being actively used.
- **Pain:** When users abandon part of the ecosystem, dependent features cascade into uselessness and the whole app feels broken.
- **Violation:** A cooking view that shows "Add this to your plan first" before allowing the user to start cooking.

## 11. Fresh start, not failure state

- **Directive:** Show a fresh, inviting state when the app is reopened after absence — never expired meals, missed plans, or guilt-laden notifications.
- **Pain:** Apps that punish absence get deleted; a returning user is already anxious about the gap.
- **Violation:** A red banner on reopen reading "You haven't planned this week."

---

## Cross-principle tensions

**"Show, don't configure" (5) vs. "The app watches what you can't" (2)**

Both principles must hold simultaneously. The resolution: watch-behaviors (background timers, awareness bar) are activated automatically the moment a user starts a step — no toggle, no opt-in, no settings page. Principle 5 wins on setup; principle 2 wins on runtime behavior. There is no tension during execution because neither requires configuration.

**"Fill idle time" (6) vs. "One thing at a time" (1)**

Secondary task suggestions appear *only* when the primary task is paused (a timer is running and the step card is in waiting state). They never appear alongside an active step. Principle 1 wins whenever the user is actively executing; principle 6 activates only in the gap. They never compete.

**"Constraint is the feature" (8) vs. "Forgiveness over compliance" (7)**

Constraint applies to the *options shown* — three suggestions surface, not a full catalog. Forgiveness applies to *user actions* — the user may press "not these" as many times as they like and the app regenerates without friction or judgment. Principle 8 controls the initial surface area; principle 7 controls what happens after the user pushes back. Neither overrides the other.
