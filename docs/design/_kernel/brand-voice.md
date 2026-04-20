# Brand voice

This file defines how Hob speaks. Every micro-copy decision — labels, progress text, notifications, empty states — references it.

---

## Core stance

Hob is a calm presence in the kitchen: specific, useful, and unremarkable. It delivers the next fact the user needs and gets out of the way. It does not evaluate, remind, encourage, or diagnose. It does not know what kind of day the user had. It is not clinical, not chirpy, and not coachy.

---

## What we never say

- **"expired", "missed", "failed", "overdue"** — turns the app into a judge. Meals that haven't been cooked are _remaining_, not failed.
- **"you haven't…"** in any form — frames absence as neglect. Absence is normal, not a problem.
- **Diagnosis names** (ADHD, executive dysfunction, neurodivergent) — Hob is an invisible accommodation, not a clinical tool. Name the experience, not the condition.
- **"you should", "you need to", "don't forget"** — the user already has people telling them what to do. Hob is not one of them.
- **"great job!", "amazing!", "you crushed it!"** — performative praise. The user knows whether the meal went well.
- **Streaks, scores, badges, or any gamification language** — these turn cooking into a compliance game. Hob is not a habit tracker.
- **"let's…" prefixes** — implies the app is cooking alongside the user. The user is cooking; the app is informing.
- **Notification copy that nags** — "you haven't planned this week", "your streak is at risk", "don't lose your progress." These join the pile of things demanding attention.

---

## What we say instead

| Not this | Use this |
|---|---|
| "You missed Wednesday's meal." | "Three meals remaining this week." |
| "You haven't planned yet." | (no notification) or "20-minute dinner idea?" |
| "Great job finishing!" | "Step 8 of 12 — sauce is building." |
| "Don't forget to check the sauce." | "Sauce timer: 4:30 remaining." |
| "Time's up!" | "Sauce is ready." |
| "You failed to complete this recipe." | "Pick up where you left off?" |
| "Your plan expired." | "What sounds good tonight?" |
| "Streak: 0 days" | (no streak display) |
| "Thanks for helping!" (shopper link header) | "Shopping list" |
| "You haven't cooked in a while." | (silence; let the user return on their terms) |

---

## Tone qualities

- **Quiet** — the app informs only when value is delivered. It does not cheer, remind, or prompt unless there is a specific fact the user needs right now. The cooking view has no celebration between steps. The timer fires; the next step appears.
- **Warm** — acknowledges effort indirectly through specificity ("sauce is building" signals the app is paying attention) without saccharine affirmation.
- **Specific** — "29:45 left on the simmer" beats "almost done". "Step 6 of 12" beats "you're doing great". Numbers and states are more useful than evaluations.
- **Trustworthy** — timer fires when the step ends. List contains what the recipe needs. Trust is built through accuracy, not warmth.
- **Permissive** — "not tonight" is a valid answer. Zombie mode is a valid cooking mode. Takeout night is a valid plan entry. The app never implies a right answer.

---

## Progress acknowledgment

Progress copy is present-tense, factual, and glance-readable. It describes the state of the food or the cook's position in the task, not an evaluation of performance.

- "Step 3 of 9"
- "Step 6 of 12 — sauce is building."
- "Pasta water boiling. Sauce simmering."
- "Both pots running — 12:30 on the sauce."
- "Prep done. Cook phase starts now."
- "Bake timer: 18:00. Salad next."

The completion state acknowledges the meal, not the user: "Spaghetti bolognese done." — not "You did it!"

The completion state may optionally surface a reentry point — "Lasagne next?" if it's in the pool — but never a performance review.

---

## Handoff voice

When Hob passes work to another person (partner, shopper), it does not apologize for the handoff or thank the recipient for helping. The web checklist opens to "Shopping list" — not "Thanks for helping!" or "Here's what [name] needs." The shopper does not need context about the app or the planner. The list is the product. Instructions are minimal and direct: aisle headers, item names, recipe context on tap.

---

## Voice across surfaces

**Catalog / hub** — Quiet. No "Discover", "Trending", or "You might like" CTAs. Titles and times only. Let the recipes speak.

**Suggestion engine** — Exactly 3 options. No framing like "we picked these for you" or "based on your preferences." Just the names, times, and energy tiers. The constraint is the feature.

**Cooking view** — Present-tense, factual, glance-readable. Step counter and timer are the primary communication channel. No cheerleading between steps.

**Pool planner** — Meals that haven't been cooked are "remaining." No urgency language except perishable sorting ("fish first — use within 2 days"). Days are never assigned by default, so nothing can be "late."

On reopen after absence: the pool shows as-is with no banner, no count of skipped nights, no "you haven't cooked since [date]." Perishable sorting updates silently. If the pool is empty, "What sounds good tonight?" — not "Your pool is empty."

**Low-energy / Zombie mode** — Permission-giving, never apologetic. "Five decisions or fewer." "Scrambled eggs counts." The copy validates minimal cooking as real cooking. It does not explain why the mode exists or imply the user should feel good about using it.

The transition into zombie mode is a **prompt, not a screen** — one short line appears inline where the suggestion chips were: "Really low energy? Here are meals with 5 or fewer decisions." The 3 zombie chips appear below that prompt, still on the hub. No page navigation, no modal, no "Entering zombie mode" affordance. The prompt is the register; the chips follow.

**Web checklist (shopper)** — Instructional and minimal. The shopper has one job. Headers are aisle names. Items are ingredient names. Context appears only on tap. No branding beyond the page title. The shopper does not need to know Hob exists.

**Empty states and absence** — Never accusatory. "What sounds good tonight?" not "You haven't planned." On reopen after absence: show the catalog or pool as-is — no banners, no summaries of what was skipped, no welcome-back messaging. The app was waiting, not counting.
