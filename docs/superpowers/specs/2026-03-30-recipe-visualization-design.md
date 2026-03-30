# Recipe Visualization App — Design Spec

## Problem

Traditional recipe formats separate ingredients from instructions and present steps as long prose paragraphs. This forces the cook to constantly jump between the ingredient list and instructions, mentally track parallelism, figure out optimal execution order, and remember which preparations should have been done earlier. The result is unnecessary cognitive load and longer cooking times.

## Solution

A GitHub repo-based recipe system powered by Claude Code. Recipes are stored as structured JSON, transformed into self-contained interactive HTML tools that provide two views:

1. **Phase Map Overview** — a bird's-eye view of the recipe broken into named phases, with a relaxed/optimized toggle that redistributes prep tasks into idle windows
2. **Step-by-Step Cooking View** — a focused, phone-friendly guide with inline ingredients, parallel task awareness, and built-in timers

No backend. No build pipeline. Claude Code is the intelligent layer — it imports, parses, optimizes, and generates. GitHub Pages (or any static host) serves the output.

## Architecture

```
Claude Code Plugin          Structured Data           Static Output
─────────────────          ───────────────           ─────────────
/recipe-import ──────────► recipes/*.json ─────────► site/*.html
/recipe-inbox                                        site/index.html
/recipe-build              config/
/recipe-index              templates/
/recipe-review             inbox/
```

- **Claude Code plugin** provides commands and skills for all workflows
- **JSON files** in `recipes/` are the source of truth
- **HTML tools** in `site/` are the generated output — self-contained, no network required

## Repo Structure

```
recipes/                           # Source of truth
├── italian/
│   ├── spaghetti-bolognese.json
│   └── tiramisu.json
├── asian/
│   └── pad-thai.json
└── baking/
    └── sourdough.json

site/                              # Generated output (deploy to GitHub Pages)
├── index.html                     # Browsable index with search/filter/tags
├── italian/
│   ├── spaghetti-bolognese.html   # Self-contained recipe view
│   └── tiramisu.html
└── asian/
    └── pad-thai.html

inbox/                             # Drop-off for manual recipe imports
├── grandmas-lasagna.md
├── cookbook-page-42.jpg
├── thai-curry.pdf
└── processed/                     # Originals moved here after import

config/
├── preferences.json               # Family dietary preferences, default servings
└── tags.json                      # Tag taxonomy / custom categories

templates/
├── recipe.html                    # HTML template for recipe pages
├── index.html                     # HTML template for the index page
└── i18n/
    ├── en.json                    # Default UI strings
    └── et.json                    # Estonian UI strings (add more as needed)
```

## Recipe Data Model (JSON)

Each recipe lives at `recipes/<category>/<slug>.json`.

