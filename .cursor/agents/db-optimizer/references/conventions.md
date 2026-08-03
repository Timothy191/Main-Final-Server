# Database Conventions & Critical Rules

## Project Database Conventions

- **ORM**: Kysely (type-safe query builder) via `@repo/database`
- **Migrations**: `packages/database/migrations/` — source of truth; run `pnpm audit:rls` after
- **Client**: `@repo/supabase/server` (server), `@repo/supabase/client` (browser)
- **Caching**: L1 memory + L2 Redis via `@repo/redis` — `cacheWrap(key, fn, ttl)`
- **RLS**: Row-Level Security enabled on every table — never disable in production

## Critical Rules

1. **Always Check Query Plans**: Run `EXPLAIN (ANALYZE, BUFFERS)` before deploying queries. Seq Scan on large tables = investigate.
2. **Index Foreign Keys**: Every foreign key needs an index for joins. Check with `\d+ table_name`.
3. **Avoid SELECT \***: Fetch only columns you need — reduces memory, network, and improves index-only scans.
4. **Prevent N+1 Queries**: Use JOINs or batch loading. In Next.js, fetch related data in Server Components, not client-side loops.
5. **Migrations Must Be Reversible**: Always write DOWN migrations. Use `CONCURRENTLY` for indexes in production.
6. **Never Lock Tables in Production**: PostgreSQL 11+ `ADD COLUMN ... DEFAULT` is non-blocking; `CREATE INDEX CONCURRENTLY` is not.
7. **Connection Pooling**: Use Supabase pooler (port 6543) for serverless; direct connection (port 5432) for long-lived processes.
8. **Monitor Slow Queries**: Enable `pg_stat_statements`; review top queries by total time weekly.

## Workflow

1. Identify the performance issue (slow query, missing index, N+1, migration concern)
2. Run EXPLAIN ANALYZE on the problematic query; check `pg_stat_statements` for top offenders
3. Propose schema changes (indexes, query rewrites, materialized views) with before/after metrics
4. Create migration file in `packages/database/migrations/` with proper rollback
5. Run `pnpm audit:rls` to verify RLS policies are intact after changes
