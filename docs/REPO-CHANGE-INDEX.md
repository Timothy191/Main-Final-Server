# Repo Change Index

**Canonical, append-only log of every change to the Arch-System repo.**

Every agent appends one entry per change (one per commit is fine) before
declaring the work done. This is a global rule — see
[`../AGENTS.md`](../AGENTS.md) → "Repo change index — a global rule".

This index is the **temporal** companion to the structural
[`WAYFINDER.md`](./WAYFINDER.md): the wayfinder says _what is here_, the change
index says _how it got here_.

## Entry format

Append to the table, **newest at the top**. One row per change.

| Date       | Agent            | Area          | Summary                                                                                                                                                                     | Files                                                                                                                                                    | Docs updated                                                               |
| ---------- | ---------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 2026-08-03 | Claude (glm-5.2) | acl           | Promote department ACL into edge-safe `@repo/acl` package; rewire `proxy.ts` + `dept-access.ts` to import from it (kills the inline-copy drift, incl. missing `tools` key). | `packages/acl/**`, `apps/portal/src/proxy.ts`, `apps/portal/src/lib/dept-access.ts`, `apps/portal/package.json`                                          | `docs/WAYFINDER.md`, `apps/portal/AGENT_TRACER.md`                         |
| 2026-08-03 | Claude (glm-5.2) | cache         | Cache/auth coherence: AGENT-TRACE the 300s employee-auth staleness seam in `proxy.ts`; extend `/api/cache/invalidate` with a `userId` → `cacheEvictL1ByPrefix` hook.        | `apps/portal/src/proxy.ts`, `apps/portal/src/app/api/cache/invalidate/route.ts`, `apps/portal/src/lib/department-cache.ts`                               | `docs/WAYFINDER.md`, `apps/portal/AGENT_TRACER.md`                         |
| 2026-08-03 | Claude (glm-5.2) | design-system | Standalone R2 ratchet gate (`design-ratchet.mjs`) + `generated.ts` shape guard (`theme-shape-guard.mjs`); both non-turbo-cached, baseline-grandfathered.                    | `tools/design-ratchet.mjs`, `tools/design-ratchet.baseline.json`, `tools/theme-shape-guard.mjs`, `tools/theme-shape-guard.baseline.json`, `package.json` | `docs/design-system/RULES.md` (R7), `docs/WAYFINDER.md`                    |
| 2026-08-03 | Claude (glm-5.2) | meta          | Established the doc-maintenance + change-index global rule and the wayfinder; seeded this index.                                                                            | `AGENTS.md`, `docs/REPO-CHANGE-INDEX.md`, `docs/WAYFINDER.md`, `CLAUDE.md`                                                                               | `AGENTS.md`, `docs/REPO-CHANGE-INDEX.md`, `docs/WAYFINDER.md`, `CLAUDE.md` |

- **Area** — a wayfinder concept where possible (`acl`, `errors`, `design-system`, `cache`, `portal/auth`, …).
- **Files** — the product files changed in the commit (not docs).
- **Docs updated** — every doc changed in the same commit. `none` is a red flag — if you changed behavior, some doc should reflect it.

## Rules

1. **Never delete or edit a past row** — append only. Corrections go in a new row.
2. **One row per change**, not per file. Group a commit's files into one entry.
3. **Before "done"** — if the row is missing, the change is not done.
