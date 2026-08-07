# @repo/acl Package Guidelines

**Purpose:** Single source of truth for department slugs, role definitions, and access control lists.

## Package Overview

This package defines the authoritative access control logic for the entire system. All ACL checks must import from this package — never duplicate ACL logic inline.

## Exported Types & Constants

```typescript
// Department slugs (SSOT)
export const DEPARTMENTS = {
  DRILLING: 'drilling',
  PRODUCTION: 'production',
  ACCESS_CONTROL: 'access-control',
  ENGINEERING: 'engineering',
  CONTROL_ROOM: 'control-room',
  SAFETY: 'safety',
  TRAINING: 'training',
  SATELLITE_MONITORING: 'satellite-monitoring',
  // ... more departments
} as const;

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
  // ... more roles
} as const;

// Restricted route map
export const RESTRICTED_ROUTES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/settings': ['admin', 'operator'],
  // ... more restrictions
};
```

## Critical Rules

### 1. Single Source of Truth
- **NEVER** hardcode department slugs or role strings in app code
- **ALWAYS** import from `@repo/acl` for any ACL-related logic
- Department routes in `apps/portal/app/(departments)/[department]/` must use slugs from this package

### 2. Change Impact
- **HIGH IMPACT:** Changes to `DEPARTMENTS` affect routing, UI, and database schema
- **HIGH IMPACT:** Changes to `ROLES` affect authentication, authorization, and user management
- **MEDIUM IMPACT:** Changes to `RESTRICTED_ROUTES` affect middleware and route protection

### 3. Cross-Package Dependencies
When changing this package, you must update:
- `apps/portal/src/proxy.ts` (edge middleware ACL checks)
- `packages/supabase/migrations/` (if department/role schema changes)
- Any feature modules that hardcode department strings (search codebase for department literals)

## Testing

```bash
# Type checking (critical for ACL exports)
pnpm --filter @repo/acl type-check

# No unit tests currently - consider adding:
# - Department slug validation
# - Role hierarchy checks
# - Route restriction mapping tests
```

## Common Patterns

### Check department access
```typescript
import { DEPARTMENTS, hasDepartmentAccess } from '@repo/acl';

if (hasDepartmentAccess(user, DEPARTMENTS.DRILLING)) {
  // Allow access
}
```

### Check route restrictions
```typescript
import { RESTRICTED_ROUTES, hasRouteAccess } from '@repo/acl';

if (hasRouteAccess(user, '/admin')) {
  // Allow access
}
```

## Change Checklist

Before declaring done with ACL changes:
- [x] Updated `DEPARTMENTS` or `ROLES` exports
- [x] Checked for hardcoded department/role strings in codebase
- [x] Updated database migrations if schema changes needed
- [x] Updated portal proxy.ts if ACL logic changed
- [x] Added entry to `docs/REPO-CHANGE-INDEX.md`
- [x] Ran `pnpm --filter @repo/acl type-check`
