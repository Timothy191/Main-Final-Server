---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/__tests__/**"
  - "**/e2e/**"
  - "jest.config.*"
---

# Testing Rules

- **Stack:** Jest 30 + `@swc/jest`, jsdom, `@testing-library/react` (portal).
  Packages use their own Jest configs.
- **Naming:** unit tests are `*.test.ts(x)`; API routes use `*.spec.ts`.
- **Run:**
  - Single file: `pnpm --filter portal test -- path/to/file.test.tsx`
  - Full portal: `pnpm --filter portal test`
  - Package: `pnpm --filter <package> test`
- **Coverage thresholds (portal, enforced in `jest.config.cjs`):** Lines 40%,
  Branches 30%, Functions 35%, Statements 40%.
- **Mock at boundaries:** mock Supabase/Redis at the module boundary, never
  inside the component under test.
- **E2E / visual regression (Playwright):** `apps/portal/e2e/*.visual.test.ts`
  requires the dev server already running — Playwright does not start its own
  `webServer`. Base URL: `PLAYWRIGHT_BASE_URL` or `http://localhost:3000`.
- **Before declaring done:** `pnpm exec turbo run lint type-check test --force`
  (must show "0 cached") and `pnpm format:check`.
