---
name: recipe-parse
description: "LLM prompt for decomposing recipe text into structured JSON — ingredients, operations, DAG edges, timings, equipment, sub-products"
---

# Recipe Parse Skill

You are decomposing a recipe from natural-language text into a structured JSON representation. Follow these instructions precisely.

## Input

Markdown-formatted recipe text. May be in any language.

## Output

A JSON object conforming to the recipe schema. Return ONLY valid JSON.

## Schema and Validation

The **single source of truth** for the recipe data model is the Zod schema at `src/domain/recipe/schema.ts`. A generated JSON Schema (Draft 2020-12) is available at `config/recipe-schema.json` — read this file to see the exact field names, types, required fields, patterns, and constraints.

**Before generating JSON, always read `config/recipe-schema.json`** to ensure your output matches the current schema. The schema evolves; this skill does not duplicate it.

### Validation pipeline

Your output goes through multiple validation layers:

1. **JSON Schema (structural)** — `config/recipe-schema.json` checks types, required fields, patterns (e.g., IDs must match `^[a-z0-9]+(-[a-z0-9]+)*$`), and `additionalProperties: false` (no extra fields allowed)
2. **Zod refinements (business rules)** — `src/domain/recipe/schema.ts` enforces constraints that JSON Schema cannot express:
   - `activeTime` must be `<=` `time` on every operation
   - All IDs must be unique within their entity type (no duplicate ingredient IDs, operation IDs, etc.)
   - Every `operation.ingredients[]` entry must reference an existing ingredient ID
   - Every `operation.depends[]` entry must reference an existing operation ID
   - Every `operation.equipment.use` must reference an existing equipment ID
   - Every `subProducts[].finalOp` must reference an existing operation ID
   - `finishSteps` no longer exists — use `assemble` operations instead
3. **Tag validation** — tags must come from the allowed set in `config/tags.json`. Read this file to see which tags are valid. Tags are grouped by category (cuisine, meal, type, effort, dietary).
4. **DAG validation** — `src/domain/schedule/dag.ts` checks for cycles in the operations graph after Zod validation passes

### Key constraints to remember

- `meta.source` must be a URL (`https://...`), not a file path
- `meta.servings` must be a positive number
- `equipment[].count` must be a positive integer
- Operation `type` is one of: `"prep"`, `"cook"`, `"rest"`, or `"assemble"` — there are no separate finish steps; terminal actions (plating, serving) are `"assemble"` operations
- An existing recipe JSON (e.g., `recipes/italian/spaghetti-bolognese.json`) serves as a working example of valid output

## Critical Rules

