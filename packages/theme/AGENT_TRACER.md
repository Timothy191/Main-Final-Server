# Agent Tracer Log

This file maintains a record of AI agent interventions, context hand-offs, and architectural breadcrumbs for this specific package/app.

## [2026-06-05] AMCA Foundation / Initialization

- **Agent**: Antigravity
- **Changes**: Initialized tracing protocols globally as per user instruction.

## 2026-07-03 Asset consolidation — root `assets/` as canonical source

- **Purpose**: Update glass.css to reference consolidated asset paths.
- **Changes**:
  - `src/css/glass.css:1062`: `url("/focused-bg.jpeg")` → `url("/assets/focused-bg.jpeg")`.
- **Next Agent**: All shared assets now live in root `assets/` and are copied to portal `public/assets/` at dev time.

## [2026-07-07] Audit / next/font docs alignment

- **Agent**: Claude Code
- **Purpose**: Ensure theme CSS/preset does not override `next/font` self-hosted variables or misuse display fonts in the default stack.
- **Changes Made**:
  - `src/css/variables.css`: Removed static `--font-sans`, `--font-inter`, `--font-outfit`, and `--font-mono` declarations. These variables are now injected by `next/font` in `apps/portal/app/layout.tsx`; defining static stacks here overrode the metric-optimized self-hosted families.
  - `src/tailwind/preset.ts`: Removed `var(--font-anurati)` from the default `fontFamily.sans` array. Anurati remains available as `fontFamily.anurati` for selective use; it should not be the default body font.
- **Context**: The portal already loads `Inter`, `JetBrains_Mono`, and a local `Anurati` via `next/font/google` and `next/font/local` and applies their CSS variables to `<html>`. The theme layer was accidentally clobbering those variables and defaulting body text to a display face.
- **Next Agent**: If adding new Google/local fonts, load them in `apps/portal/app/layout.tsx` (or a shared fonts file) and pipe the variable into the preset. Never redefine `--font-sans`/`--font-mono` with static stacks in theme CSS.
