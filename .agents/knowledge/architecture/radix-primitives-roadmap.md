---
title: Addition Roadmap — primitives
tags: [reverse-engineer, roadmap, extraction, radix-primitives]
updated: 2026-07-23
source_agent: reverse-engineer
status: active
---

# Addition Roadmap: primitives

Extracted from `/tmp/reverse-engineer/radix-primitives` via `pnpm ai export-roadmap`.

## 1. Overview & Stack Summary

- **Repository**: `primitives`
- **Detected Files**: 351 source file(s)
- **Top Dependencies**: N/A

## 2. Monorepo Addition Candidates

### A. Candidate UI Primitives (`@repo/ui`)
- `internal/builder/builder.js`
- `internal/builder/radix-build.js`
- `packages/react/radix-ui/src/accessible-icon.ts`
- `packages/react/radix-ui/src/accordion.ts`
- `packages/react/radix-ui/src/alert-dialog.ts`
- `packages/react/radix-ui/src/aspect-ratio.ts`
- `packages/react/radix-ui/src/avatar.ts`
- `packages/react/radix-ui/src/checkbox.ts`
- `packages/react/radix-ui/src/collapsible.ts`
- `packages/react/radix-ui/src/context-menu.ts`
- `packages/react/radix-ui/src/dialog.ts`
- `packages/react/radix-ui/src/direction.ts`
- `packages/react/radix-ui/src/dropdown-menu.ts`
- `packages/react/radix-ui/src/form.ts`
- `packages/react/radix-ui/src/hover-card.ts`

### B. Candidate Utilities & Hooks (`@repo/utils`)
- `e2e/helpers.ts`
- `internal/test-utils/ref-stability.tsx`
- `internal/typescript-config/react-library/index.d.ts`

### C. Candidate Validation Schemas & Types (`@repo/contract`)
- `internal/typescript-config/react-library/index.d.ts`
- `packages/core/primitive/src/types.ts`
- `types/global.d.ts`
- `types/index.d.ts`

## 3. Integration & Porting Strategy

1. **Extraction**: Copy target source file into matching `@repo/*` package directory.
2. **Design Token Alignment**: Replace custom styling with `@repo/theme` Tailwind preset & CSS variables.
3. **Type Safety**: Ensure strict TypeScript 5.7+ compliance without `any` or `@ts-ignore`.
