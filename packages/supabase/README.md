## Local Self-Hosted Supabase Stack (On-Premise Architecture)

This repository strictly uses an **On-Premise / Local Self-Hosted Supabase Docker Stack** (`pnpm supabase start`). This architecture ensures 100% offline reliability for industrial mine sites without external internet dependencies.

### Prerequisites

- **Docker Engine** (installed and running)
- **Node.js** 22+ & **pnpm** 9.15.9+
- **Supabase CLI** (managed via workspace devDependencies)

---

### Running the Local Supabase Stack

1. **Install dependencies:** `pnpm install`
2. **Start local Supabase stack:** `pnpm dev` (or `pnpm supabase:start`)
   - Boots PostgreSQL, GoTrue Auth, PostgREST API Gateway, Realtime WebSockets, and Storage containers inside Docker.
3. **Access Supabase Studio Dashboard:** Open <http://localhost:54323> in your browser.

---

### Local Environment Variables (`.env.local`)

When running locally, default credentials connect directly to the local Docker containers:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh... (from local CLI output)
SUPABASE_SERVICE_ROLE_KEY=eyJh... (from local CLI output)
```

---

### Migration Management & Schema Updates

1. Create a new migration file: `pnpm exec supabase migration new <migration_name>`
2. Write raw SQL inside `packages/supabase/migrations/`
3. Apply migrations to the local DB: `pnpm exec supabase db reset`

---

### Best Practices

- All database schema updates **must** be stored as raw SQL migration scripts under `packages/supabase/migrations/`.
- Row Level Security (RLS) policies are audited via `pnpm audit:rls` before deployment.
- Never depend on external cloud connections during local development or mine-site operation.
