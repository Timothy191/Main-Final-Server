---
title: Addition Roadmap — ui
tags: [reverse-engineer, roadmap, extraction, shadcn-ui]
updated: 2026-07-23
source_agent: reverse-engineer
status: active
---

# Addition Roadmap: ui

Extracted from `/tmp/reverse-engineer/shadcn-ui` via `pnpm ai export-roadmap`.

## 1. Overview & Stack Summary

- **Repository**: `ui`
- **Detected Files**: 1920 source file(s)
- **Top Dependencies**: @babel/core, @changesets/changelog-github, @changesets/cli, @commitlint/cli, @commitlint/config-conventional, @ianvs/prettier-plugin-sort-imports, @manypkg/cli, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, autoprefixer

## 2. Monorepo Addition Candidates

### A. Candidate UI Primitives (`@repo/ui`)
- `apps/v4/components/active-theme.tsx`
- `apps/v4/components/analytics.tsx`
- `apps/v4/components/announcement.tsx`
- `apps/v4/components/block-display.tsx`
- `apps/v4/components/block-image.tsx`
- `apps/v4/components/block-viewer.tsx`
- `apps/v4/components/blocks-nav.tsx`
- `apps/v4/components/callout.tsx`
- `apps/v4/components/cards/activity-goal.tsx`
- `apps/v4/components/cards/calendar.tsx`
- `apps/v4/components/cards/chat.tsx`
- `apps/v4/components/cards/cookie-settings.tsx`
- `apps/v4/components/cards/create-account.tsx`
- `apps/v4/components/cards/exercise-minutes.tsx`
- `apps/v4/components/cards/forms.tsx`

### B. Candidate Utilities & Hooks (`@repo/utils`)
- `apps/v4/hooks/use-colors.ts`
- `apps/v4/hooks/use-config.ts`
- `apps/v4/hooks/use-copy-to-clipboard.ts`
- `apps/v4/hooks/use-delayed-status.ts`
- `apps/v4/hooks/use-layout.tsx`
- `apps/v4/hooks/use-media-query.tsx`
- `apps/v4/hooks/use-meta-color.ts`
- `apps/v4/hooks/use-mobile.ts`
- `apps/v4/hooks/use-mounted.ts`
- `apps/v4/hooks/use-mutation-observer.ts`
- `apps/v4/hooks/use-search-registry.ts`
- `apps/v4/lib/ai.ts`
- `apps/v4/lib/blocks.ts`
- `apps/v4/lib/categories.ts`
- `apps/v4/lib/changelog.ts`

### C. Candidate Validation Schemas & Types (`@repo/contract`)
- `apps/v4/app/typeset.css/route.ts`
- `apps/v4/examples/aria/sonner-types.tsx`
- `apps/v4/examples/base/sonner-types.tsx`
- `apps/v4/examples/radix/sonner-types.tsx`
- `packages/helpers/src/core/types.ts`
- `packages/helpers/src/tanstack-ai/types.ts`
- `packages/helpers/src/test/chat-contract.ts`
- `packages/react/src/message-scroller/types.ts`
- `packages/shadcn/src/registry/schema.test.ts`
- `packages/shadcn/src/registry/schema.ts`
- `packages/shadcn/src/schema/index.ts`
- `packages/tests/src/tests/typeset.test.ts`

## 3. Integration & Porting Strategy

1. **Extraction**: Copy target source file into matching `@repo/*` package directory.
2. **Design Token Alignment**: Replace custom styling with `@repo/theme` Tailwind preset & CSS variables.
3. **Type Safety**: Ensure strict TypeScript 5.7+ compliance without `any` or `@ts-ignore`.
