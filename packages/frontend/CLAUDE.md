# Frontend CLAUDE.md

React 19 application with XState v5 state management and Material-UI 7.

## Tech Stack

- **React 19** with React Compiler (babel-plugin-react-compiler)
- **XState v5** - State machines for all workflow state
- **Material-UI 7** (Emotion) - Component library
- **Vite** - Build tool with code splitting
- **Axios** - HTTP client (proxied to backend via Vite/Caddy)

## State Management Rules

**XState v5 manages:**

- All workflow state
- Navigation between steps
- Form data and validation
- API request/response state

**useState ONLY for:**

- Dialog open/close state
- Transient input field values
- UI-only effects (expand/collapse, hover states)

**NEVER use useState for workflow state.**

## Architecture

```
src/
├── machines/       # XState v5 state machines (source of truth)
├── hooks/          # Machine accessor hooks (wrap useMachine)
├── components/     # React components (Material-UI)
├── providers/      # React Context providers
├── services/       # API integration (axios)
├── types/          # TypeScript types (re-exports @template/types)
└── test/           # Test setup and utilities
```

## Path Alias

`@/` resolves to `src/`:

```typescript
import { useExampleMachine } from "@/hooks/useExampleMachine";
```

## Commands

```bash
pnpm dev               # Vite dev server (port 3000)
pnpm build             # Production build (tsc + vite build)
pnpm type-check        # TypeScript check only
pnpm test              # Vitest unit tests
pnpm test:e2e          # Playwright E2E tests
pnpm test:e2e:ui       # Playwright UI mode (interactive)
pnpm test:e2e:typecheck  # Type-check E2E test files
pnpm test:e2e:coverage   # E2E with V8 coverage (Chromium only)
```

## Testing

- **Unit tests** (Vitest + happy-dom): `src/**/*.test.ts(x)` — State machines, components
- **E2E tests** (Playwright): `tests/**/*.spec.ts` — Full workflows

### E2E Test Infrastructure

```
tests/
├── shared/
│   ├── coverage-fixture.ts   # V8 coverage collection (E2E_COVERAGE=true)
│   ├── error-capture.ts      # Auto-fail on console.error (extends coverage)
│   ├── fixtures.ts           # TIMEOUTS, BACKEND_URL, TEST_DATA constants
│   ├── helpers.ts            # API-based setup/teardown + generic helpers
│   └── selectors.ts          # Centralized data-testid constants
├── example.spec.ts           # Example spec (smoke tests)
└── tsconfig.json             # Strict TS config for test files
```

**Fixture chain:** `@playwright/test` → `coverage-fixture` → `error-capture` → spec files

**Import pattern** — always import from `error-capture`, never directly from `@playwright/test`:

```typescript
import { expect, test } from "../shared/error-capture";
```

**Error capture:** Auto-fails tests on `console.error()` or unhandled exceptions. Known harmless patterns (OTel SendBeacon, React DOM nesting warnings, 404 resource loads) are filtered in `IGNORED_PATTERNS`. Add new patterns when browser noise causes false failures.

**Selectors:** Centralize `data-testid` values in `tests/shared/selectors.ts`. Use them in components (`data-testid={WIDGETS.LIST}`) and specs (`page.getByTestId(WIDGETS.LIST)`).

**Test data setup:** Use API-based helpers (`createEntityViaApi`, `clearEntitiesViaApi`) in `beforeEach` for isolation — not UI-driven setup. See `helpers.ts` for the full pattern.

**Coverage:** `E2E_COVERAGE=true` enables V8 code coverage via Playwright's Coverage API. Chromium only. Output lands in `.nyc_output/` for `nyc report`.

### Ralph/AI Agent E2E Debugging Workflow

1. E2E test fails → check Playwright HTML report (`test-results/`)
2. On retry, Playwright captures a trace → open with `npx playwright show-trace`
3. For backend errors, extract `trace_id` from Pino logs
4. `curl http://localhost:8888/api/dev/trace-by-otel/{trace_id}` → dev logger entries
5. `curl http://localhost:8888/api/debug/traces/{trace_id}` → full OTel request waterfall

## Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Machines: `kebab-case.machine.ts`
- Types: `camelCase.ts`

## Import Rules

**MUI direct imports (CRITICAL):** Always import MUI components from their direct paths, never from the barrel:

```typescript
// CORRECT
import Button from "@mui/material/Button";
import { createTheme } from "@mui/material/styles";

// WRONG — forces Vite to parse all 100+ MUI component modules
import { Button } from "@mui/material";
```

Same rule for `@mui/icons-material`: `import DeleteIcon from "@mui/icons-material/Delete"`.

Use `@mui/material/styles` for `createTheme`, `ThemeProvider`, `useTheme`, `styled`.

## React 19 Patterns

**React Compiler** (`babel-plugin-react-compiler` target: "19") automatically handles memoization and static JSX hoisting. Do NOT add `React.memo()`, `useMemo`, or `useCallback` for performance — only for semantic correctness.

**`use()` over `useContext()`** — prefer `use(MyContext)` in new code.

**`ref` as prop** — pass `ref` as a regular prop, do not use `forwardRef`.

## Composition Patterns

When a component accumulates boolean props, refactor:

1. **Explicit variants** — separate components instead of boolean modes
2. **Compound components** — shared context, composable pieces
3. **Children over render props** — JSX children, not render functions
4. **Provider for state** — lift shared state to a provider

## UI Patterns (Web Interface Guidelines)

New pages and components must follow the patterns demonstrated in the exemplars (`WidgetListPage.tsx`, `App.tsx`, `index.html`). These follow the [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines).

**Accessibility:**

- Heading hierarchy: `h1` for page title, `h2` for section titles, sequential `h3`+
- `text-wrap: balance` on all headings (prevents orphaned words)
- Icon buttons need descriptive `aria-label` including the item name: `aria-label={`Delete ${item.name}`}`
- Skip link target: main content container gets `id="main-content"`

**Forms:**

- Wrap dialog content in `<form onSubmit={...}>` — Enter key must submit
- All inputs need `name` and `autoComplete` attributes
- `autoFocus={!fullScreen}` — disable on mobile where it triggers the keyboard unexpectedly

**Loading, Empty, and Error States:**

- Loading: show `CircularProgress` while fetching data
- Empty: show a helpful message when the list is empty ("No widgets yet. Create one to get started.")
- Error: dismissable `Alert severity="error"` with the error message; wrap all API calls in try/catch
- Submit buttons: disabled + loading text during async operations ("Creating…", "Saving…", "Deleting…")

**Destructive Actions:**

- Always show a confirmation dialog before delete — never immediate
- Use `color="error"` on the confirm button
- Include the item name in curly quotes: `"Are you sure you want to delete "Widget Name"?"`

**Typography and Copy:**

- Ellipsis character `…` (not `...`), curly quotes `""` (not `""`)
- Specific button labels: "Create Widget", "Save Changes" (not "Submit", "OK", "Save")
- Loading text ends with `…`: "Creating…", "Saving…"

**Exemplar:** Study `src/pages/WidgetListPage.tsx` for the complete pattern before building new CRUD pages.

## Observability

Browser-side OpenTelemetry tracing is available when `VITE_OTEL_ENABLED=true`.

- `src/telemetry.ts` — OTel setup (XHR, document load, user interaction instrumentation)
- `src/utils/xstate-otel.ts` — XState v5 inspection events emitted as OTel spans
- `src/components/ErrorBoundary.tsx` — React error boundary that records exceptions as OTel spans

To trace XState machines, pass the inspector to `useMachine` or `createActor`:

```typescript
import { otelInspector } from "@/utils/xstate-otel";
useMachine(machine, { inspect: otelInspector });
```

Traces flow to Jaeger via the Vite dev proxy (`/v1/traces` -> `localhost:4318`).
