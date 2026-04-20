# Scenarios — for the Suggestion engine brief

Source: [docs/scenarios/decide/](../../../scenarios/decide/)

This file curates the EARS rules and Gherkin scenarios for the suggestion engine. Quote-only — do not reword. The original scenario files remain authoritative.

---

## From `energy-aware-suggestions.md`

# Feature: Energy-Aware Suggestions

## Status: vision

## Story

As a tired home cook at 6 pm, I want to receive 2–3 recipe suggestions that match my current energy level and available time, so that I can decide what to make without browsing the full catalog.

## Rules

- When the user opens the suggestion screen, the system shall surface exactly 3 recipe options from the catalog
- When the user selects an energy tier (*zombie*, *moderate*, or *project*), the system shall filter suggestions to recipes matching that tier
- When the user sets a time limit, the system shall exclude any recipe whose total time exceeds the stated limit
- When the user dismisses all 3 suggestions, the system shall surface 3 new options without judgment language (no "still looking?" or "picky today?")
- The system shall never surface the full catalog as a fallback — it shall always present a bounded set or an empty state

### Energy Tier Assignment

Energy tiers are derived automatically during recipe import — not manually tagged:

- **Zombie** (≤5 decisions, ≤20 min active time): Recipes where total active steps ≤ 5 and combined active time ≤ 20 minutes. Examples: scrambled eggs, ramen + egg, toast + cheese.
- **Moderate** (6–12 decisions, ≤45 min active time): Most weeknight recipes. The default tier for imported recipes that don't qualify as zombie or project.
- **Project** (>12 decisions or >45 min active time): Multi-phase recipes, holiday dishes, baking projects.

Tier assignment uses two signals from the recipe DAG:

1. **Decision count**: Number of operations requiring active user input (excludes passive steps like simmering, resting, baking).
2. **Active time**: Sum of time estimates for active operations only.

The import pipeline calculates these from the DAG and stores the tier in `recipe.meta.energyTier`. Users can override the tier per recipe if the automatic classification feels wrong.

## Scenarios

### Scenario: Open suggestion screen shows 3 options

- Given the user has at least 3 recipes in their catalog
- When the user opens the suggestion screen
- Then the system shall display exactly 3 recipe cards

### Scenario: Select zombie mode filters to low-effort recipes

- Given the user is on the suggestion screen
- When the user selects the *zombie* energy tier
- Then the system shall display only recipes requiring 5 or fewer decisions
- And each suggested recipe shall be tagged as zombie-tier

### Scenario: Select time limit under 30 minutes

- Given the user is on the suggestion screen
- When the user sets the time limit to "under 30 min"
- Then the system shall exclude all recipes with total time exceeding 30 minutes
- And the 3 displayed recipes shall each have a total time of 30 minutes or less

### Scenario: Dismiss all 3 suggestions and receive 3 new ones

- Given the user is viewing 3 suggestions
- When the user dismisses all 3
- Then the system shall surface 3 new recipe options
- And the dismissed recipes shall not reappear in the new set
- And no judgment or commentary language shall accompany the new suggestions

### Scenario: No recipes match filters shows graceful empty state

- Given the user has selected *zombie* energy tier and a time limit of "under 15 min"
- When no recipes in the catalog match both filters
- Then the system shall display a message: "Nothing matches. Adjust filters?"
- And the system shall not fall back to showing the full catalog

## Questions

- ~~How are recipes tagged with energy tiers — manual tagging, inferred from step count, or AI classification?~~ **Resolved:** Derived automatically from DAG decision count + active time. User can override.
- ~~Should *zombie mode* recipes be a curated subset maintained by the user, or derived automatically?~~ **Resolved:** Derived automatically (≤5 decisions, ≤20 min active). Override available.
- What happens when fewer than 3 recipes match the filters but more than 0 do — show fewer, or relax filters?

## Holdout: false

---

## From `zombie-mode.md`

# Feature: Zombie Mode

## Status: vision

## Story

As a home cook who is too depleted to make decisions, I want the app to offer meals requiring 5 or fewer decisions, so that I can still feed myself without needing to think.

## Rules

- When the user dismisses all 3 initial suggestions and taps "Not tonight," the system shall offer Zombie mode as an escalation: "Really low energy? Here are meals with 5 or fewer decisions."
- Zombie mode shall display exactly 3 recipes from the zombie energy tier (≤5 active decisions, ≤20 min active time)
- Zombie mode recipes shall be drawn from the pool first (if active), then the full catalog
- The system shall never use language implying that zombie-tier meals are inadequate — scrambled eggs is a valid dinner, not a failure
- When the user selects a zombie-mode recipe, the system shall navigate directly to the cooking view in Relaxed mode (no mode selection prompt)
- When no zombie-tier recipes exist in the catalog, the system shall display: "No quick meals saved yet. Import a few 10-minute recipes to have them ready for nights like this."

## Scenarios

### Scenario: User escalates from suggestions to zombie mode

