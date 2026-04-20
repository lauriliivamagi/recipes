# Codebase pointers for Claude Design

Claude Design's "Set up your design system" onboarding can link source repositories. Per the [Anthropic Labs documentation](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), linking very large repositories causes lag — link specific subdirectories instead.

This file specifies exactly which URLs to paste into Claude Design's onboarding, plus what to deliberately exclude. URLs are pinned to the `master` branch so that re-onboarding picks up kernel evolution; pin to a specific commit only when you want a frozen snapshot.

## Paste into Claude Design onboarding

### Kernel (the design contract — upload these as files)

The five kernel files plus the changelog are the design contract Claude Design reads to extract Hob's design system. Upload or paste them directly during onboarding (they are not "linked subdirectories" — they are the source-of-truth content).

GitHub-hosted versions for reference:

- <https://github.com/lauriliivamagi/hob-social/tree/master/docs/design/_kernel>

Local paths: [`brand-voice.md`](brand-voice.md), [`design-principles.md`](design-principles.md), [`micro-interactions.md`](micro-interactions.md), [`design-intent.md`](design-intent.md), [`codebase-pointers.md`](codebase-pointers.md), [`CHANGES.md`](CHANGES.md).

### Codebase subdirectories (the data shape — link these as repo references)

| Subdirectory | URL to paste | Why |
| --- | --- | --- |
| Recipe JSON examples | <https://github.com/lauriliivamagi/hob-social/tree/master/packages/build/recipes> | Examples of the data the product organizes |
| ATproto lexicons | <https://github.com/lauriliivamagi/hob-social/tree/master/lexicons> | Type definitions for synced records |

Local paths: [`packages/build/recipes/`](../../../packages/build/recipes/), [`lexicons/`](../../../lexicons/).

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

- Strategy: <https://github.com/lauriliivamagi/hob-social/tree/master/docs/strategy> — JTBD, personas, journey maps, IA, service blueprint, data model. Local: [`docs/strategy/`](../../strategy/).
- Scenarios: <https://github.com/lauriliivamagi/hob-social/tree/master/docs/scenarios> — behavioral specs by domain. Local: [`docs/scenarios/`](../../scenarios/).

## Re-validation

If the repository structure changes (e.g., `packages/build/recipes/` is moved), update this file and re-run the Claude Design organization onboarding. The kernel is the contract; codebase paths drift faster than the kernel does.

If you need a reproducible re-extraction (e.g., to compare the design system against a known kernel state), use a commit-pinned URL like `https://github.com/lauriliivamagi/hob-social/tree/<sha>/docs/design/_kernel` instead of `tree/master/...`.
