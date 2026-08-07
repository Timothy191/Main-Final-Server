# Data Access Map

How the codebase reaches PostgreSQL. Runtime code uses `@repo/supabase`
clients; `@repo/database` (Kysely) exists for type generation only.

```mermaid
graph TD
    classDef client fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef store fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fff;

    subgraph SupabaseClients ["@repo/supabase client factories"]
        Server["server (Server Components / Actions)"]:::client
        Client["client (Browser)"]:::client
        MW["middleware (Edge)"]:::client
        SR["service-role (Admin, bypass RLS)"]:::client
        RR["read-replica"]:::client
    end

    subgraph Migrations ["packages/supabase/migrations/"]
        SQL["SQL migrations (source of truth)"]:::store
        Seed["Seed data"]:::store
    end

    Kysely["@repo/database → db-types.ts (codegen)"]:::client
    Codegen["pnpm db:codegen"]
    RLS["PostgreSQL + RLS (self-hosted Docker)"]

    Server --> RLS
    Client -->|browser RPC| RLS
    MW --> RLS
    SR --> RLS
    RR --> RLS
    Migrations --> RLS
    Codegen --> Kysely
    Kysely -.types only.-> Server
```

## Rules

- **Never** import `@repo/database` in app runtime code — it is a
  type-generation artifact. Use `@repo/supabase` clients.
- Migrations are the schema source of truth: `pnpx supabase migration new
<name>`, then `pnpm audit:rls` to verify RLS policies.
- Never depend on a remote cloud Supabase link; the stack is local-first
  (`pnpm supabase:start` from `packages/`).
