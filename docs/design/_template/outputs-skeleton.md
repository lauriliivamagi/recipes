# Outputs skeleton

After a Claude Design session for a surface completes, populate `<surface>/outputs/` with the following artifacts. This file is the authoritative checklist; the spec at [`docs/superpowers/specs/2026-04-20-design-framework-design.md`](../../superpowers/specs/2026-04-20-design-framework-design.md) carries the rationale.

## Required artifacts

### `outputs/share-link.md`

Single short file. One line for the Claude Design project URL, one line for the last-updated timestamp:

```markdown
# Claude Design project

URL: https://claude.ai/design/<project-id>
Last updated: <YYYY-MM-DD>
```

### `outputs/screenshots/`

Numbered PNGs of every meaningful state designed. Naming convention: `NN-<state>.png` where NN is two-digit sequence and `<state>` is a short slug.

Examples: `01-primary.png`, `02-empty.png`, `03-error.png`, `04-zombie-mode.png`.

Plus a `manifest.md` in the same folder, captioning each screenshot:

```markdown
# Screenshot manifest

- `01-primary.png` — Primary state with 3 suggestion chips, energy-tier control above
- `02-empty.png` — No suggestions possible; "Nothing matches today's filters" with adjust/browse-all
- `03-zombie-mode.png` — Zombie-mode entry: "Really low energy? Here are meals with 5 or fewer decisions."
```

### `outputs/handoff/`

The raw handoff bundle from Claude Design's "Handoff to Claude Code" export. Untouched. Place files exactly as exported.

### `outputs/chat-excerpts.md`

Quoted excerpts from the Claude Design chat where Claude explained a design decision worth remembering. Not the full chat — only what helps future readers understand the *why*.

Format:

```markdown
# Chat excerpts — <surface name>

## On <topic>

> [Quoted Claude Design response]

Decision recorded in decisions.md.
```

## decisions.md (lives one level up, not in outputs/)

Sectioned page covering the design session's outcome. Required sections:

```markdown
# Decisions — <surface name>

## What we kept

[Bulleted list of design choices that landed]

## What we discarded

[Bulleted list of variations or directions that were tried and rejected, with why]

## Open questions

[Things the session didn't resolve; flagged for human review or for the next iteration]

## Kernel feedback

[Most important section. If anything in this design exposed a missing principle, a wrong micro-interaction primitive, an under-specified intent, or an inaccurate brand-voice rule — record it here, then update the relevant file in `_kernel/` and add a row to `_kernel/CHANGES.md` BEFORE starting the next surface.]
```

## When `decisions.md` says "Kernel feedback: <change>"

Update the relevant kernel file, add a row to `_kernel/CHANGES.md`, then proceed to the next surface. Do not skip this step. The framework's Phase 3 success criterion says the kernel must have been updated at least twice based on `decisions.md` feedback.
