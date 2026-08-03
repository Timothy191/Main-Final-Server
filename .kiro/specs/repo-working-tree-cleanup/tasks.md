# Tasks: Repo Working-Tree Cleanup

1. [x] Commit A: stage delete `apps/portal/app/`, add `_app_legacy_shadow/`.
2. [x] Commit C: remove `ai-backends/`.
3. [x] Commit E: `git mv features _features_legacy_shadow`; exclude in tsconfig; fix jest coverage paths.
4. [x] Commit B: finalize hub route move to `src/app/hub/`.
5. [x] Commit D: remaining portal product edits under `apps/portal/src` + related portal config.
6. [x] Commit F: packages/theme, eslint-config, root lockfile/package/turbo.
7. [x] Commit G: agent/docs/hooks (`.cursor`, `.kiro`, `.husky`, AGENTS/CLAUDE).
8. [x] Verify structure + runtime; quality attempted (blocked by pre-existing errors). - Working tree clean (`d28e2f55` fixed dirty `library.js` / missing `only-warn`). - Disk: no `apps/portal/app` or `apps/portal/features`; shadows gitignored locally. - Runtime: `/login` 200, `/hub` 200. - `pnpm quality` FAIL: `@repo/auth` type-check (missing `../database`, `@types/node`). - `pnpm --filter portal type-check` FAIL: pre-existing portal/package TS errors
       (inngest dupes, weather-api, proxy.test exports, react types) — not introduced by A–G. - Remote still empty — push pending (backup risk, not structural).
