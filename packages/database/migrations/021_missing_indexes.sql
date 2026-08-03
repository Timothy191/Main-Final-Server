-- ============================================
-- Migration: 021_missing_indexes
-- Description: Add missing composite indexes for dashboard query patterns,
--              enable pg_stat_statements for slow query identification.
-- ============================================

-- ============================================
-- 1. Enable pg_stat_statements
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- 2. Composite indexes for machine_hours
--    Queries: "machine X utilization over date range"
--    machine_hours joins daily_logs for the date context
-- ============================================
CREATE INDEX IF NOT EXISTS idx_machine_hours_machine_log
  ON machine_hours(machine_id, daily_log_id);

CREATE INDEX IF NOT EXISTS idx_machine_hours_log_machine
  ON machine_hours(daily_log_id, machine_id);

-- ============================================
-- 3. Composite indexes for fuel_logs
--    Queries: "fuel consumed by machine in a log period"
-- ============================================
CREATE INDEX IF NOT EXISTS idx_fuel_logs_machine_log
  ON fuel_logs(machine_id, daily_log_id);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_log_machine
  ON fuel_logs(daily_log_id, machine_id);

-- ============================================
-- 4. Composite indexes for daily_logs (partitioned)
--    Queries: "all shifts for department in month"
--    Already has (department_id, log_date DESC) from migration 020.
--    Add shift-specific composite for shift-level queries.
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_logs_dept_date_shift
  ON daily_logs(department_id, log_date DESC, shift);

-- ============================================
-- 5. hourly_loads: composite department+date+shift for control room grid
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hourly_loads_dept_date_shift
  ON hourly_loads(department_id, load_date DESC, shift_type);

-- ============================================
-- 6. breakdowns: active breakdowns by department (dashboard widget)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_breakdowns_dept_status
  ON breakdowns(department_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_breakdowns_dept_date_in
  ON breakdowns(department_id, date_in DESC)
  WHERE deleted_at IS NULL;

-- ============================================
-- 7. safety_incidents: open incidents today (hub urgency bar)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_safety_incidents_dept_date_status
  ON safety_incidents(department_id, incident_date DESC, status);

-- ============================================
-- 8. machines: offline machines count (hub urgency bar)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_machines_dept_active
  ON machines(department_id, active)
  WHERE deleted_at IS NULL;

-- ============================================
-- 9. audit_logs: recent activity by user/table (admin panel)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs(performed_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_created
  ON audit_logs(table_name, created_at DESC);

-- ============================================
-- 10. AI memory: vector similarity search support
--     (pgvector already handles this via ivfflat, but add composite)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_memory_user_type
  ON memory_embeddings(user_id, memory_type);

-- ============================================
-- Helper view: identify slow queries (read-only, for monitoring)
-- Run: SELECT * FROM slow_queries_summary ORDER BY mean_exec_time DESC LIMIT 20;
-- ============================================
CREATE OR REPLACE VIEW slow_queries_summary AS
SELECT
  LEFT(query, 120)            AS query_preview,
  calls,
  round(mean_exec_time::numeric, 2)  AS mean_ms,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(stddev_exec_time::numeric, 2) AS stddev_ms,
  rows
FROM pg_stat_statements
WHERE calls > 10
ORDER BY mean_exec_time DESC;

GRANT SELECT ON slow_queries_summary TO authenticated;
