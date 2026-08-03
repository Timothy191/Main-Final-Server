# Portal Migration Design

## Architecture Overview

The migration involves copying the entire legacy portal application into the new portal structure, then adapting it to work with the existing monorepo setup.

> **⚠️ Routing conflict (flagged 2026-07-19):** This spec's source is
> `apps(legacy)/portal/`, but `AGENTS.md` / `QUICK_REFERENCE.md` state
> `apps(legacy)/` is **deprecated — never route work here / DO NOT MODIFY**.
> Resolve this before routing any execution: confirm the legacy tree is still
> the intended source, or update this spec to reference the current location.
> Do not start Task 3-style copy work until the conflict is signed off.

## File Structure Changes

### Source: `apps(legacy)/portal/`

### Destination: `apps/portal/`

### Key Directories to Migrate

1. **Route Segments** (`app/`)
   - `app/(auth)/` → `src/app/(auth)/`
   - `app/(hub)/` → `src/app/(hub)/`
   - `app/(departments)/` → `src/app/(departments)/`
   - `app/access-card-actions/` → `src/app/access-card-actions/`
   - `app/access-control/` → `src/app/access-control/`
   - `app/drilling/` → `src/app/drilling/`
   - `app/engineering/` → `src/app/engineering/`
   - `app/training/` → `src/app/training/`

2. **Feature Components** (`features/`)
   - `features/auth/` → `src/features/auth/`
   - `features/hub/` → `src/features/hub/`
   - `features/departments/` → `src/features/departments/`

3. **Root Application Files**
   - `app/layout.tsx` → `src/app/layout.tsx`
   - `app/page.tsx` → `src/app/page.tsx`
   - `app/ClientProviders.tsx` → `src/app/ClientProviders.tsx`
   - `middleware.ts` → `src/middleware.ts`

4. **Configuration Files**
   - `next.config.ts` → overwrite existing
   - `package.json` → merge dependencies
   - `.env.example` → preserve env var requirements

## Data Flow

1. **Authentication Flow**
   - Middleware checks session and redirects
   - Login page uses Supabase auth
   - Protected routes use auth layout guard
   - Session managed via Supabase client

2. **Routing Flow**
   - Root layout provides providers
   - Route groups separate concerns
   - Department-based dynamic routing
   - Server Actions for mutations

3. **Component Architecture**
   - Server Components for data fetching
   - Client Components for interactivity
   - Server Actions for form submissions
   - Shared components in `@repo/ui`

## Server vs Client Boundaries

- **Server Components**: All page.tsx files, data fetching functions, Server Actions
- **Client Components**: Forms, interactive tables, modals, auth-related UI
- **Server Only**: `@repo/supabase/server`, `@repo/redis`, middleware

## New Routes/Components

None - this is a migration of existing functionality.

## Environment Variables Required

All existing environment variables from legacy portal:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL`

## New Packages Needed

Based on legacy portal package.json, the following may need to be added:

- Review legacy portal dependencies vs new portal dependencies
- Add any missing packages with design approval
- Prefer workspace packages over external packages

## Migration Strategy

1. **Phase 1**: Copy directory structure using `cp -r`
2. **Phase 2**: Update import paths to use `src/` prefix
3. **Phase 3**: Merge package.json dependencies
4. **Phase 4**: Create missing components (StatusBadge)
5. **Phase 5**: Fix import references and broken dependencies
6. **Phase 6**: Run type-check and lint
7. **Phase 7**: Test build and fix any remaining issues

## Risk Assessment

- **High Risk**: Breaking existing auth flow or middleware
- **Medium Risk**: Import path resolution issues
- **Low Risk**: Missing utility components (easily created)

## Rollback Plan

Keep legacy portal intact until migration is verified. If migration fails, we can revert by:

1. Deleting `apps/portal/src` directory
2. Restoring original `src/app/layout.tsx` and `src/app/page.tsx`
3. Restoring original `package.json` from git
