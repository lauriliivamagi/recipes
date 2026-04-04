# Recipe Visualizer Modernization

**Date:** 2026-04-04
**Approach:** Clean-room rewrite with Vite, Lit v3, TypeScript, vertical slices, comprehensive tests

## Context

The Recipe Visualizer is a PWA that models recipes as DAGs and computes optimized cooking schedules. It currently works as a zero-dependency vanilla JS project with monolithic HTML templates (recipe.html at 2267 lines) and Node.js build scripts. As a public MIT project on GitHub, it needs to be maintainable and approachable for contributors. The codebase will grow with new features, making the current architecture unsustainable.

## Decisions

- **Vite + Vitest** for build and unit testing
- **Lit v3** web components for the frontend
- **TypeScript** throughout
- **Zod** for runtime recipe validation (replaces JSON Schema runtime use)
- **XState v5** stays as state machine (typed)
- **Shared domain modules** importable by both build scripts and browser
- **Vertical slices by domain concept** (5 slices)
- **Comprehensive Playwright E2E** (~20 tests)
- **Clean-room rewrite** (low risk, 2 recipes, no external users)

## Directory Structure

```
src/
  domain/
    recipe/
      types.ts                  # Recipe, Ingredient, Operation, Equipment, SubProduct, FinishStep
      schema.ts                 # Zod schema
      parse.ts                  # parseRecipe(json): Recipe
      resolve.ts                # resolveIngredients(op, recipe): Ingredient[]
      recipe.test.ts
    schedule/
      types.ts                  # Phase, ScheduleMode, CookingStep
      dag.ts                    # validateDag, topoSort, classifyRef
      critical-path.ts          # findCriticalPath (DP on cook ops)
      schedule-relaxed.ts       # buildRelaxedSchedule
      schedule-optimized.ts     # buildOptimizedSchedule (greedy packing)
      schedule.ts               # computeSchedule, computeTotalTime (public API)
      cooking-steps.ts          # buildCookingSteps (phases -> flat step list)
      dag.test.ts
      schedule.test.ts
      critical-path.test.ts
    scaling/
      types.ts                  # ConversionResult, FlaggedConversion
      unit-convert.ts           # convertUnit, normalizeUnit
      temperature.ts            # convertTemperature
      round.ts                  # roundQuantity
      scale.ts                  # scaleQuantity, scaleTime
      scaling.test.ts
    catalog/
      types.ts                  # RecipeMeta
      filter.ts                 # filterRecipes(recipes, query, activeTags)
      catalog.test.ts
    cooking/
      types.ts                  # TimerState, StepNavigation
      step-navigation.ts        # next, back, jumpToPhase logic
      timer.ts                  # timer lifecycle (pure logic, no DOM)
      cooking.test.ts
  ui/
    shared/
      styles.ts                 # CSS custom properties as Lit css``
    recipe/
      recipe-page.ts            # <recipe-page> orchestrator, owns XState actor
      recipe-header.ts
      servings-adjuster.ts
      view-tabs.ts
    overview/
      overview-view.ts
      mode-toggle.ts
      equipment-summary.ts
      phase-list.ts
      phase-card.ts
    cooking/
      cooking-view.ts
      focus-card.ts
      context-banner.ts
      secondary-task.ts
      awareness-bar.ts
      nav-buttons.ts
      timer-button.ts
    catalog/
      catalog-page.ts
      search-bar.ts
      tag-filters.ts
      recipe-card.ts
    state/
      recipe-machine.ts         # XState v5 typed machine
      timer-actor.ts            # fromCallback timer actor
      wake-lock.ts
      audio.ts
      persistence.ts
  build/
    vite-plugin-recipes.ts      # Vite plugin: scan recipes, compute schedules, inject via transformIndexHtml
    build-index.ts              # Index page recipe metadata generation
    i18n.ts                     # loadI18n, deepMerge
  entries/
    recipe.ts                   # Bootstraps <recipe-page>
    catalog.ts                  # Bootstraps <catalog-page>
templates/
  recipe.html                   # Slim shell: <recipe-page> + <script type="module">
  index.html                    # Slim shell: <catalog-page> + <script type="module">
  sw.js
  app.webmanifest
  i18n/en.json, et.json
  icons...
config/                         # Unchanged
recipes/                        # Unchanged
e2e/
  catalog.spec.ts
  recipe-overview.spec.ts
  cooking-mode.spec.ts
  scaling.spec.ts
  i18n.spec.ts
  responsive.spec.ts
  pwa.spec.ts
fixtures/
  recipes/
    minimal-recipe.json
    complex-dag.json
    cyclic-dag.json
    missing-ref.json
    single-chain.json
```

