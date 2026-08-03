# Test Conventions & Critical Rules

## Project Test Conventions

- **Framework**: Jest (unit/integration), `@testing-library/react` (component), Playwright (E2E — when added)
- **Config**: `apps/portal/jest.config.ts` with `setupFilesAfterSetup: ["<rootDir>/setupTests.ts"]`
- **Run**: `npx jest --testPathPatterns=<name>` (target one), `pnpm quality` (full gate)
- **Fake IndexedDB**: Use `fake-indexeddb/auto` for hooks that touch IndexedDB (see `useOfflineQueue.test.ts`)
- **Mocking**: `jest.fn()` for fetch, `jest.spyOn` for DOM APIs; prefer `renderHook` from `@testing-library/react`
- **Assertions**: `@testing-library/jest-dom` matchers; assert both positive and negative cases

## Critical Rules

1. **No hard sleeps. Ever.** Wait on conditions — never wall-clock time.
2. **Tests own their data.** Each test creates what it needs; no shared mutable seed state.
3. **Determinism first.** New tests must pass `--repeat-each=10` before merge.
4. **E2E is the top of the pyramid.** Unit/API when possible.
5. **Quarantine fast, root-cause always.** Flaky tests leave merge-blocking suite within 24h.
6. **Every failure must be debuggable from artifacts.** Trace, screenshot, video, console, network.

## Test Pyramid

```
     ╱ E2E ╲          ← Critical user journeys only (auth, checkout, core CRUD)
    ╱────────╲
   ╱ Integration╲     ← API routes, Server Actions, hooks with real DB
  ╱──────────────╲
 ╱    Unit Tests    ╲  ← Pure functions, utilities, component logic
╱────────────────────╲
```

## Workflow

1. Assess coverage gaps (missing, flaky, slow tests)
2. Design strategy: unit vs integration vs E2E
3. Implement per conventions; Zod validation failure paths included
4. Verify with `pnpm quality` — no regressions, no new flakes
5. Document patterns for repeatability