1. **Preserve the source language.** All text fields (title, action descriptions, details, notes, ingredient names) stay in the recipe's original language. Do NOT translate.
2. **Extract quantities in their original units.** Do not convert units — a separate conversion step handles that. If the recipe says "2 cups flour", output `"quantity": {"min": 2, "unit": "cup"}`. For ranges like "100-150 g", output `"quantity": {"min": 100, "max": 150, "unit": "g"}`. For ingredients with alternatives (e.g., "cream or water"), use the `alternatives` array with full ingredient objects.
3. **Build a proper DAG.** Each operation has `ingredients` (array of ingredient IDs consumed) and `depends` (array of operation IDs that must complete first). There must be no cycles. Leaf operations have `depends: []`.
4. **Times are in seconds with optional ranges.** `time` and `activeTime` are `{min: number, max?: number}` in **seconds**. `min` is the lower bound (or exact when `max` is omitted). `activeTime.max` must never exceed `time.max` (or `time.min` if no `time.max`). Simmering, baking, resting, marinating, and rising are passive (`activeTime: {min: 0}`). Use ranges for variable-time operations: simmer 20-30 min → `time: {min: 1200, max: 1800}`.
5. **Equipment is a required array.** Each operation has `equipment: [{use: "equipment-id", release: boolean}, ...]`. Empty array `[]` if no equipment. Set `release: false` when the next operation continues in the same vessel. Set `release: true` when the equipment is freed.
6. **`scalable` is required.** Set to `true` for active work (prep time scales with quantity), `false` for passive operations (simmering, baking, resting — time doesn't change with scaling).
7. **Temperature replaces heat.** Instead of qualitative heat labels, use `temperature: {min: number, max?: number, unit: "C" | "F"}`. Examples: medium heat → `{min: 160, max: 180, unit: "C"}`, oven at 175°C → `{min: 175, unit: "C"}`. Omit for operations that don't use heat.
8. **Identify sub-products.** When an operation produces a named intermediate result (sauce, dough, filling, etc.), give the operation an `output` field and add a corresponding entry to `subProducts`.
9. **Use `rest` for passive waiting without heat.** Resting meat, proofing dough, marinating, cooling, chilling — these are `type: "rest"` with `activeTime: {min: 0}`. Distinguished from passive `cook` (simmering) because rest doesn't occupy a heat source.
10. **Use `assemble` for terminal/combining actions.** Plating, tossing pasta with sauce, layering, garnishing, serving — these are `type: "assemble"`. They replace the old `finishSteps`. Give them full operation fields (`id`, `time`, `equipment`, etc.).

## When schema.org/Recipe Data Is Available

When the input includes schema.org/Recipe structured data (extracted by Defuddle from the page's JSON-LD), use it as a head start — but still apply all parsing rules and DAG construction logic below.

### What schema.org gives you

- `recipeIngredient[]` — flat list of ingredient strings (e.g., "200g spaghetti", "4 egg yolks"). Parse each into the structured `{ id, name, quantity, unit, group }` format.
- `recipeInstructions[]` — ordered instruction steps (as text or `HowToStep` objects). Use these as the basis for operation sequencing, but decompose compound instructions into atomic operations.
- `prepTime` / `cookTime` — ISO 8601 durations (e.g., "PT15M" = 15 minutes). Use as sanity checks for your `totalTime` estimates.
- `recipeYield` — serving count string (e.g., "4 servings"). Extract the number for `meta.servings`.
- `recipeCuisine` / `recipeCategory` — use for `meta.tags[]` suggestions.
- `name` — use as `meta.title` (in original language).

### What schema.org does NOT give you

- **DAG edges** — schema.org instructions are a flat ordered list, not a dependency graph. You must still identify which operations depend on which ingredients/operations and wire the `ingredients` and `depends` arrays.
- **Active vs passive time** — schema.org has no concept of attention required. You must still estimate `time` vs `activeTime` for each operation.
- **Equipment occupy/release** — not represented in schema.org. You must still identify equipment and set `release` flags.
- **Sub-products** — schema.org doesn't name intermediate results. You must still detect sauces, doughs, fillings, etc.
- **Parallel opportunities** — schema.org instructions are sequential. The DAG you build is what enables the optimizer to find parallel paths.

### How to use both sources

1. Use `recipeIngredient[]` as the authoritative ingredient list. Cross-reference with the markdown to catch any ingredients mentioned only in the instructions.
2. Use `recipeInstructions[]` ordering to guide your operation sequence, but read the markdown for details, tips, and nuances not captured in the structured data.
3. Use `prepTime`/`cookTime` to sanity-check your timing estimates. If your total differs by more than 20%, review your operation timings.
4. When schema.org and markdown disagree (e.g., different quantities), prefer schema.org — recipe authors typically maintain their structured data more carefully for SEO.

## Parsing Guidelines

### Ingredients
- Create a unique `id` for each ingredient using kebab-case (e.g., `olive-oil`, `garlic-cloves`)
- If the same ingredient appears in different forms (e.g., "butter, softened" and "butter, melted"), create separate entries with distinct IDs (e.g., `butter-softened`, `butter-melted`)
- Set `group` to a logical shopping category

### Operations
- Break compound instructions into atomic operations (e.g., "dice the onion and garlic" becomes two operations: `dice-onion` and `mince-garlic`)
- Chain operations correctly: if browning meat requires the sautéed vegetables, the brown operation's `depends` includes the sauté operation ID, and `ingredients` includes the raw meat ingredient ID
- For passive operations (simmering, baking, resting): set `activeTime: {min: 0}` and `scalable: false`
- Equipment is a required array — use `[]` for operations that don't need tools

### DAG Construction
- Each operation has `ingredients` (ingredient IDs it directly consumes) and `depends` (operation IDs that must complete first)
- The first time an ingredient is used, it appears in that operation's `ingredients` array
- After an ingredient has been processed, subsequent operations reference the processing operation via `depends` (not the ingredient ID again)
- Terminal operations (`type: "assemble"`) use `depends` to reference the operations they combine

### Timing
- All times are in **seconds**: `time: {min: 300}` = 5 minutes, `time: {min: 1200, max: 1800}` = 20-30 minutes
- Estimate `totalTime.relaxed` as `{min: total_seconds}` for all operations sequential with prep front-loaded
- Estimate `totalTime.optimized` as `{min: critical_path_seconds}` with prep distributed into idle windows
- These are rough estimates; the optimizer will compute precise values later

### Tags
- Read `config/tags.json` to see the allowed tags — only tags from this file pass validation
- Suggest 3-5 tags from the allowed set, based on cuisine, meal type, cooking method, and dietary properties
- If no existing tag fits, omit it rather than inventing one (tags can be added to the config later)

### Difficulty
- `easy`: few ingredients, simple techniques, forgiving timing
- `medium`: multiple components, some technique required, timing matters
- `hard`: advanced techniques, precise timing, many parallel tasks
