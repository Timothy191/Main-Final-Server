# Agent Tracer Log

This file maintains a record of AI agent interventions, context hand-offs, and
architectural breadcrumbs for this package.

## [2026-08-03] Create @repo/acl — canonical, edge-safe access-control list

- **Agent**: Claude Code (glm-5.2)
- **Purpose**: Promote department ACL data + predicates out of inline copies in
  `apps/portal/src/proxy.ts` (edge) and `apps/portal/src/lib/dept-access.ts`
  (node) into a single shared package, killing the copy-drift (the proxy copy
  had a `tools` key that the dept-access copy lacked).
- **Changes Made**:
  - `packages/acl/src/index.ts`: `Role` type (open union via `(string & {})`),
    `DEPARTMENT_ROUTE_SLUGS`, `RESTRICTED_DEPT_ROLES` (route→role allowlists,
    incl. the cross-department `tools` second-segment + `admin` prefix), and
    pure predicates `normalizeRole`, `isDeptAllowedForRole`,
    `isRestrictedRouteAllowed`, `filterDepartmentsByRole`.
  - Edge-safety: **pure data + pure functions only** — no Node APIs, no
    `server-only`, no Supabase imports. The live `employees` lookup
    (`assertDeptRole`) stays in `dept-access.ts` because it needs a server
    Supabase client; only ACL _data_ and _predicates_ live here.
  - Rewired `proxy.ts` + `dept-access.ts` to import from `@repo/acl`.
  - `isRestrictedRouteAllowed`: `tools` excluded from the prefix loop (it is a
    second-segment gate, checked explicitly below) to avoid a future
    `/tools*` false positive.
- **Verification**: `pnpm --filter @repo/acl type-check` clean; both runtimes
  import from the package; ESLint resolves through the package.
- **Next Agent Notes**: (a) Keep this package edge-safe — no runtime deps, no
  server-only imports; if a predicate needs a Supabase client it belongs in
  `dept-access.ts`, not here. (b) When adding a restricted route, add a slug to
  `DEPARTMENT_ROUTE_SLUGS` and an entry to `RESTRICTED_DEPT_ROLES`; both
  `proxy.ts` and `dept-access.ts` pick it up automatically. (c) `tools` is a
  second-segment route (`/<dept>/tools`), not a top-level prefix — keep it out
  of the prefix loop in `isRestrictedRouteAllowed`.
