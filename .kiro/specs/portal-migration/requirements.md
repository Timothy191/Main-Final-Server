# Portal Migration Requirements

## User Request

Migrate the legacy portal (`apps(legacy)/portal`) to the new portal (`apps/portal`). The legacy portal is a feature-rich Next.js 15 App Router application with Supabase auth, department-based routing, and multiple workspace packages. The new portal currently has a minimal scaffold.

## Requirements

1. **Complete Application Migration**
   - Migrate all route segments from legacy portal to new portal
   - Preserve all authentication logic and flows
   - Preserve all department-based routing structure
   - Preserve all feature components and functionality

2. **Route Structure Migration**
   - Auth routes: `(auth)/login`, `(auth)/reset-password`, `(auth)/update-password`
   - Hub routes: `(hub)/page.tsx` (main dashboard)
   - Department routes: `(departments)/[department]/page.tsx`
   - Access card actions routes
   - Access control routes
   - Drilling routes
   - Engineering routes
   - Training routes

3. **Component Migration**
   - Migrate all feature components from `features/` directory
   - Preserve all UI components and their dependencies
   - Preserve all Server Actions and data fetching functions

4. **Configuration Migration**
   - Migrate root layout with all providers
   - Migrate middleware for auth and routing
   - Migrate Next.js configuration
   - Preserve environment variable requirements

5. **Dependencies**
   - Ensure all required packages from legacy portal are available in new portal
   - Use workspace packages where available (`@repo/*`)
   - Add any missing dependencies with proper justification

6. **Code Quality**
   - Maintain TypeScript strict mode compliance
   - Preserve existing error handling patterns
   - Maintain server/client component boundaries
   - Preserve all validation logic

7. **Known Issues to Address**
   - Create missing `StatusBadge` component referenced in access-control components
   - Fix any broken imports or missing dependencies
   - Ensure all component imports resolve correctly

## Acceptance Criteria

1. All routes from legacy portal are accessible in new portal
2. Authentication flow works correctly (login, password reset, etc.)
3. Department-based routing functions properly
4. All feature pages render without errors
5. Server Actions execute successfully
6. No TypeScript errors after migration
7. No ESLint errors after migration
8. Build completes successfully
9. All existing functionality is preserved
