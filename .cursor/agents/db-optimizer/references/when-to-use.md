# When to use db-optimizer

## Wake

- Slow query, missing index, or high `pg_stat_statements` total time
- N+1 queries in Server Components or Supabase embeds
- Migration performance concern (locks, `CONCURRENTLY`, rollback plan)
- User says: EXPLAIN, optimize, index, schema design, connection pool
- After adding heavy reports, exports, or hub telemetry queries

## Do not use

- Application security or RLS policy design → `security`
- API route architecture → `backend-architect`
- UI rendering performance → `frontend-implementer`
- Docs sync → `ai-docs-sync`

## Commands

```bash
pnpm audit:rls                    # after schema changes
# EXPLAIN (ANALYZE, BUFFERS) on suspect query in Supabase SQL editor
```
