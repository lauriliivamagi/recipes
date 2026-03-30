# CLAUDE.md

Recipe visualization app — GitHub repo + Claude Code plugin + static HTML tools.

## Architecture

```
config/               # Conversion tables, preferences, tags
recipes/              # Source of truth — structured JSON per recipe
templates/            # HTML templates + i18n strings
lib/                  # Build scripts (optimizer, converter, generator)
site/                 # Generated output (gitignored, deploy to GitHub Pages)
inbox/                # Drop-off for manual recipe imports
docs/                 # Design specs and notes
```

## Commands

```bash
node lib/recipe-build.js              # Build all recipes → site/
node lib/recipe-build.js --slug NAME  # Build single recipe
node lib/recipe-build.js --index-only # Rebuild index page only
```

## Recipe Data Model

Recipes are JSON files in `recipes/<category>/<slug>.json` containing:

- `meta` — title, slug, language, source URL, original text, tags, servings, timing, difficulty
- `ingredients` — id, name, quantity, unit, group
- `equipment` — id, name, count (with occupy/release semantics in operations)
- `operations` — DAG of prep/cook steps with inputs, timing, activeTime, equipment, heat, scalable flag
- `subProducts` — named intermediate outputs (sauce, pasta, etc.)
- `finishSteps` — final assembly steps

Operations form a directed acyclic graph (DAG) — inputs reference ingredient IDs or other operation IDs.

## Key Design Decisions

- **Unit conversion is deterministic** — scripted lookup tables in `config/`, not LLM-generated
- **Recipe language preserved** — no translation; UI chrome translated via `templates/i18n/`
- **Self-contained HTML** — each recipe page works offline with no network dependencies
- **Relaxed/Optimized toggle** — powered by `time` vs `activeTime` on operations; optimizer distributes prep into idle windows
- **Equipment constraints** — `release: false/true` on operations prevents invalid parallel scheduling

## Design Spec

Full spec: `docs/superpowers/specs/2026-03-30-recipe-visualization-design.md`
