# Import & Path Checklist (Arch Systems)

## Forbidden patterns

| Pattern                                 | Why                        | Scan                                                                          |
| --------------------------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `packages/*` importing from `apps/`     | boundary violation         | `rg "from ['\"]\\.\\./.*apps/" packages/`                                     |
| `apps/portal` importing `apps(legacy)/` | deprecated tree            | `rg "apps\\(legacy\\)" apps/portal/`                                          |
| Server-only in client                   | bundle leak                | `@repo/supabase/server`, `@repo/redis`, `server-only` in `"use client"` files |
| `.js` extension in TS portal imports    | Turbopack resolve failures | `rg "from ['\"].*\\.js['\"]" apps/portal/src`                                 |
| Raw `new Error()` for domain failures   | policy                     | prefer `@repo/errors` in app code                                             |
| `fetch("/api/...")` from RSC            | boundary                   | grep Server Components                                                        |

## Required resolution

| Alias                  | Resolves via                                                |
| ---------------------- | ----------------------------------------------------------- |
| `@/*`                  | `apps/portal/tsconfig.json` → `./src/*`                     |
| `@repo/*`              | workspace package `package.json` `exports` + tsconfig paths |
| Relative cross-package | must target published export entry, not deep internals      |

## Verification commands

```bash
export PATH="/home/timothy/.npm-global/bin:$PATH"
cd /home/timothy/Projects

# Primary gate — unresolved imports surface here
pnpm type-check

# Scoped when diff is portal-only
pnpm --filter portal type-check

# Workspace policy
pnpm policy:gen   # if dependency boundaries changed
```

## Report each finding as

```text
[severity] path:line — import "X" — reason — suggested fix
```

Severities: `critical` (build broken), `high` (wrong boundary), `medium` (stale/dead), `low` (style/consistency).
