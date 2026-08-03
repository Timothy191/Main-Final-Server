# Portal Migration Tasks

## Task Breakdown

### Task 1: Backup current new portal state

- Create backup of current `apps/portal/src` directory
- Backup current `apps/portal/package.json`
- **Verification**: Backup files exist

### Task 2: Copy legacy portal structure

- Copy `apps(legacy)/portal/app/` to `apps/portal/src/app/`
- Copy `apps(legacy)/portal/features/` to `apps/portal/src/features/`
- Copy `apps(legacy)/portal/middleware.ts` to `apps/portal/src/middleware.ts`
- Copy `apps(legacy)/portal/next.config.ts` to `apps/portal/next.config.ts`
- **Verification**: All directories and files copied successfully

### Task 3: Copy root application files

- Copy `apps(legacy)/portal/app/layout.tsx` to `apps/portal/src/app/layout.tsx`
- Copy `apps(legacy)/portal/app/page.tsx` to `apps/portal/src/app/page.tsx`
- Copy `apps(legacy)/portal/app/ClientProviders.tsx` to `apps/portal/src/app/ClientProviders.tsx`
- **Verification**: Root application files in place

### Task 4: Merge package.json dependencies

- Read legacy portal package.json
- Compare with new portal package.json
- Add missing dependencies to new portal package.json
- Run `pnpm install` to install new dependencies
- **Verification**: `pnpm install` completes successfully

### Task 5: Create missing StatusBadge component

- Analyze StatusBadge usage in access-control components
- Create `src/features/access-control/components/StatusBadge.tsx`
- Implement based on usage patterns (likely a simple badge component)
- **Verification**: No import errors for StatusBadge

### Task 6: Fix import paths for workspace packages

- Search for imports that need `@repo/*` packages
- Update imports to use workspace packages where available
- Ensure no imports from `apps/` within `packages/`
- **Verification**: No workspace import errors

### Task 7: Fix server/client component boundaries

- Review all Client Components for server-only imports
- Move server-only logic to Server Actions or data functions
- Ensure `"use client"` directive only where needed
- **Verification**: No server-only code in client bundles

### Task 8: Run TypeScript type-check

- Run `pnpm type-check` across the monorepo
- Fix any TypeScript errors
- Ensure strict mode compliance
- **Verification**: `pnpm type-check` passes with zero errors

### Task 9: Run ESLint

- Run `pnpm lint` across the monorepo
- Fix any ESLint errors
- Ensure no warnings
- **Verification**: `pnpm lint` passes with zero errors

### Task 10: Test build

- Run `pnpm build` for the portal app
- Fix any build errors
- Ensure standalone output is generated
- **Verification**: Build completes successfully

### Task 11: Verify authentication flow

- Check login page renders
- Verify middleware redirects work
- Ensure auth layout guard functions
- **Verification**: Auth routes accessible and functional

### Task 12: Verify department routing

- Check department pages render
- Verify dynamic routing works
- Ensure layout structure preserved
- **Verification**: Department routes accessible

### Task 13: Clean up and finalize

- Remove any temporary files
- Update AGENTS.md if new patterns discovered
- Run final `pnpm quality` check
- **Verification**: All quality checks pass

## Task Ordering

Tasks are ordered to build on each other:

1. Backup (safety first)
2. Copy structure (foundation)
3. Merge dependencies (enable code to run)
4. Create missing components (fix broken imports)
5. Fix imports (resolve dependencies)
6. Fix boundaries (ensure correct architecture)
7. Type-check (ensure type safety)
8. Lint (ensure code quality)
9. Build (ensure production readiness)
10. Verify functionality (ensure it works)
11. Finalize (clean up)

## Completion Criteria

Each task must be completed and verified before moving to the next. A task is only complete when its verification step passes.