```json
{
  "meta": {
    "title": "Spaghetti Bolognese",
    "slug": "spaghetti-bolognese",
    "language": "en",
    "source": "https://example.com/original-recipe",
    "originalText": "Full original recipe text in markdown for side-by-side review...",
    "tags": ["italian", "pasta", "weeknight"],
    "servings": 4,
    "totalTime": { "relaxed": 55, "optimized": 43 },
    "difficulty": "easy",
    "notes": "Family favorite. Kids prefer less garlic."
  },
  "ingredients": [
    {
      "id": "onion",
      "name": "Onion",
      "quantity": 1,
      "unit": "whole",
      "group": "vegetables"
    },
    {
      "id": "garlic",
      "name": "Garlic",
      "quantity": 3,
      "unit": "cloves",
      "group": "vegetables"
    },
    {
      "id": "mince",
      "name": "Beef mince",
      "quantity": 500,
      "unit": "g",
      "group": "meat"
    },
    {
      "id": "tomatoes",
      "name": "Crushed tomatoes",
      "quantity": 400,
      "unit": "g",
      "group": "canned"
    },
    {
      "id": "spaghetti",
      "name": "Spaghetti",
      "quantity": 400,
      "unit": "g",
      "group": "pasta"
    },
    {
      "id": "parmesan",
      "name": "Parmesan",
      "quantity": 50,
      "unit": "g",
      "group": "dairy"
    }
  ],
  "equipment": [
    { "id": "large-pan", "name": "Large pan", "count": 1 },
    { "id": "large-pot", "name": "Large pot", "count": 1 },
    { "id": "cutting-board", "name": "Cutting board", "count": 1 },
    { "id": "grater", "name": "Grater", "count": 1 }
  ],
  "operations": [
    {
      "id": "dice-onion",
      "type": "prep",
      "action": "dice",
      "inputs": ["onion"],
      "equipment": { "use": "cutting-board", "release": true },
      "time": 3,
      "activeTime": 3
    },
    {
      "id": "mince-garlic",
      "type": "prep",
      "action": "mince",
      "inputs": ["garlic"],
      "equipment": { "use": "cutting-board", "release": true },
      "time": 2,
      "activeTime": 2
    },
    {
      "id": "saute-veg",
      "type": "cook",
      "action": "sauté",
      "inputs": ["dice-onion", "mince-garlic"],
      "equipment": { "use": "large-pan", "release": false },
      "time": 5,
      "activeTime": 5,
      "heat": "medium",
      "details": "Until onion is translucent"
    },
    {
      "id": "brown-mince",
      "type": "cook",
      "action": "brown",
      "inputs": ["saute-veg", "mince"],
      "equipment": { "use": "large-pan", "release": false },
      "time": 8,
      "activeTime": 8,
      "heat": "medium-high",
      "details": "Break up with spatula until no pink remains"
    },
    {
      "id": "simmer-sauce",
      "type": "cook",
      "action": "simmer",
      "inputs": ["brown-mince", "tomatoes"],
      "equipment": { "use": "large-pan", "release": true },
      "time": 20,
      "activeTime": 0,
      "scalable": false,
      "heat": "low",
      "details": "Cover, stir occasionally",
      "output": "sauce"
    },
    {
      "id": "boil-pasta",
      "type": "cook",
      "action": "boil",
      "inputs": ["spaghetti"],
      "equipment": { "use": "large-pot", "release": true },
      "time": 8,
      "activeTime": 1,
      "heat": "high",
      "details": "Salted water, cook until al dente",
      "output": "pasta"
    },
    {
      "id": "grate-parmesan",
      "type": "prep",
      "action": "grate",
      "inputs": ["parmesan"],
      "equipment": { "use": "grater", "release": true },
      "time": 2,
      "activeTime": 2
    }
  ],
  "subProducts": [
    { "id": "sauce", "name": "Bolognese Sauce", "finalOp": "simmer-sauce" },
    { "id": "pasta", "name": "Cooked Pasta", "finalOp": "boil-pasta" }
  ],
  "finishSteps": [
    { "action": "drain", "inputs": ["boil-pasta"], "details": "Reserve a cup of pasta water" },
    { "action": "toss", "inputs": ["simmer-sauce", "boil-pasta"], "details": "Combine in the pan" },
    { "action": "top", "inputs": ["grate-parmesan"], "details": "Serve immediately" }
  ]
}
```

### Data Model Key Decisions

- **Operations reference inputs by ID** — either an ingredient ID (first use) or another operation ID (chaining). This forms a directed acyclic graph (DAG).
- **`time` vs `activeTime`** — total duration vs how much active attention is needed. `simmer` has 20 min time but 0 active time. This powers the relaxed/optimized toggle.
- **`output` on operations** — names the sub-product when an operation produces a named intermediate result.
- **`scalable` on operations** — `false` means the operation time doesn't change with servings (e.g., simmering). Defaults to `true` if omitted (prep operations scale with quantity).
- **Equipment with occupy/release semantics** — `release: false` means the equipment stays in use (next operation continues in the same pan). `release: true` means it's freed. The optimizer uses this to prevent scheduling conflicts.
- **`originalText` in meta** — the markdown-formatted source recipe, stored for side-by-side review.
- **`group` on ingredients** — category for future shopping list aggregation.
- **`language` in meta** — determines which i18n file to use for UI chrome. Falls back to English.
- **`finishSteps` inputs** — always reference operation IDs (the graph nodes), not sub-product IDs. Sub-products are display labels only; the DAG is built from operation references.

### Unit Handling

