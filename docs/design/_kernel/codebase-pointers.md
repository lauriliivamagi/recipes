# Codebase pointers for Claude Design

Claude Design's "Set up your design system" onboarding can link source repositories. Per the [Anthropic Labs documentation](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), linking very large repositories causes lag — link specific subdirectories instead.

This file specifies exactly which subdirectories to link, and which to deliberately exclude.

## Link these

| Path | Why |
| --- | --- |
| [`packages/build/recipes/`](../../../packages/build/recipes/) | Recipe JSON shape — examples of the data the product organizes |
| [`lexicons/`](../../../lexicons/) | ATproto lexicons — the type definitions for synced records |

## Do not link

| Path | Why excluded |
| --- | --- |
| Repository root | Too large; causes lag per Claude Design's known limitations |
| `site/` | Existing rendered HTML and CSS would bias the extracted design system toward the current aesthetic — we want fresh design thinking, anchored only by intent |
| `node_modules/` | Vendor code |
| `tmp/` | Working artifacts, market research output, transient scratch |
| `docs/wireframes/` | Existing wireframes are introduced selectively in per-surface `inputs/`, not at the org-design-system level |

## Reference docs to consult separately

These are not codebase links — they are docs we may quote in per-surface briefs:

- [Strategy](../../strategy/) — JTBD, personas, journey maps, IA, service blueprint, data model
- [Scenarios](../../scenarios/) — behavioral specs by domain

## Re-validation

If the repository structure changes (e.g., `packages/build/recipes/` is moved), update this file and re-run the Claude Design organization onboarding. The kernel is the contract; codebase paths drift faster than the kernel does.
