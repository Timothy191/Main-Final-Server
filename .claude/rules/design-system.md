---
paths:
  - apps/portal/src/components/**
  - packages/ui/**
  - packages/theme/**
  - packages/departments/ui/**
---

# Design System Rules

Every change touching visual surfaces in `apps/`, `packages/ui/`, or
`packages/theme/` **must**:

1. Follow [`docs/design-system/RULES.md`](../../docs/design-system/RULES.md) —
   the enforceable must/must-not list.
2. Apply tokens from [`docs/design-system/SPEC.md`](../../docs/design-system/SPEC.md).
3. Read [`docs/design-system/DESIGN.md`](../../docs/design-system/DESIGN.md)
   for intent before changing visuals.

Token changes must update docs in the same change:

- Token value added/removed → update **SPEC.md**.
- Structural decision → ADR in
  [`packages/theme/DECISIONS.md`](../../packages/theme/DECISIONS.md) + **DESIGN.md**.

Hard rules:

- **Never** run `generate-tokens.mjs` for CSS edits — it drops `--arch*`
  primitives. Edit [`packages/theme/src/css/variables.css`](../../packages/theme/src/css/variables.css)
  directly. Guarded by `tools/theme-shape-guard.mjs`.
- Reuse `@repo/ui` primitives (GlassCard, GlassButton, …) before building
  custom glass surfaces; the `tools/design-ratchet.mjs` gate enforces the
  baseline.

Verify before done: `pnpm design:ratchet` and `pnpm theme:shape` (part of
`pnpm gates`).
