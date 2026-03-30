## Quality Validation

### Pre-Commit Checklist

Before committing, verify ALL of the following:

- [ ] TypeScript: `pnpm run typecheck` passes with zero errors
- [ ] Lint: `pnpm run lint` passes
- [ ] Tests: `pnpm run test` passes
- [ ] Scenarios: Referenced scenarios in the PRD task are supported by the implementation
- [ ] Build: `pnpm run build` succeeds
- [ ] No `console.log`/`console.debug` left in production code
- [ ] No TODO/FIXME comments introduced without a corresponding PRD task
- [ ] No `any` types introduced unless justified in state/decisions.md
- [ ] Commit message is clear and describes what AND why
- [ ] UI patterns: New pages follow exemplar patterns (loading/error/empty states, form `<form>` wrappers, delete confirmation, accessible labels) — study `WidgetListPage.tsx`

Run feedback loops in this order: typecheck → lint → test → scenarios → build.

**The iron rule: every check must run and pass before you commit.** No exceptions. If a check fails, fix it. If a command errors out, fix the command. "The tool wouldn't let me" is not an acceptable outcome — diagnose why and resolve it. A skipped check is a failed check. Do not note failures in progress and move on. Do not commit with known broken checks. Fix it or don't commit.

If a fix requires changing the approach, record the pivot in state/decisions.md.

### Scenario Validation

For each scenario referenced by the current PRD task:
1. Read the scenario file in `scenarios/`
2. Walk through each step — does the implementation support it?
3. Run E2E tests: `pnpm test:frontend:e2e`. Playwright's `webServer` config auto-starts backend and frontend dev servers — no manual server management needed.
4. If a scenario step cannot be satisfied yet, note it in your progress entry
5. Update satisfaction count in state/progress.md (scenarios passing / total referenced)

### Commit Hygiene

- One logical change per commit
- Commit message: imperative mood, max 72 chars first line
- If you need to explain "why", use the commit body
- Never commit generated files, build artifacts, or node_modules

### Debugging with Traces

When a test fails or an error is hard to diagnose, use OTel traces (requires `OTEL_ENABLED=true` and `docker compose up jaeger`):

1. Reproduce the error
2. `curl http://localhost:8888/api/debug/traces?service=template-backend&limit=5` — find the failing request
3. `curl http://localhost:8888/api/debug/traces/<trace_id>` — see the full waterfall (HTTP -> middleware -> SQL)
4. Or check `http://localhost:16686` (Jaeger UI)

Pino logs include `trace_id` — grep for it to correlate logs with traces.

### Code Quality

This codebase will outlive you. Every shortcut you take becomes someone else's burden. Every hack compounds into technical debt that slows the whole team down. Fight entropy. Leave the codebase better than you found it.
