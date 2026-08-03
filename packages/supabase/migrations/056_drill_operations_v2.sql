-- ============================================
-- Drilling Operations v2: Editable Columns + Monthly Summary RPC
-- ============================================

-- 1. New editable columns on drill_operations
-- --------------------------------------------
ALTER TABLE drill_operations
  ADD COLUMN IF NOT EXISTS site                      TEXT,
  ADD COLUMN IF NOT EXISTS external_delays_minutes  NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS standard_delays_hours    NUMERIC(10,2) DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS production_delays_minutes NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engineering_delays_minutes NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments                 TEXT;

-- Documentation
COMMENT ON COLUMN drill_operations.site                      IS 'Free-text site label (e.g. N2-B4, Pit C West).';
COMMENT ON COLUMN drill_operations.standard_delays_hours    IS 'Standard non-productive delay (lunch, safety talks). Defaults to 2 hours, editable.';
COMMENT ON COLUMN drill_operations.external_delays_minutes  IS 'External (not attributable to machine/operator) delays, in minutes.';
COMMENT ON COLUMN drill_operations.production_delays_minutes IS 'Production-attributable delays, in minutes.';
COMMENT ON COLUMN drill_operations.engineering_delays_minutes IS 'Engineering / maintenance delays, in minutes.';
COMMENT ON COLUMN drill_operations.comments                 IS 'Free-text notes for the shift.';

-- Note: the legacy aggregate columns (production_delays, non_productional_delays,
-- engineering_delays) and the 11+ delay_* sub-category columns remain in place
-- for backward compatibility. The new inline table writes only to the
-- production_delays_minutes / engineering_delays_minutes / external_delays_minutes
-- / standard_delays_hours columns.

-- 2. RPC: Monthly Availability & Utilization summary per drill rig
-- ----------------------------------------------------------------
-- Lists every drill rig that has logged at least one operation in the given
-- department for the given year-month, with scheduled / productive / downtime
-- hours and the derived availability / utilization percentages.
CREATE OR REPLACE FUNCTION get_drill_monthly_summary(
  p_department_id UUID,
  p_year_month    TEXT  -- 'YYYY-MM'
)
RETURNS TABLE (
  machine_id        UUID,
  machine_name      TEXT,
  scheduled_hours   NUMERIC,
  downtime_hours    NUMERIC,
  productive_hours  NUMERIC,
  availability_pct  NUMERIC,
  utilization_pct   NUMERIC
)
LANGUAGE sql STABLE
AS $$
  WITH rigs_in_scope AS (
    SELECT DISTINCT m.id, m.name
    FROM machines m
    JOIN drill_operations op
      ON op.machine_id = m.id
    WHERE m.machine_type = 'Drill Rig'
      AND m.active = true
      AND op.department_id = p_department_id
      AND to_char(op.operation_date, 'YYYY-MM') = p_year_month
  ),
  agg AS (
    SELECT
      m.id  AS machine_id,
      m.name AS machine_name,
      COALESCE(SUM(op.total_hours), 0)::NUMERIC AS scheduled_hours,
      (
        COALESCE(SUM(op.standard_delays_hours), 0) * 60.0
        + COALESCE(SUM(op.external_delays_minutes), 0)
        + COALESCE(SUM(op.production_delays_minutes), 0)
        + COALESCE(SUM(op.engineering_delays_minutes), 0)
      ) / 60.0 AS downtime_hours
    FROM rigs_in_scope m
    LEFT JOIN drill_operations op
      ON op.machine_id = m.id
      AND op.department_id = p_department_id
      AND to_char(op.operation_date, 'YYYY-MM') = p_year_month
    GROUP BY m.id, m.name
  )
  SELECT
    a.machine_id,
    a.machine_name,
    ROUND(a.scheduled_hours, 2) AS scheduled_hours,
    ROUND(a.downtime_hours, 2)  AS downtime_hours,
    ROUND(GREATEST(0, a.scheduled_hours - a.downtime_hours), 2) AS productive_hours,
    CASE
      WHEN a.scheduled_hours = 0 THEN NULL
      ELSE ROUND(
        100.0 * a.scheduled_hours
        / NULLIF(a.scheduled_hours + a.downtime_hours, 0),
        1
      )
    END AS availability_pct,
    CASE
      WHEN a.scheduled_hours = 0 THEN NULL
      ELSE ROUND(
        100.0 * GREATEST(0, a.scheduled_hours - a.downtime_hours)
        / a.scheduled_hours,
        1
      )
    END AS utilization_pct
  FROM agg a
  ORDER BY a.machine_name;
$$;
