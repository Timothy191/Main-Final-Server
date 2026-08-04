# @repo/supabase Package Guidelines

**Purpose:** Supabase client configuration, database migrations, and type generation — the data layer foundation.

## Package Overview

This package provides Supabase client instances for different contexts (server, client, middleware, service-role) and manages database migrations. It is the single source of truth for database schema and access patterns.

## Client Instances

```typescript
// Server-side client (with RLS)
export const createServerClient = () => supabase.createClient(...);

// Client-side client (browser)
export const createClient = () => supabase.createClient(...);

// Middleware client (edge)
export const createMiddlewareClient = () => supabase.createClient(...);

// Service-role client (bypasses RLS)
export const createAdminClient = () => supabase.createClient(...);

// Read replica client (for read-heavy operations)
export const createReadReplicaClient = () => supabase.createClient(...);
```

## Critical Rules

### 1. Client Usage Context
- **Server components:** Use `createServerClient()`
- **Client components:** Use `createClient()`
- **Middleware/Edge:** Use `createMiddlewareClient()`
- **Server actions/API routes:** Use `createAdminClient()` for privileged operations
- **Read-heavy queries:** Use `createReadReplicaClient()` when available

### 2. Row Level Security (RLS)
- **NEVER** use service-role client in user-facing code
- **ALWAYS** rely on RLS policies for data access control
- **NEVER** implement manual row filtering — use RLS instead
- RLS policies are the single source of truth for data access

### 3. Migration Discipline
- **ALL** schema changes must be done via migrations
- **NEVER** manually modify database schema
- **NEVER** depend on remote Supabase cloud project
- **ALWAYS** use local Docker stack: `pnpm supabase:start`
- Migrations live in `packages/supabase/migrations/`

### 4. Type Generation
- Database types are generated via Kysely: `pnpm db:codegen`
- **NEVER** manually edit `packages/supabase/src/db-types.ts`
- **ALWAYS** regenerate types after schema changes
- Types are imported as `import { Database } from '@repo/supabase'`

## Change Impact

When changing database schema:
- **CRITICAL:** Migration changes affect all data access code
- **HIGH IMPACT:** Type changes require type regeneration
- **HIGH IMPACT:** RLS policy changes affect data security
- **MEDIUM IMPACT:** Client configuration changes affect auth flows

### Cross-Package Dependencies
This package is consumed by:
- `apps/portal/src/app/api/` - API route data access
- `apps/portal/src/features/` - Feature data access
- `apps/portal/src/proxy.ts` - Edge auth checks
- `packages/database/` - Kysely type generation
- Any package that needs database access

## Testing

```bash
# Start local Supabase stack
pnpm supabase:start

# Check status
pnpm supabase:status

# Regenerate types after schema changes
pnpm db:codegen

# Type checking
pnpm --filter @repo/supabase type-check

# RLS policy audit
pnpm audit:rls
```

## Common Patterns

### Server component data access
```typescript
import { createServerClient } from '@repo/supabase/server';
import { Database } from '@repo/supabase';

export default async function Page() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) throw error;
  return <div>{/* render data */}</div>;
}
```

### Server action with admin client
```typescript
import { createAdminClient } from '@repo/supabase/server';
import { AppError } from '@repo/errors';

'use server';

export async function updateUserRole(userId: string, role: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);
  
  if (error) {
    throw new AppError('Failed to update user role', 500);
  }
}
```

### Type-safe queries
```typescript
import { createServerClient } from '@repo/supabase/server';
import { Database } from '@repo/supabase';

type User = Database['public']['Tables']['users']['Row'];

const supabase = createServerClient();
const { data } = await supabase
  .from('users')
  .select('*')
  .single<User>();
```

## Migration Workflow

### Create new migration
```bash
# From repo root
pnpx supabase migration new <migration_name>
# Workdir: packages/
```

### Apply migration locally
```bash
pnpm supabase:start  # Starts with migrations applied
```

### Migration naming convention
- Use descriptive names: `add_department_index`
- Use snake_case: `create_user_roles_table`
- Prefix with action: `add_`, `remove_`, `alter_`

### RLS Policy Guidelines
- **Principle of least privilege:** Default to no access
- **Role-based:** Use `auth.role()` checks
- **Row ownership:** Use `auth.uid()` for user data
- **Department-based:** Use department membership for data segregation

## Change Checklist

Before declaring done with database changes:
- [ ] Created migration for schema changes
- [ ] Migration follows naming convention
- [ ] RLS policies updated if needed
- [ ] Regenerated types: `pnpm db:codegen`
- [ ] Updated consuming code for type changes
- [ ] Tested with local Supabase stack
- [ ] Ran RLS audit: `pnpm audit:rls`
- [ ] Updated database documentation
- [ ] Added entry to `docs/REPO-CHANGE-INDEX.md`
- [ ] Ran type-check across affected packages

## Common Pitfalls

### 1. Using wrong client context
```typescript
// Don't do this in client component
import { createServerClient } from '@repo/supabase/server';

// Do this instead
import { createClient } from '@repo/supabase/client';
```

### 2. Bypassing RLS
```typescript
// Don't do this in user-facing code
const supabase = createAdminClient();

// Do this instead - rely on RLS
const supabase = createServerClient();
```

### 3. Manual schema changes
```typescript
// Don't do this
// Manually modify database via SQL console

// Do this instead
// Create migration and apply via pnpm supabase:start
```

## Local Development

### Start Supabase stack
```bash
pnpm supabase:start
```

### Stop Supabase stack
```bash
pnpm supabase:stop
```

### Reset database
```bash
pnpm supabase:stop
rm -rf packages/supabase/.supabase
pnpm supabase:start
```

### Access Supabase Studio
Local Supabase Studio: http://localhost:54323

## Environment Variables

Required for local development:
- `SUPABASE_URL` - Local Supabase URL
- `SUPABASE_ANON_KEY` - Local anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Local service role key

These are automatically set by `pnpm supabase:start`.