## Domain Model

### recipe/ slice
Source of truth for all data types. Other slices import from `recipe/types.ts`.

Key types: `Recipe`, `Ingredient`, `Operation` (with DAG edges via `inputs: string[]`), `Equipment`, `SubProduct`, `FinishStep`, `RecipeMeta`.

Validation via Zod schema. `parseRecipe(json: unknown): Recipe` validates and returns typed data or throws. `resolveIngredients(op, recipe)` walks the input chain transitively.

### schedule/ slice
Depends on: `recipe/types.ts` only.

Ports the current `lib/recipe-optimize.js` (1093 lines) into focused modules:
- `dag.ts` — Kahn's toposort, cycle detection, reference resolution, equipment conflict detection
- `critical-path.ts` — forward DP on cook ops to find longest-time path
- `schedule-relaxed.ts` — all prep first, cook grouped by sub-product
- `schedule-optimized.ts` — critical-path driven, deferred prep into idle windows, parallel chain fitting with equipment tracking
- `cooking-steps.ts` — flattens phases into navigable step list

Public API: `computeSchedule(recipe, mode): Phase[]`, `computeTotalTime(phases): number`

### scaling/ slice
Depends on: nothing (operates on primitives).

Conversion tables and density data imported as ESM JSON imports (Vite handles natively). Decoupled from `readFileSync`.

Key functions: `convertUnit`, `normalizeUnit`, `scaleQuantity`, `scaleTime`, `roundQuantity`, `convertTemperature`

### catalog/ slice
Depends on: `recipe/types.ts` (uses `RecipeMeta`).

Pure function: `filterRecipes(recipes, query, activeTags)` — case-insensitive text search + tag AND-filtering.

### cooking/ slice
Depends on: `schedule/types.ts`, `scaling/scale.ts`

Pure step navigation and timer lifecycle logic. Browser APIs (wake lock, audio, persistence) live in `src/ui/state/`.

### Cross-slice rules
- Slices communicate through shared types only (from `*/types.ts`)
- One cross-slice function dependency: `cooking-steps.ts` imports `scaleQuantity`/`scaleTime` from `scaling/`
- No circular dependencies

## Lit Component Tree

### Recipe page
```
<recipe-page>                       # Owns XState actor, distributes state as props
  <recipe-header>                   # Title, difficulty, time, tags, back link
  <servings-adjuster>               # +/- buttons, fires @adjust-servings
  <view-tabs>                       # Overview | Cooking (role=tablist)
  <overview-view>
    <mode-toggle>                   # Relaxed | Optimized radio group
    <equipment-summary>             # Equipment chips
    <phase-list>
      <phase-card>*                 # Per phase, click jumps to cooking
  <cooking-view>
    <awareness-bar>                 # Active timer pills (aria-live=polite)
    <context-banner>?               # Passive op in background
    <focus-card>                    # Current step action + ingredients
      <timer-button>                # Start/cancel timer
    <secondary-task>?               # Parallel ops during idle
    <nav-buttons>                   # Back/Next fixed bottom bar
```

### Catalog page
```
<catalog-page>                      # Owns filter state
  <search-bar>                      # Text input, fires @search
  <tag-filters>                     # Tag pills, fires @tag-toggle
  <recipe-card>*                    # Per visible recipe, links to recipe page
```

### State management
- `<recipe-page>` creates the XState actor, passes state slices down as Lit reactive properties
- Child components are stateless renderers: receive data via properties, fire CustomEvents upward
- No Lit context needed — 1-2 levels of prop drilling

### XState context
```typescript
interface RecipeContext {
  recipe: Recipe;
  servings: number;
  mode: ScheduleMode;
  currentStep: number;
  cookingSteps: CookingStep[];
  timers: Map<string, TimerState>;
  wakeLockActive: boolean;
}
```

Events: `@next-step`, `@prev-step`, `@adjust-servings`, `@set-mode`, `@start-timer`, `@cancel-timer`, `@jump-to-phase`

