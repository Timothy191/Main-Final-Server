---
description: Testing rules and patterns for the Arch Systems monorepo
globs: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"]
---

# Testing Rules

## Runner & Config

- Test runner: Jest 30 with `@swc/jest` transform, `jsdom` environment.
- Run all tests: `pnpm test` (uses Turborepo, passes `--passWithNoTests`).
- Run single test: `pnpm --filter portal test -- -t "test name"`.
- Run single file: `pnpm --filter portal test -- path/to/file.test.ts`.
- Coverage thresholds: 40% lines, 30% branches, 35% functions, 40% statements.

## Test Placement

- Unit tests live next to the file: `foo.ts` → `foo.test.ts`.
- Integration tests for Server Actions: `__tests__/actions/`.
- Every new utility in `packages/` must have at least one test.
- Every Server Action must have at least one happy-path and one validation-failure test.

## Patterns

- Test behaviour and outputs, not implementation details.
- Mocking: prefer `jest.mock()` for external services.
- Never mock `@repo/utils` or `@repo/errors`.
- Module aliases in tests use `moduleNameMapper` in `jest.config.js` — `@repo/*` maps to source.
- Use `@testing-library/react` for component tests, `@testing-library/jest-dom` for matchers.

## Before Marking Done

- Run `pnpm quality` (lint + type-check + test + format:check) before marking any task complete.