- Given the user has dismissed all 3 initial suggestions
- When the user taps "Not tonight"
- Then the system shall display the zombie mode prompt: "Really low energy? Here are meals with 5 or fewer decisions."
- And the system shall show exactly 3 zombie-tier recipes

### Scenario: Zombie mode draws from pool first

- Given the pool contains 1 zombie-tier recipe and 2 moderate-tier recipes
- And the catalog contains 5 additional zombie-tier recipes
- When zombie mode is activated
- Then the pool's zombie recipe shall appear first
- And 2 catalog zombie recipes shall fill the remaining slots

### Scenario: Select a zombie-mode recipe and start cooking immediately

- Given the user is viewing 3 zombie-mode suggestions
- When the user taps "Scrambled Eggs (10 min)"
- Then the system shall open the recipe in cooking view
- And the mode shall be set to Relaxed (no mode selection prompt)

### Scenario: Dismiss zombie mode entirely

- Given the user is viewing zombie-mode suggestions
- When the user taps "Not even this tonight"
- Then the system shall return to the catalog hub
- And no guilt or judgment language shall appear
- And the pool shall remain unchanged

### Scenario: No zombie-tier recipes in catalog

- Given the user's catalog contains no recipes with ≤5 active decisions
- When zombie mode is activated
- Then the system shall display: "No quick meals saved yet. Import a few 10-minute recipes to have them ready for nights like this."
- And the system shall not fall back to showing moderate-tier recipes

## Questions

- Should zombie mode be directly accessible (e.g., a dedicated button) without going through the dismiss flow first?
- Should the app remember that the user used zombie mode and surface zombie-tier recipes more prominently next time?

## Holdout: false

---

## From `theme-night-rotation.md`

# Feature: Theme Night Rotation

## Status: vision

## Story

As a household meal planner, I want to assign cuisine themes to weekday evenings, so that the dinner decision is half-made before I even open the app.

## Rules

- When the user configures theme nights, the system shall support assigning a theme (e.g., *Taco*, *Pasta*, *Stir-Fry*) to each day of the week
- When the user opens suggestions on a themed day, the system shall filter results to recipes matching that day's theme
- The system shall support 4–8 recipe variations per theme
- When the user skips a theme night, the system shall generate no alert, no failure state, and no guilt language
- When a themed day has zero matching recipes, the system shall fall back to unfiltered suggestions

## Scenarios

### Scenario: Set up theme nights for the week

- Given the user is on the theme night configuration screen
- When the user assigns *Pasta* to Monday and *Taco* to Tuesday
- Then Monday shall display *Pasta* as its theme
- And Tuesday shall display *Taco* as its theme

### Scenario: Monday shows Pasta-themed suggestions

- Given Monday is configured with the *Pasta* theme
- And the catalog contains at least 3 Pasta-tagged recipes
- When the user opens suggestions on Monday
- Then all displayed recipes shall be tagged with the *Pasta* theme

### Scenario: Skip Taco Tuesday without consequence

- Given Tuesday is configured with the *Taco* theme
- When the user does not open the app or select a recipe on Tuesday
- Then no notification, alert, or negative language shall be generated
- And the following Wednesday shall behave normally

### Scenario: Add new recipe to an existing theme

- Given the *Pasta* theme exists with 4 recipes
- When the user tags a new recipe with the *Pasta* theme
- Then the *Pasta* theme shall contain 5 recipes
- And the new recipe shall appear in Monday's suggestions

### Scenario: Remove theme from a day

- Given Monday is configured with the *Pasta* theme
- When the user removes the theme from Monday
- Then Monday shall have no assigned theme
- And opening suggestions on Monday shall show unfiltered results

### Scenario: Themed day with no matching recipes falls back to unfiltered

- Given Friday is configured with the *Sushi* theme
- And the catalog contains zero *Sushi*-tagged recipes
- When the user opens suggestions on Friday
- Then the system shall display unfiltered suggestions
- And the system shall indicate that no *Sushi* recipes are available

## Questions

- Should themes be user-defined free text or selected from a preset list?
- Can a single day have multiple themes (e.g., Monday is both *Pasta* and *Soup*)?
- Should the system suggest themes based on existing recipe tags in the catalog?

## Holdout: false

---

## Cross-scenario notes

One conflict identified between `energy-aware-suggestions.md` and `theme-night-rotation.md`:

- `energy-aware-suggestions.md` rule: "The system shall never surface the full catalog as a fallback — it shall always present a bounded set or an **empty state**."
- `theme-night-rotation.md` rule: "When a themed day has zero matching recipes, the system shall **fall back to unfiltered suggestions**."

These are not directly contradictory (unfiltered suggestions is still a bounded set, not the full catalog), but the theme-night fallback implicitly relaxes the constraint whereas energy-aware-suggestions defaults to an empty state. The designer should decide: when a theme-night has no matching recipes AND no unfiltered recipes exist (or unfiltered is considered "full catalog"), which rule wins? Recommend aligning on the energy-aware model: themed-day zero-match → empty state with "No [Sushi] recipes saved. [Adjust filters] / [Browse all]" — consistent with never showing the full catalog as a silent fallback.