During import, all US/UK measurements are converted to SI using a **deterministic conversion script** (not LLM-generated). The LLM extracts the raw quantity + unit from the recipe text; a script then converts to metric using a lookup table.

**Conversion table** (`config/unit-conversions.json`):
- Volume: cup → 240 ml, tbsp → 15 ml, tsp → 5 ml, fl oz → 30 ml
- Weight: oz → 28.35 g, lb → 453.6 g
- Temperature: °F → °C via `(F - 32) × 5/9`
- Density overrides for common ingredients (e.g., 1 cup flour = 120 g, 1 cup sugar = 200 g, 1 cup butter = 227 g) stored in `config/ingredient-densities.json`

**Workflow**: LLM extracts `{ quantity: 1, unit: "cup", ingredient: "flour" }` → conversion script looks up density override for flour → outputs `{ quantity: 120, unit: "g" }`. If no density override exists for a volume-to-weight conversion, the script flags it for manual review rather than guessing.

The JSON stores only metric units. The `originalText` preserves original units for reference.

## Phase Map Overview (View 1)

The overview is a vertical Phase Map — the recipe broken into named phases flowing top-to-bottom. This is the planning/comprehension view you see before cooking.

### Relaxed / Optimized Toggle

A toggle switch at the top of the overview controls how prep is distributed:

- **Relaxed mode** — all prep front-loaded into one phase. Zero multitasking during cooking. More total time, less stress.
- **Optimized mode** — only essential prep upfront (ingredients needed for the first cook step). Remaining prep distributed into idle windows (e.g., grate parmesan while sauce simmers). Shorter total time, requires some multitasking.

Both modes show the same phase layout structure. The difference is only in task placement. Time estimates displayed for each mode.

### Phase Structure

Each phase shows:
- **Phase label** with color coding: PREP (orange), BUILD/COOK (teal), SIMMER/PASSIVE (purple), FINISH (neutral)
- **Time estimate** for the phase
- **Tasks** with ingredients inline (quantities bolded), operation tags (dice, sauté, simmer)
- **Parallel tasks** shown side-by-side within a phase when applicable
- **Passive vs active** distinction (simmering labeled as passive)

### Additional Overview Elements

- **Equipment summary** at top — list of all needed equipment
- **Sub-products** labeled at their merge points
- **Tap any phase** to jump directly to that step in the cooking view

## Step-by-Step Cooking View (View 2)

The focused, phone-friendly cooking guide. Designed for messy hands and quick glances.

### Focus Card (Current Step)

The primary element — one step expanded with full detail:
- Step counter ("Step 3 of 8")
- Action as headline ("Add garlic and tomato paste")
- Detailed instructions with **inline ingredients** (quantities bolded)
- Tags: timer duration, heat level, equipment
- Large Back/Next touch targets at bottom

### Awareness Bar (Top)

Compact status pills showing background/passive tasks:
- Timers with countdown ("Sauce simmering — 12 min left")
- Tappable to see details
- Browser notifications when timers complete

### Parallel Active Tasks

When two tasks both need active attention (e.g., toast pine nuts while chopping basil):
- **Primary task**: full focus card (the higher-attention task, chosen by the app)
- **Compact secondary**: shown below the primary card with summary info, tappable to expand/swap
- Label: "While waiting · tap to expand"
- Passive background tasks remain in the awareness bar above

### Next-Up Preview

Below the current step (or below the secondary parallel task):
- Dimmed preview of the next step — just the summary line
- Labeled "NEXT" or "AFTER BOTH COMPLETE" when parallel tasks must finish first

### Interactive Features

- **Servings adjuster / recipe scaling** — recalculates all ingredient quantities by ratio (`newServings / originalServings`). Rounding rules per unit type (e.g., "1.5 cloves" → 2). Prep operation times scale proportionally; cook operations marked `scalable: false` keep their original time (simmering 20 min stays 20 min regardless of quantity). Equipment overflow warning when scaling above 2x.
- **Built-in timers** — start per step, countdown displayed in awareness bar, browser notification on completion
- **Dark mode** by default (less glare in kitchen)
- **No network required** after initial page load — fully self-contained

## Claude Code Plugin

### Commands

