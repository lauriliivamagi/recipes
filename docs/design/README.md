# Design

This folder holds Hob's per-surface design work. It exists because the [strategy](../strategy/) and [scenarios](../scenarios/) layers are mature, but design has been fragmented across loose wireframes. This is the bridge layer.

## Who is this for

Primary executor: AI sessions (Claude Code + Claude Design), with human review at defined gates. See the [framework spec](../superpowers/specs/2026-04-20-design-framework-design.md) for the full rationale, persona alignment, and risk analysis.

## Folder layout

```text
_kernel/      # Source material for Claude Design's organization-level design system
_template/    # Templates new surfaces are scaffolded from
<surface>/    # One folder per IA surface (see Sequencing below)
```

Each surface folder contains the following — note the distinction between artifacts created at scaffolding time and artifacts written after the Claude Design session:

**Scaffolded up front (before any Claude Design work):**

- `brief.md` — the Claude Design starting prompt
- `inputs/` — files attached to the Claude Design project (persona excerpt, journey moment, curated scenarios, optional wireframe reference)
- `outputs/` — empty subfolders (`screenshots/`, `handoff/`) ready to receive captured artifacts

**Written after the Claude Design session:**

- `outputs/share-link.md` — Claude Design project URL + last-updated timestamp
- `outputs/screenshots/<NN>-<state>.png` and `outputs/screenshots/manifest.md`
- `outputs/handoff/` — raw handoff bundle from Claude Design's "Handoff to Claude Code" export
- `outputs/chat-excerpts.md` — quoted decisions worth remembering
- `decisions.md` — what was kept, discarded, kernel feedback

## Workflow (per surface)

1. AI authors `<surface>/brief.md` from kernel + scenarios + journey. Curates `inputs/`.
2. Human reviews the brief. Approved or revised.
3. AI opens a Claude Design project, pastes the brief, attaches inputs, iterates.
4. AI exports the result back to `<surface>/outputs/` and writes `decisions.md`.
5. If `decisions.md` flags kernel feedback, update the relevant `_kernel/` file and add a row to [`_kernel/CHANGES.md`](_kernel/CHANGES.md) before starting the next surface.
6. Human reviews the design.
7. Implementation pass (separate plan): handoff bundle integrated into `/site/`.

## Sequencing

**Phase 0 — Kernel.** Five kernel files drafted; fed into Claude Design organization onboarding.

**Phase 1 — Missing surfaces (no wireframe today).** In JTBD priority order:

1. Suggestion engine (pilot)
2. Multi-recipe `/cook.html`
3. Partner track `/partner.html`
4. Import flow
5. Energy-tier UI

**Phase 2 — Existing surfaces refresh.** Pool planner first (owns Wednesday Gap), then catalog hub, recipe overview, cooking view, web checklist, grocery list.

**Phase 3 — Validation.** Walk all 10 [journey maps](../strategy/journey-maps.md) through the resulting designs; document breaks.

## Reference

- [Framework spec](../superpowers/specs/2026-04-20-design-framework-design.md) — full rationale, scope, risks
- [Brief template](_template/brief.md) — what every surface brief contains
- [Information architecture](../strategy/information-architecture.md) — surface inventory and URL map
- [Personas](../strategy/personas.md), [JTBD](../strategy/jtbd.md), [Journey maps](../strategy/journey-maps.md) — strategic source material the kernel and briefs draw from
