-- ============================================
-- Migration: 071_fix_partitioned_fk_relationships
-- Description: Fix broken FK relationships caused by daily_logs partitioning
--   (migration 020). The child tables (machine_hours, fuel_logs, production_logs)
--   still have FK constraints pointing to daily_logs_legacy. This migration:
--   1. Adds log_date column to each child table
--   2. Backfills log_date from parent daily_logs
--   3. Creates composite FK constraints: (daily_log_id, log_date) -> daily_logs(id, log_date)
--   4. Creates BEFORE INSERT trigger to auto-populate log_date
--
--   Follows the exact pattern established in migration 069 (department_id denormalization).
-- ============================================

-- ============================================
-- PART 1: TRIGGER FUNCTION
-- Auto-populates log_date from parent daily_log on INSERT.
-- Shared by all three child tables.
-- ============================================
CREATE OR REPLACE FUNCTION public.set_child_table_log_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT log_date INTO NEW.log_date
  FROM daily_logs
  WHERE id = NEW.daily_log_id;

  IF NEW.log_date IS NULL THEN
    RAISE EXCEPTION 'daily_log_id % does not exist in daily_logs', NEW.daily_log_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_child_table_log_date() IS
  'Trigger: auto-populates log_date on child tables from parent daily_log (required for composite FK to partitioned daily_logs).';

GRANT EXECUTE ON FUNCTION public.set_child_table_log_date() TO authenticated;


-- ============================================
-- PART 2: machine_hours
-- ============================================

ALTER TABLE machine_hours ADD COLUMN IF NOT EXISTS log_date DATE;

UPDATE machine_hours mh
SET log_date = dl.log_date
FROM daily_logs dl
WHERE dl.id = mh.daily_log_id
  AND mh.log_date IS NULL;

ALTER TABLE machine_hours ALTER COLUMN log_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_machine_hours_daily_log_composite
  ON machine_hours(daily_log_id, log_date);

ALTER TABLE machine_hours DROP CONSTRAINT IF EXISTS machine_hours_daily_log_id_fkey;

ALTER TABLE machine_hours
  ADD CONSTRAINT machine_hours_daily_log_id_log_date_fkey
  FOREIGN KEY (daily_log_id, log_date)
  REFERENCES daily_logs(id, log_date)
  ON DELETE CASCADE;

DROP TRIGGER IF EXISTS trg_machine_hours_set_log_date ON machine_hours;
CREATE TRIGGER trg_machine_hours_set_log_date
  BEFORE INSERT ON machine_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.set_child_table_log_date();


-- ============================================
-- PART 3: fuel_logs
-- ============================================

ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS log_date DATE;

UPDATE fuel_logs fl
SET log_date = dl.log_date
FROM daily_logs dl
WHERE dl.id = fl.daily_log_id
  AND fl.log_date IS NULL;

ALTER TABLE fuel_logs ALTER COLUMN log_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fuel_logs_daily_log_composite
  ON fuel_logs(daily_log_id, log_date);

ALTER TABLE fuel_logs DROP CONSTRAINT IF EXISTS fuel_logs_daily_log_id_fkey;

ALTER TABLE fuel_logs
  ADD CONSTRAINT fuel_logs_daily_log_id_log_date_fkey
  FOREIGN KEY (daily_log_id, log_date)
  REFERENCES daily_logs(id, log_date)
  ON DELETE CASCADE;

DROP TRIGGER IF EXISTS trg_fuel_logs_set_log_date ON fuel_logs;
CREATE TRIGGER trg_fuel_logs_set_log_date
  BEFORE INSERT ON fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_child_table_log_date();


-- ============================================
-- PART 4: production_logs
-- ============================================

ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS log_date DATE;

UPDATE production_logs pl
SET log_date = dl.log_date
FROM daily_logs dl
WHERE dl.id = pl.daily_log_id
  AND pl.log_date IS NULL;

ALTER TABLE production_logs ALTER COLUMN log_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_production_logs_daily_log_composite
  ON production_logs(daily_log_id, log_date);

ALTER TABLE production_logs DROP CONSTRAINT IF EXISTS production_logs_daily_log_id_fkey;

ALTER TABLE production_logs
  ADD CONSTRAINT production_logs_daily_log_id_log_date_fkey
  FOREIGN KEY (daily_log_id, log_date)
  REFERENCES daily_logs(id, log_date)
  ON DELETE CASCADE;

DROP TRIGGER IF EXISTS trg_production_logs_set_log_date ON production_logs;
CREATE TRIGGER trg_production_logs_set_log_date
  BEFORE INSERT ON production_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_child_table_log_date();


-- ============================================
-- PART 5: VERIFICATION (raises NOTICE, not error)
-- ============================================
DO $$
DECLARE
  fk_count INT;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint
  WHERE contype = 'f'
    AND conname IN (
      'machine_hours_daily_log_id_log_date_fkey',
      'fuel_logs_daily_log_id_log_date_fkey',
      'production_logs_daily_log_id_log_date_fkey'
    );

  RAISE NOTICE 'Migration 071: % of 3 composite FK constraints created', fk_count;
END $$;


-- ============================================================================
-- PRODUCTION DEPLOYMENT NOTE
-- ============================================================================
-- The backfill UPDATE requires ACCESS EXCLUSIVE lock on each table.
-- For tables with >1M rows, consider batching:
--
--   DO $$ DECLARE updated INT; BEGIN
--     LOOP
--       UPDATE machine_hours SET log_date = dl.log_date
--       FROM daily_logs dl
--       WHERE dl.id = machine_hours.daily_log_id
--         AND machine_hours.log_date IS NULL
--       LIMIT 10000;
--       GET DIAGNOSTICS updated = ROW_COUNT;
--       EXIT WHEN updated = 0;
--       COMMIT;
--       PERFORM pg_sleep(0.1);
--     END LOOP;
--   END $$;
-- ============================================================================
