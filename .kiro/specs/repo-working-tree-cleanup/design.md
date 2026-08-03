# Design: Repo Working-Tree Cleanup

## Architecture

- Live portal: `apps/portal/src/` only (Next `src/app`, `@/*` → `./src/*`).
- Archives: `_app_legacy_shadow/`, `_features_legacy_shadow/` — not compiled.
- No changes to runtime auth/data boundaries.

## File operations

| Op              | Path                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| Confirm deleted | `apps/portal/app/**`                                                                     |
| Add             | `apps/portal/_app_legacy_shadow/**`                                                      |
| Delete          | `ai-backends/**`                                                                         |
| Rename          | `apps/portal/features/` → `apps/portal/_features_legacy_shadow/`                         |
| Rename finalize | `src/app/(hub)/` → `src/app/hub/`                                                        |
| Update          | `tsconfig.json` exclude both shadows; jest `collectCoverageFrom` drop root `features/**` |

## Boundaries

- No `"use client"` on layouts; no new deps; no secrets.
- Shadow trees are archival only — do not import from live code.

## Risks

- Outer `features/` edits were dead (`@/` → src). Archiving preserves them; live behavior uses `src/features`.
- Do not touch `apps/portal/src.backup/` in this pass (out of proposed scope).
