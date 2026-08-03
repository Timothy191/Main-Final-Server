-- ============================================
-- Migration: 023_pg_cron_schedules
-- Description: Enable pg_cron and set up scheduled jobs for:
--              - Materialized view refreshes (3 views)
--              - Auto-partition creation (monthly)
--
-- PREREQUISITE: pg_cron must be in shared_preload_libraries.
-- For self-hosted Supabase, add to postgresql.conf:
--   shared_preload_libraries = 'pg_cron'
--   cron.database_name = 'postgres'
-- Then restart PostgreSQL before running this migration.
-- ============================================

-- Enable pg_cron extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required for cron.schedule)
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================
-- Remove any existing schedules (idempotent re-run safety)
-- ============================================
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'refresh-dept-production-summary',
  'refresh-machine-utilization-weekly',
  'refresh-safety-incident-monthly',
  'create-next-month-partitions'
);

-- ============================================
-- 1. dept_production_summary — every 15 minutes
-- ============================================
SELECT cron.schedule(
  'refresh-dept-production-summary',
  '*/15 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY dept_production_summary'
);

-- ============================================
-- 2. machine_utilization_weekly — every 1 hour (at :05 to spread load)
-- ============================================
SELECT cron.schedule(
  'refresh-machine-utilization-weekly',
  '5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY machine_utilization_weekly'
);

-- ============================================
-- 3. safety_incident_monthly — every 6 hours (00:10, 06:10, 12:10, 18:10)
-- ============================================
SELECT cron.schedule(
  'refresh-safety-incident-monthly',
  '10 0,6,12,18 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY safety_incident_monthly'
);

-- ============================================
-- 4. Auto-partition creation — 1st of every month at 00:01
-- ============================================
SELECT cron.schedule(
  'create-next-month-partitions',
  '1 0 1 * *',
  'SELECT public.create_next_month_partitions()'
);
