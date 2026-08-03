---
description: Spec-driven workflow enforcement for agent tasks
globs: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.md"]
---

# Spec-Driven Workflow

## Rule: Multi-File Changes Require Specs

Any change affecting >1 file must have `.kiro/specs/{feature-slug}/` with three artifacts
**before** implementation starts.

## Three Phases

| Phase | File | Must contain |
|-------|------|-------------|
| 1. Requirements | `requirements.md` | Numbered acceptance criteria, scope boundaries, ambiguities |
| 2. Design | `design.md` | Architecture, data flow, server/client boundaries, file list, env vars |
| 3. Tasks | `tasks.md` | Smallest testable units, dependency order, quality gates |

Templates: `.kiro/templates/` (requirements, design, tasks).

## Enforcement

- **Pre-change:** If >1 file modified/created and spec missing → BLOCK, create specs first
- **During:** Each task needs `pnpm quality` pass before marking complete
- **Post:** All acceptance criteria verified, all tasks complete, spec updated

## Exceptions

- Single-file bug fixes, docs, config tweaks, minor refactors
- Emergency hotfixes (must create retrospective spec after)

## Quality Gate (before marking done)

1. `pnpm quality` passes
2. No `any` introduced
3. No secrets committed
4. Server/client boundaries respected
5. New env vars in `.env.example`
6. Errors use `@repo/errors` AppError subclasses
