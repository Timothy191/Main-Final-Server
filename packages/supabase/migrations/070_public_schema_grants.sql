-- ============================================================================
-- Base privileges for Supabase built-in roles on the public schema.
--
-- Every prior migration created tables with RLS enabled but never issued the
-- base GRANT SELECT/INSERT/UPDATE/DELETE. In Postgres, RLS filters the rows a
-- role can see, but the role must still hold the underlying table privilege —
-- otherwise the API returns "permission denied for table <name>" before RLS
-- is evaluated. This surfaced as /api/health reporting the database as
-- degraded on a fresh `supabase db reset`.
--
-- We grant the Supabase defaults here so a reset produces a working database:
--   * authenticated  — full DML on tables, USAGE on sequences, EXECUTE on
--                      functions; RLS policies gate what is actually visible.
--   * service_role   — full access (bypasses RLS by design).
--   * anon           — SELECT only; RLS policies decide what is public.
--
-- ALTER DEFAULT PRIVILEGES covers tables/sequences created by later
-- migrations so this file does not need to be re-run each time the schema
-- grows.
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;
