# nextjs-fullstack — Workflow

## Scope

`apps/portal/` only. Never `apps(legacy)/`, never resurrect Nest `apps/api`. Ops control plane (`ops-gateway`) is out of scope unless the slice explicitly bridges it.

## DETECT → SLICE

1. Restate the user outcome (one line).
2. If >1 file / new route / new action → ensure `.kiro/specs/<slug>/` phases exist (or create).
3. Name AGENTS.md gates that apply (§3 stack, §18 never-dos, server/client).

## BOUNDARIES (hard)

| Layer             | Rule                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Server Components | Default; data via `@repo/supabase/server`, direct data fns — never `fetch("/api/...")` from RSC |
| Client            | `"use client"` on leaves only; never on layouts                                                 |
| Server Actions    | `"use server"` + Zod + `{ data } \| { error }` + revalidate                                     |
| Route Handlers    | `app/api/**` — Zod input; no service-role leakage to client                                     |
| Packages          | Call `@repo/*`; never put app logic into packages                                               |

## BUILD order

1. Data / schema contracts (`@repo/contract` Zod) if needed
2. Server data helpers / actions
3. Page + loading/error/metadata
4. Client interactivity last
5. Theme: `@repo/theme`, `--login-*` / `--os-shell-*` where shell/login chrome applies

## Design handoff

- Branded first viewport / landing hero → hand off to `frontend-design` first
- Pure presentational UI with no data/actions → prefer `frontend-implementer`
- New API service shape / caching strategy debate → consult `backend-architect`

## VERIFY

```bash
export PATH="/home/timothy/.npm-global/bin:$PATH"
ss -tlnp | rg ':3000' || true
curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 http://127.0.0.1:3000/login
pnpm --filter portal type-check   # or scoped lint/test for touched packages
```

Before done: `sceptic` (parent) → `agent-alignment-score`.

## Naming (portal)

`<Feature>Page`, `<Feature>Form`, `get|list|find<Resource>`, `create|update|delete<Resource>Action`, `interface <Name>Props`, page `metadata`.
