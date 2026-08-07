# Repo Gotchas

Non-obvious traps in this monorepo. Mirrors the "Non-obvious gotchas" section
of [`AGENTS.md`](../../AGENTS.md). This file has no `paths:` frontmatter, so it
loads every session — keep it short and high-value.

- **`ci.yml` is stale** — it triggers on a `redis/` module directory that no
  longer exists at the repo root. `portal-ci.yml` is the real CI for
  portal/packages changes.
- **`_appdata/` is a FUXA SCADA data directory** (`settings.js`,
  `*.fuxap.db`, uiPort 1881). Treat as runtime data, not source — never edit,
  index, or rely on it.
- **`benchmark.js` and `benchmark-cache.db`** at repo root are local benchmark
  artifacts, not part of the build.
- **Turbo caches lint** — always use `--force`
  (`pnpm exec turbo run lint type-check test --force`); non-forced runs can
  return a stale PASS.
- **Ignore files must stay in sync:** critical patterns (`.turbo`,
  `.cocoindex_code/`, …) must exist in both `.gitignore` and `.claudeignore`
  (`guard:ignoresync`).
- **Client/server boundary:** components, hooks, `packages/ui`, and
  `packages/departments/ui` must never import `@repo/redis`, `@repo/database`,
  or `@repo/supabase/server` (`guard:imports`).
- **`@repo/database` (Kysely) is for type generation only** — never import it
  in app runtime code; use `@repo/supabase` clients.
- **Agent infrastructure** (`.cursor/`, `.agents/`, `.claude/`, …) must never
  become a runtime dependency of product code.
- **`pnpm agents:verify` runs in CI** — AGENTS.md links and structure must
  stay valid.
