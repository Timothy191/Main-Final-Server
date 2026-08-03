---
name: frontend-api-integration-patterns
description: >-
  Production-ready patterns for frontend API integration: cancellation, retry,
  debounce, dedup, error normalization with @repo/errors. Use when building
  or reviewing async data fetching in apps/portal. Anti-trigger: do not
  duplicate ApiError locally; do not retry 4xx; do not skip AbortController cleanup.
risk: safe
source: community
tags:
  - frontend
  - api-integration
  - typescript
  - react
  - async
tools:
  - claude
  - cursor
  - gemini
  - codex
---

# Frontend API Integration Patterns

Correctness-first async patterns for the Arch Systems portal. Load references as needed — do not inline duplicate error types.

## When to use

- New hooks or components fetching from APIs
- Reviewing race conditions, stale data, or retry logic
- Normalizing errors across portal and API

## Workflow

1. Read [`references/repo-mapping.md`](references/repo-mapping.md) — use existing `@repo/errors`, never redefine
2. Apply patterns from [`references/core-patterns.md`](references/core-patterns.md)
3. Check [`references/anti-patterns.md`](references/anti-patterns.md) before merge
4. See [`references/examples.md`](references/examples.md) for full implementations

## References

| File                                                           | Content                                         |
| -------------------------------------------------------------- | ----------------------------------------------- |
| [`references/repo-mapping.md`](references/repo-mapping.md)     | This repo's modules and imports                 |
| [`references/core-patterns.md`](references/core-patterns.md)   | API layer, cancellation, retry, debounce, dedup |
| [`references/examples.md`](references/examples.md)             | Prediction, search, optimistic UI               |
| [`references/best-practices.md`](references/best-practices.md) | Practices and pitfalls tables                   |
| [`references/anti-patterns.md`](references/anti-patterns.md)   | SAP violations to avoid                         |
| [`references/limitations.md`](references/limitations.md)       | React Query / idempotency notes                 |

## Assets

No static templates required — patterns are TypeScript reference implementations in `references/`.
