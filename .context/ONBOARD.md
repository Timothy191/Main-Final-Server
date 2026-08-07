# Arch-System — Agent Fast Start

**Oil & gas field operations portal.** pnpm 9 monorepo · Next.js 16 App Router · React 19 · Supabase · Redis L1/L2 · TypeScript.

> **Read `AGENTS.md` before any non-trivial work.** This file is a fast-start map only.

---

## Stack at a Glance

| Layer      | Technology                            | Entry Point                        |
| ---------- | ------------------------------------- | ---------------------------------- |
| App        | Next.js 16 (App Router, Turbopack)    | `apps/portal/src/app/`             |
| Edge auth  | `proxy.ts` (NOT middleware.ts)        | `apps/portal/src/proxy.ts`         |
| ACL        | `@repo/acl` (department slugs, roles) | `packages/acl/src/index.ts`        |
| Data       | Supabase (Postgres + RLS)             | `@repo/supabase` clients           |
| Cache      | Redis L1 (RAM) + L2 (cluster)         | `packages/redis/src/cache.ts`      |
| Validation | Zod schemas                           | `packages/contract/index.ts`       |
| Errors     | Typed `AppError` subclasses           | `packages/errors/src/index.ts`     |
| UI         | Glass components                      | `packages/ui/` + `packages/theme/` |

---

## Common Commands

```bash
pnpm dev                   # Start full stack (Redis → Supabase → portal)
pnpm dev:quick             # Skip Redis, start Supabase + portal
pnpm dev:no-infra          # Assume Redis + Supabase already running

# Quality (always use --force — Turbo caches lint)
pnpm exec turbo run lint type-check test --force
pnpm gates                 # Full 13-check CI gate suite
pnpm format:check          # Prettier check

# Supabase
pnpm supabase:start        # Start local Docker stack
pnpm supabase:stop

# Single package
pnpm --filter portal lint
pnpm --filter @repo/acl type-check
```

---

## Critical Rules (Abbreviated)

1. **Never create `middleware.ts`** — edge routing is in `proxy.ts` only.
2. **Never duplicate ACL inline** — always import from `@repo/acl`.
3. **Never import `@repo/redis`, `@repo/database`, `@repo/supabase/server` from client dirs**.
4. **Never run `generate-tokens.mjs`** — edit `packages/theme/src/css/variables.css` directly.
5. **Always throw `AppError` subclasses**, never plain `Error`.
6. **After each change**: append to `docs/REPO-CHANGE-INDEX.md` + `.agents/AGENT_TRACER.md`.
7. **Design system changes**: follow `docs/design-system/RULES.md` → `SPEC.md` → `DESIGN.md`.

---

## Request Path (Simplified)

```
Browser
  │
  ▼
proxy.ts (edge) ─── session refresh + ACL check ─── @repo/acl
  │
  ├── /api/* ──────────────── API Route Handlers ──── @repo/contract (Zod)
  │                                                    @repo/errors (AppError)
  │
  └── pages ───────────────── Server Components ────── @repo/redis (L1/L2 cache)
                                                        @repo/supabase (Postgres)
```

---

## Department Routes

Slugs: `drilling` · `production` · `access-control` · `engineering` ·
`control-room` · `safety` · `training` · `satellite-monitoring`

Route pattern: `app/(departments)/[department]/`

---

## MCP Tools (Use These, Not Grep)

| Tool               | Use For                                             |
| ------------------ | --------------------------------------------------- |
| `search_graph`     | Find functions, classes, routes by pattern          |
| `trace_path`       | Who calls a function / what it calls                |
| `get_code_snippet` | Read specific function/class source                 |
| `query_graph`      | Complex Cypher queries                              |
| `get_architecture` | High-level project summary                          |
| `grep_search`      | String literals, error messages, config values ONLY |

Full MCP registry: `.mcp/README.md`

---

## Key Files Map

| What you need      | Where it is                            |
| ------------------ | -------------------------------------- |
| Full agent policy  | `AGENTS.md`                            |
| Structural index   | `docs/WAYFINDER.md`                    |
| Design rules       | `docs/design-system/RULES.md`          |
| CSS tokens         | `packages/theme/src/css/variables.css` |
| Migrations         | `packages/supabase/migrations/`        |
| API route index    | `.api/routes.json`                     |
| CI gates reference | `AGENTS.md` → "CI gate tools" table    |
| Runbooks           | `docs/runbooks/`                       |
