# Permanent Wave MP4 Background — Implementation Plan

> **For agentic workers:** Execute task-by-task. Checkboxes track progress.

**Goal:** Ship one optimized 120s muted PS3-wave MP4 as the permanent ambient background and delete conflicting focus-mode / multi-video dead code.

**Architecture:** Keep `RouteBackground` dual-layer crossfade of a single source. Remove all focus-mode video/CSS/hooks. Darken fallback surfaces to match the wave.

**Tech Stack:** Next.js 16 App Router, H.264 static asset, `@repo/theme` CSS, existing client `RouteBackground`.

## Global Constraints

- pnpm only; no new deps; no `apps(legacy)/`; Zod N/A (no new input); Alignment ≥ 80 before done.

---

### Task 1: Asset

- [x] Place muted 120s `ps3-wave.1920x1080.mp4` under `apps/portal/public/background/`
- [x] Regenerate `auth-bg-poster.jpg` from a mid-clip frame

### Task 2: Purge dead focus-mode / dual-video CSS & hook

- [x] Strip `route-bg-focus*` and `body.focus-mode` blocks from `packages/theme/src/css/glass.css`
- [x] Strip `:is(body.focus-mode)` block from `packages/ui/src/globals.css`
- [x] Delete `packages/ui/src/lib/useFocusMode.ts`

### Task 3: Consolidate RouteBackground + cache

- [x] Add `poster` to video elements; ensure dark container/fallback
- [x] Add production Cache-Control for `/background/:path*`

### Task 4: Verify

- [x] ffprobe duration≈120, no audio, size≤7MB
- [x] Scoped lint/type-check / quality evidence + Alignment Score