| Command | Description |
|---|---|
| `/recipe-import <url>` | Scrape URL, extract recipe, LLM-parse to structured JSON, show side-by-side review, save to `recipes/` |
| `/recipe-import <path>` | Import from local file (markdown, PDF, image). Detect format, extract to markdown, parse to JSON |
| `/recipe-import` (no args) | Prompt user to paste recipe markdown directly in terminal |
| `/recipe-inbox` | Process all files in `inbox/`, import each, move originals to `inbox/processed/` |
| `/recipe-build [slug]` | Generate HTML from recipe JSON. No slug = build all. Output to `site/` |
| `/recipe-index` | Regenerate the browsable index page from all recipes |
| `/recipe-review <slug>` | Show side-by-side: original markdown text vs structured Phase Map |

### Internal Skills

| Skill | Purpose |
|---|---|
| `recipe-parse` | LLM prompt for decomposing recipe text into the JSON schema — ingredients, operations, DAG edges, timings, equipment, sub-products. Handles any language. Converts imperial to metric. |
| `recipe-optimize` | Compute relaxed and optimized phase maps from the operation DAG. Resolve equipment conflicts, calculate critical path, distribute prep into idle windows. |
| `recipe-generate` | Read recipe JSON + HTML template + i18n strings, produce self-contained HTML file with both views embedded. |

### Import Workflow

1. **Acquire source** — scrape URL (via Firecrawl or web fetch), read file (Claude reads PDFs and images natively), or accept pasted markdown
2. **Normalize to markdown** — all sources converted to markdown as intermediate format
3. **LLM-parse** — `recipe-parse` skill decomposes markdown into structured JSON per the schema. Converts imperial units to metric. Preserves source language.
4. **Validate DAG** — check for cycles, unresolved input references, equipment conflicts
5. **Side-by-side review** — show user: original markdown on the left, generated Phase Map on the right. User approves or requests adjustments.
6. **Save** — write JSON to `recipes/<category>/<slug>.json`
7. **Generate** — auto-run `/recipe-build <slug>` to produce the HTML view

### Supported Import Sources

| Source | Detection | Processing |
|---|---|---|
| URL | Starts with `http` | Scrape → markdown → JSON |
| Markdown file | `.md` extension | Read → JSON |
| PDF | `.pdf` extension | Claude PDF reading → markdown → JSON |
| Image | `.jpg`, `.png` extension | Claude vision → markdown → JSON |
| Pasted text | No arguments | Prompt in terminal → JSON |

## Internationalization (i18n)

### Approach

- Recipe content stays in its original language — no translation
- UI chrome (navigation, labels, phase names) adapts to the recipe's `language` field
- Translation files in `templates/i18n/<lang>.json`
- Falls back to English (`en.json`) if no translation exists for a language

### Translation File Structure

```json
{
  "nav": {
    "next": "Next",
    "back": "Back",
    "overview": "Overview",
    "cooking": "Start Cooking"
  },
  "phases": {
    "prep": "Prep",
    "cook": "Cook",
    "simmer": "Simmer",
    "finish": "Finish"
  },
  "toggle": {
    "relaxed": "Relaxed",
    "optimized": "Optimized"
  },
  "labels": {
    "equipment": "Equipment needed",
    "servings": "Servings",
    "totalTime": "Total time",
    "step": "Step",
    "of": "of",
    "next": "Next",
    "meanwhile": "Meanwhile",
    "useThisTimeFor": "Use this time for",
    "afterBothComplete": "After both complete",
    "passive": "Passive",
    "active": "Active",
    "tapToExpand": "Tap to expand"
  }
}
```

Adding a new language = adding one JSON file matching this structure.

## Future Extensions (Not v1)

These features build on the same recipe JSON and repo structure:

- **Shopping list** (`/shopping-list`) — aggregate ingredients from selected recipes, group by `ingredient.group`, support manual reordering
- **Meal planning** (`/meal-plan`) — select recipes for N days, combine ingredient lists, deduplicate
- **E-store integration** (`/grocery-run`) — browser automation (Playwright) to add shopping list items to online store basket
- **Store layout optimization** — order shopping list by store section to minimize travel path
- **Family personalization** — dietary restrictions, substitution suggestions, per-person portion tracking
