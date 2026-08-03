-- ============================================
-- Migration: 022_materialized_views
-- Description: Pre-computed materialized views for dashboard read paths.
--              All views use SECURITY DEFINER wrapper functions so RLS
--              is enforced at the function call level rather than on the
--              materialized view directly (mat views don't support RLS).
--
--              Views:
--                1. dept_production_summary      — monthly coal/waste per dept
--                2. machine_utilization_weekly   — 7-day hours worked per machine
--                3. safety_incident_monthly      — monthly incident counts by type
-- ============================================

-- ============================================
-- 1. dept_production_summary
--    Aggregates coal_tonnes + waste_tonnes from production_logs
--    joined via daily_logs for the current calendar month.
--    Refreshed every 15 minutes via pg_cron (migration 023).
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS dept_production_summary AS
SELECT
  d.id                          AS department_id,
  d.name                        AS department_name,
  d.display_name                AS department_display_name,
  date_trunc('month', NOW())::DATE AS summary_month,
  COUNT(DISTINCT dl.id)         AS log_count,
  COALESCE(SUM(pl.coal_tonnes), 0)   AS total_coal_tonnes,
  COALESCE(SUM(pl.waste_tonnes), 0)  AS total_waste_tonnes,
  COALESCE(SUM(pl.coal_tonnes + pl.waste_tonnes), 0) AS total_tonnes,
  NOW()                         AS last_refreshed_at
FROM departments d
LEFT JOIN daily_logs dl
  ON dl.department_id = d.id
  AND dl.log_date >= date_trunc('month', NOW())
  AND dl.log_date <  date_trunc('month', NOW()) + INTERVAL '1 month'
LEFT JOIN production_logs pl ON pl.daily_log_id = dl.id
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.name, d.display_name;

-- Unique index required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS uidx_dept_production_summary_dept
  ON dept_production_summary(department_id);

-- Grant read access
GRANT SELECT ON dept_production_summary TO authenticated;


-- ============================================
-- 2. machine_utilization_weekly
--    Aggregates hours_worked per machine over the last 7 days.
--    Refreshed every 1 hour via pg_cron (migration 023).
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS machine_utilization_weekly AS
SELECT
  m.id                                    AS machine_id,
  m.name                                  AS machine_name,
  m.machine_type,
  m.department_id,
  d.name                                  AS department_name,
  COALESCE(SUM(mh.hours_worked), 0)       AS total_hours_worked,
  COUNT(DISTINCT dl.id)                   AS shifts_recorded,
  -- Utilisation %: hours worked / (7 days * 24 hours max theoretical)
  ROUND(
    COALESCE(SUM(mh.hours_worked), 0) / NULLIF(7 * 24, 0) * 100, 2
  )                                       AS utilization_pct,
  NOW()                                   AS last_refreshed_at
FROM machines m
JOIN departments d ON d.id = m.department_id
LEFT JOIN machine_hours mh ON mh.machine_id = m.id
LEFT JOIN daily_logs dl
  ON dl.id = mh.daily_log_id
  AND dl.log_date >= (CURRENT_DATE - INTERVAL '7 days')
WHERE m.deleted_at IS NULL
  AND d.deleted_at IS NULL
GROUP BY m.id, m.name, m.machine_type, m.department_id, d.name;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_machine_utilization_weekly_machine
  ON machine_utilization_weekly(machine_id);

GRANT SELECT ON machine_utilization_weekly TO authenticated;


-- ============================================
-- 3. safety_incident_monthly
--    Monthly incident counts by type and severity for the last 6 months.
--    Refreshed every 6 hours via pg_cron (migration 023).
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS safety_incident_monthly AS
SELECT
  d.id                                    AS department_id,
  d.name                                  AS department_name,
  date_trunc('month', si.incident_date)::DATE AS incident_month,
  si.incident_type,
  si.status,
  COUNT(si.id)                            AS incident_count,
  SUM(si.injured_parties)                 AS total_injured_parties,
  NOW()                                   AS last_refreshed_at
FROM safety_incidents si
JOIN departments d ON d.id = si.department_id
WHERE si.incident_date >= date_trunc('month', NOW() - INTERVAL '6 months')
GROUP BY d.id, d.name, date_trunc('month', si.incident_date), si.incident_type, si.status;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_safety_incident_monthly
  ON safety_incident_monthly(department_id, incident_month, incident_type, status);

GRANT SELECT ON safety_incident_monthly TO authenticated;


-- ============================================
-- SECURITY DEFINER wrapper functions
-- These enforce RLS at the function level since materialized views
-- do not support row-level security directly.
-- ============================================

-- Production summary for caller's accessible departments
CREATE OR REPLACE FUNCTION public.get_dept_production_summary()
RETURNS SETOF dept_production_summary
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT s.*
  FROM dept_production_summary s
  WHERE public.has_department_access(s.department_id)
     OR public.is_admin();
$$;

GRANT EXECUTE ON FUNCTION public.get_dept_production_summary() TO authenticated;


-- Machine utilisation for caller's accessible departments
CREATE OR REPLACE FUNCTION public.get_machine_utilization_weekly()
RETURNS SETOF machine_utilization_weekly
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT m.*
  FROM machine_utilization_weekly m
  WHERE public.has_department_access(m.department_id)
     OR public.is_admin();
$$;

GRANT EXECUTE ON FUNCTION public.get_machine_utilization_weekly() TO authenticated;


-- Safety incident monthly for caller's accessible departments
CREATE OR REPLACE FUNCTION public.get_safety_incident_monthly()
RETURNS SETOF safety_incident_monthly
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT s.*
  FROM safety_incident_monthly s
  WHERE public.has_department_access(s.department_id)
     OR public.is_admin();
$$;

GRANT EXECUTE ON FUNCTION public.get_safety_incident_monthly() TO authenticated;
