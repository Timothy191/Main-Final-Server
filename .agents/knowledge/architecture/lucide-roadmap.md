---
title: Addition Roadmap — lucide
tags: [reverse-engineer, roadmap, extraction, lucide]
updated: 2026-07-23
source_agent: reverse-engineer
status: active
---

# Addition Roadmap: lucide

Extracted from `/tmp/reverse-engineer/lucide` via `pnpm ai export-roadmap`.

## 1. Overview & Stack Summary

- **Repository**: `lucide`
- **Detected Files**: 281 source file(s)
- **Top Dependencies**: N/A

## 2. Monorepo Addition Candidates

### A. Candidate UI Primitives (`@repo/ui`)
- `packages/icons/src/build.ts`
- `packages/icons/src/buildLucideDataUri.ts`
- `packages/icons/src/buildLucideIconElement.ts`
- `packages/icons/src/buildLucideIconNode.ts`
- `packages/icons/src/buildLucideSvg.ts`
- `packages/icons/tests/buildLucideIconElement.spec.ts`
- `packages/icons/tests/buildLucideIconNode.spec.ts`
- `packages/icons/tests/buildLucideSvg.spec.ts`
- `tools/build-font/oslllo-svg-fixer.d.ts`
- `tools/build-font/src/allocateCodepoints.spec.ts`
- `tools/build-font/src/allocateCodepoints.ts`
- `tools/build-font/src/buildFont.spec.ts`
- `tools/build-font/src/buildFont.ts`
- `tools/build-font/src/helpers.spec.ts`
- `tools/build-font/src/helpers.ts`

### B. Candidate Utilities & Hooks (`@repo/utils`)
- `docs/.vitepress/lib/SvgPreview/Backdrop.tsx`
- `docs/.vitepress/lib/SvgPreview/Diff.tsx`
- `docs/.vitepress/lib/SvgPreview/GapViolationHighlight.tsx`
- `docs/.vitepress/lib/SvgPreview/index.tsx`
- `docs/.vitepress/lib/SvgPreview/path-to-points.ts`
- `docs/.vitepress/lib/SvgPreview/types.ts`
- `docs/.vitepress/lib/SvgPreview/utils.ts`
- `docs/.vitepress/lib/categories.ts`
- `docs/.vitepress/lib/codeExamples/createCodeExamples.ts`
- `docs/.vitepress/lib/codeExamples/createLabCodeExamples.ts`
- `docs/.vitepress/lib/codeExamples/highLightCode.ts`
- `docs/.vitepress/lib/codeExamples/types.ts`
- `docs/.vitepress/lib/fetchPackages.ts`
- `docs/.vitepress/lib/generateZip.ts`
- `docs/.vitepress/lib/getFallbackZip.tsx`

### C. Candidate Validation Schemas & Types (`@repo/contract`)
- `docs/.vitepress/lib/SvgPreview/types.ts`
- `docs/.vitepress/lib/codeExamples/types.ts`
- `docs/.vitepress/theme/types.ts`
- `docs/.vitepress/types.d.ts`
- `packages/angular/src/types.ts`
- `packages/astro/src/types.ts`
- `packages/astro/tests/utils/types.ts`
- `packages/icons/src/types.ts`
- `packages/lucide/src/attributeTypes.ts`
- `packages/lucide/src/types.ts`
- `packages/lucide-preact/src/types.ts`
- `packages/lucide-react/src/types.ts`
- `packages/lucide-react-native/src/types.ts`
- `packages/lucide-solid/src/types.ts`
- `packages/shared/src/utility-types.ts`

## 3. Integration & Porting Strategy

1. **Extraction**: Copy target source file into matching `@repo/*` package directory.
2. **Design Token Alignment**: Replace custom styling with `@repo/theme` Tailwind preset & CSS variables.
3. **Type Safety**: Ensure strict TypeScript 5.7+ compliance without `any` or `@ts-ignore`.
