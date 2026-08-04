---
name: on-premise-supabase-ops
description: Operational guide for local self-hosted Supabase Docker stack, raw SQL migration workflows, RLS auditing, and offline mine site deployments.
---

# On-Premise Supabase Operations Skill

Use this skill when managing the local Supabase Docker stack, writing PostgreSQL migrations, resetting databases, or auditing Row-Level Security (RLS) policies.

## 1. Architectural Mandate

This repository **strictly relies on the local self-hosted Supabase Docker stack** (`pnpm supabase start`). Never link or push to external cloud projects.

## 2. Command Reference

```bash
# Start local Supabase Docker stack
pnpm dev                       # Full stack (Redis + Supabase + Portal)
pnpm supabase:start            # Supabase containers only

# Check container status & API keys
pnpm exec supabase status --workdir packages

# Create a new SQL migration
pnpm exec supabase migration new <migration_name>

# Reset local database (applies all SQL migrations from clean slate)
pnpm exec supabase db reset

# Audit RLS policies
pnpm audit:rls
```

## 3. Migration File Standard (`packages/supabase/migrations/`)

- Name files numerically: `062_add_archived_documents_table.sql`.
- Include `down` / rollback comments or idempotent table definitions (`CREATE TABLE IF NOT EXISTS`).
- Always enable RLS on every created table:

```sql
CREATE TABLE IF NOT EXISTS archived_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT CHECK (category IN ('Inductions', 'SOP', 'COD', 'Compliance')),
  version TEXT NOT NULL DEFAULT '1.0',
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE archived_documents ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Allow authenticated department access"
  ON archived_documents
  FOR ALL
  TO authenticated
  USING (true);
```

## 4. Local Environment Synchronization (`apps/portal/.env.local`)

Ensure `apps/portal/.env.local` matches the local Docker CLI output:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
