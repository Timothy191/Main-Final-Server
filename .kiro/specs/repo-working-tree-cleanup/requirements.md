# Requirements: Repo Working-Tree Cleanup

## Goal

Consolidate the dirty local working tree into one clean `main` history with clear commits, without breaking the live portal (`apps/portal/src/`).

## Acceptance Criteria

1. `apps/portal/app/` remains absent (no root App Router shadowing `src/app`).
2. Legacy root app copy is preserved at `apps/portal/_app_legacy_shadow/` and excluded from TypeScript.
3. Dead `ai-backends/` is removed from the tree.
4. Duplicate `apps/portal/features/` is removed from the live path; unique content archived under `apps/portal/_features_legacy_shadow/` and excluded from TypeScript/Jest collection of live sources.
5. Hub routes live under `apps/portal/src/app/hub/` (not `(hub)`).
6. Remaining portal/product, package, and agent/docs changes are committed in separate buckets.
7. `@/features/*` continues to resolve only to `apps/portal/src/features/*`.
8. Portal serves on `:3000` after cleanup (`/login` reachable).