### Browser APIs (src/ui/state/)
- `wake-lock.ts` — Screen Wake Lock API
- `audio.ts` — procedural 880/1100 Hz beep via Web Audio API
- `persistence.ts` — localStorage save/restore
- `timer-actor.ts` — XState fromCallback wrapping setInterval

## Build Pipeline

### Vite plugin (`vite-plugin-recipes`)
1. Scans `recipes/` for JSON files
2. Imports domain modules to validate DAGs and compute schedules
3. Loads and merges i18n strings
4. Injects data into HTML via `transformIndexHtml` hook

Works identically in dev and production. Dev mode watches `recipes/` for changes.

### Multi-page output
Plugin generates one HTML entry per recipe (populating the slim `recipe.html` shell) plus the index page. Vite's rollup config processes all entries.

### package.json scripts
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:e2e": "playwright test",
  "typecheck": "tsc --noEmit"
}
```

### Dependencies
**Runtime:** lit (v3), xstate (v5), zod
**Dev:** vite, vitest, typescript, @playwright/test

### GitHub Actions
Deploy workflow: `npm ci && npm run build` (single vite build command). E2E runs as separate CI job.

## Test Strategy

### Unit tests (Vitest, co-located)

**schedule/ (95% branches):**
- DAG validation: valid DAGs, cycles, unresolved refs, equipment conflicts, self-reference
- Critical path: longest path on known DAGs, diamond shapes, single-chain
- Relaxed schedule: prep-first ordering, sub-product grouping, topological order
- Optimized schedule: early prep only, deferred prep in idle windows, parallel chain fitting, equipment blocks parallel
- `computeTotalTime`: sequential phases, parallel phases (max of main vs parallel)

**scaling/ (90% branches):**
- Unit alias normalization (plural, case, whitespace, unknown passthrough)
- Conversions: volume/weight with density lookups (exact + substring, longer key preferred)
- Temperature: F->C, C passthrough
- Rounding: whole units, g/ml thresholds, general 1-decimal
- Scaling: scalable vs non-scalable ops, square-root for scale-up

**recipe/:**
- Zod validation: valid passes, missing fields, bad enums, bad slug, empty ops
- resolveIngredients: direct inputs, transitive, no duplicates

**catalog/:**
- Text search (case-insensitive), tag AND-filter, combined, empty query

**cooking/:**
- Step navigation bounds, jump-to-phase, timer lifecycle

### E2E tests (Playwright, 20 tests)

| Spec file | Tests |
|-----------|-------|
| `catalog.spec.ts` | Index loads with cards, search filters, tag filter narrows, card links work |
| `recipe-overview.spec.ts` | Ingredients/equipment render, mode toggle changes time, phase cards display |
| `cooking-mode.spec.ts` | Start cooking enters step view, next/back navigation, step counter, last step completes |
| `scaling.spec.ts` | Servings up doubles quantities, down halves, non-scalable times unchanged |
| `i18n.spec.ts` | Estonian updates labels, English fallback for missing keys |
| `responsive.spec.ts` | Mobile 375px no scroll, tablet 768px 2-col, desktop 1440px 3-col |
| `pwa.spec.ts` | Manifest loads, SW registers, offline reload serves cached page |

**Infrastructure:**
- Run against `vite preview`
- CI: Chromium only; full browser matrix on nightly
- Fixtures: real recipes + synthetic test recipes in `fixtures/`

### Coverage thresholds
85% lines / 85% branches / 90% functions overall. `schedule/` at 95% branches.

### What NOT to test
- Lit shadow DOM internals
- Vite config
- Service worker cache API calls
- Visual regression screenshots
- i18n string completeness (lint script instead)
- Build script glue code

## Files to Delete After Rewrite

- `lib/recipe-build.js`
- `lib/recipe-optimize.js`
- `lib/unit-convert.js`
- Old monolithic `templates/recipe.html` (replaced by slim shell)
- Old monolithic `templates/index.html` (replaced by slim shell)

## Verification

1. `npm run typecheck` — no TypeScript errors
2. `npm test` — all Vitest unit tests pass, coverage thresholds met
3. `npm run build` — produces `site/` with same structure (index.html + per-recipe HTML + SW + manifest + icons)
4. `npm run preview` — site works locally: browse index, open recipe, switch modes, cook through steps, timers work, servings scale
5. `npm run test:e2e` — all 20 Playwright tests pass
6. Deploy to GitHub Pages — site works at production URL
