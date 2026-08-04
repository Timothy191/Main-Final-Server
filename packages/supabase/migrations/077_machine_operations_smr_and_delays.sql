-- ============================================
-- Migration 077: Machine Operations SMR + Delay Buckets
-- Adds Service Meter Reading (SMR) tracking and categorized
-- delay minutes to machine_operations for control-room shift sheets.
-- ============================================

-- ============================================
-- 1. machine_operations: SMR fields and delay buckets
-- ============================================
ALTER TABLE machine_operations
  ADD COLUMN IF NOT EXISTS start_smr NUMERIC,
  ADD COLUMN IF NOT EXISTS close_smr NUMERIC,
  ADD COLUMN IF NOT EXISTS smr_total NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN start_smr IS NOT NULL AND close_smr IS NOT NULL
      THEN close_smr - start_smr
      ELSE NULL
    END
  ) STORED,
  ADD COLUMN IF NOT EXISTS natural_delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (natural_delay_minutes >= 0),
  ADD COLUMN IF NOT EXISTS non_production_delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (non_production_delay_minutes >= 0),
  ADD COLUMN IF NOT EXISTS production_delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (production_delay_minutes >= 0),
  ADD COLUMN IF NOT EXISTS engineering_delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (engineering_delay_minutes >= 0);

COMMENT ON COLUMN machine_operations.start_smr IS 'Service meter reading at shift start (pulled from previous close)';
COMMENT ON COLUMN machine_operations.close_smr IS 'Service meter reading at shift close (entered by operator/supervisor)';
COMMENT ON COLUMN machine_operations.smr_total IS 'Auto-calculated close_smr - start_smr';
COMMENT ON COLUMN machine_operations.natural_delay_minutes IS 'Natural/weather delays';
COMMENT ON COLUMN machine_operations.non_production_delay_minutes IS 'Non-production delays (e.g. shift change, meetings)';
COMMENT ON COLUMN machine_operations.production_delay_minutes IS 'Production-related delays (e.g. material shortage)';
COMMENT ON COLUMN machine_operations.engineering_delay_minutes IS 'Engineering/breakdown delays';

-- Drop the old hours_worked generated column so we can replace it with a
-- formula based on SMR total minus delays, if present. Preserve data by
-- leaving the column nullable (existing rows keep their value).
-- NOTE: hours_worked is kept for historical compatibility; new UI uses smr_total.
-- If hours_worked is a STORED generated column (as defined in 002_control_room_tables.sql),
-- these ALTERs are not permitted and also unnecessary (generated columns are
-- already computed and effectively nullable via their expression).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'machine_operations'::regclass
      AND attname = 'hours_worked'
      AND attgenerated <> ''
  ) THEN
    ALTER TABLE machine_operations ALTER COLUMN hours_worked DROP NOT NULL;
    ALTER TABLE machine_operations ALTER COLUMN hours_worked DROP DEFAULT;
  END IF;
END $$;

-- Unique constraint already exists on (machine_id, shift_date, shift_type, start_time).
-- For SMR-based entries we want at most one record per machine/shift, regardless of
-- start_time. Keep the existing constraint to preserve historical data and add a
-- partial unique index for new SMR rows where start_time is midnight (shift default).
DROP INDEX IF EXISTS idx_machine_operations_machine_shift_unique_smr;
CREATE UNIQUE INDEX IF NOT EXISTS idx_machine_operations_machine_shift_unique_smr
  ON machine_operations (machine_id, shift_date, shift_type)
  WHERE start_time = '00:00:00';

CREATE INDEX IF NOT EXISTS idx_machine_operations_machine_shift_smr
  ON machine_operations (machine_id, shift_date DESC, shift_type DESC);

-- Trigger already exists via migration 002.

-- ============================================
-- 1b. Archive tables: mirror SMR and delay columns so SELECT * archival keeps working
-- ============================================
ALTER TABLE machine_operations_archive
  ADD COLUMN IF NOT EXISTS start_smr NUMERIC,
  ADD COLUMN IF NOT EXISTS close_smr NUMERIC,
  ADD COLUMN IF NOT EXISTS smr_total NUMERIC,
  ADD COLUMN IF NOT EXISTS natural_delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (natural_delay_minutes >= 0),
  ADD COLUMN IF NOT EXISTS non_production_delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (non_production_delay_minutes >= 0),
  ADD COLUMN IF NOT EXISTS production_delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (production_delay_minutes >= 0),
  ADD COLUMN IF NOT EXISTS engineering_delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (engineering_delay_minutes >= 0);

ALTER TABLE operational_delays_archive
  ADD COLUMN IF NOT EXISTS category_bucket TEXT CHECK (category_bucket IN ('natural', 'non_production', 'production', 'engineering'));

-- ============================================
-- 2. machines: current SMR cache
-- Derive from latest close_smr when possible, but cache for fast dashboard lookup.
-- ============================================
ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS current_smr NUMERIC;

COMMENT ON COLUMN machines.current_smr IS 'Latest known close_smr; updated by control-room shift close';

-- ============================================
-- 3. operational_delays: category bucket mapping
-- Keeps detailed delay rows while allowing rollup into the four SMR buckets.
-- ============================================
ALTER TABLE operational_delays
  ADD COLUMN IF NOT EXISTS category_bucket TEXT CHECK (category_bucket IN ('natural', 'non_production', 'production', 'engineering'));

COMMENT ON COLUMN operational_delays.category_bucket IS 'Roll-up bucket for SMR delay reporting';

-- Seed a sensible default mapping from existing delay_categories names.
-- Operators can override per row; this is just a backfill convention.
UPDATE operational_delays
SET category_bucket = CASE
  WHEN delay_type = 'weather' THEN 'natural'
  WHEN delay_type IN ('shift_change', 'operator', 'other') THEN 'non_production'
  WHEN delay_type IN ('material', 'safety') THEN 'production'
  WHEN delay_type = 'equipment' THEN 'engineering'
  ELSE 'non_production'
END
WHERE category_bucket IS NULL;

-- ============================================
-- 4. Helper function: previous close SMR for a machine
-- ============================================
CREATE OR REPLACE FUNCTION get_machine_previous_close_smr(p_machine_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT close_smr
  FROM machine_operations
  WHERE machine_id = p_machine_id
    AND close_smr IS NOT NULL
  ORDER BY shift_date DESC, start_time DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_machine_previous_close_smr(UUID) TO authenticated;

-- ============================================
-- 5. Security: machines current_smr update policy
-- Only admins/supervisors/control_room roles may update current_smr.
-- ============================================
DROP POLICY IF EXISTS "machines_update_current_smr_control_room" ON machines;
CREATE POLICY "machines_update_current_smr_control_room"
  ON machines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.role = 'supervisor'
          OR e.role = 'control_room'
          OR e.department_id = machines.department_id
        )
    )
  )
  WITH CHECK (true);

-- Allow control-room roles to update operational_delays bucket
DROP POLICY IF EXISTS "operational_delays_update_bucket_control_room" ON operational_delays;
CREATE POLICY "operational_delays_update_bucket_control_room"
  ON operational_delays FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role IN ('admin', 'supervisor', 'control_room')
          OR e.department_id = operational_delays.department_id
        )
    )
  )
  WITH CHECK (true);
