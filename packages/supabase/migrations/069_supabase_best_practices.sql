-- ============================================
-- Migration: 070_supabase_best_practices
-- Description: Apply Supabase Postgres Best Practices:
--   1. GIN index on employees.accessible_departments for RLS ANY() lookups
--   2. BRIN indexes on partitioned table date columns for efficient range scans
--   3. Denormalize department_id into child tables (machine_hours, fuel_logs,
--      production_logs) to eliminate RLS JOIN overhead
--   4. Consolidate duplicate function definitions
-- ============================================

-- ============================================
-- PART 1: GIN INDEX ON employees.accessible_departments
-- Target: RLS policies using target_dept_id = ANY(uuid[])
-- Impact: High — accelerates every has_department_access() call
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employees_accessible_depts_gin
  ON employees USING GIN (accessible_departments);

COMMENT ON INDEX idx_employees_accessible_depts_gin IS
  'GIN index for array ANY() lookups in has_department_access() RLS helper.';


-- ============================================
-- PART 2: BRIN INDEXES ON PARTITIONED TABLES
-- BRIN indexes are ~100-200× smaller than equivalent B-tree indexes
-- for naturally-ordered time-series data. They excel at large date-range
-- scans on partitioned tables.
--
-- pages_per_range=32 balances index size against scan precision.
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hourly_loads_load_date_brin
  ON hourly_loads USING BRIN (load_date) WITH (pages_per_range = 32);

CREATE INDEX IF NOT EXISTS idx_daily_logs_log_date_brin
  ON daily_logs USING BRIN (log_date) WITH (pages_per_range = 32);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_brin
  ON audit_logs USING BRIN (created_at) WITH (pages_per_range = 32);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_created_at_brin
  ON memory_embeddings USING BRIN (created_at) WITH (pages_per_range = 32);

COMMENT ON INDEX idx_hourly_loads_load_date_brin IS
  'BRIN index: efficient range scans on load_date. ~200× smaller than B-tree for time-series.';
COMMENT ON INDEX idx_daily_logs_log_date_brin IS
  'BRIN index: efficient range scans on log_date. ~200× smaller than B-tree for time-series.';
COMMENT ON INDEX idx_audit_logs_created_at_brin IS
  'BRIN index: efficient range scans on created_at. ~200× smaller than B-tree for time-series.';
COMMENT ON INDEX idx_memory_embeddings_created_at_brin IS
  'BRIN index: efficient range scans on created_at. ~200× smaller than B-tree for time-series.';


-- ============================================
-- PART 3: DENORMALIZE department_id INTO CHILD TABLES
-- Root cause: RLS on machine_hours / fuel_logs / production_logs currently
-- forces a JOIN through daily_logs for EVERY row examined:
--
--   EXISTS (SELECT 1 FROM daily_logs dl
--           WHERE dl.id = child.daily_log_id
--           AND public.has_department_access(dl.department_id))
--
-- A denormalized department_id column eliminates this JOIN, letting the RLS
-- policy become a simple:
--
--   public.has_department_access(department_id)
--
-- A BEFORE INSERT trigger auto-populates the column from the parent daily_log,
-- so application code never needs to set it explicitly.
-- ============================================

-- ---------- Trigger function (shared by all three tables) ----------
CREATE OR REPLACE FUNCTION public.set_child_table_department_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT department_id INTO NEW.department_id
  FROM daily_logs
  WHERE id = NEW.daily_log_id;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_child_table_department_id() IS
  'Trigger: auto-populates department_id on child tables from parent daily_log.';

GRANT EXECUTE ON FUNCTION public.set_child_table_department_id() TO authenticated;


-- ---------- machine_hours ----------
ALTER TABLE machine_hours ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE CASCADE;

-- Backfill existing rows before adding NOT NULL constraint
UPDATE machine_hours mh
SET department_id = dl.department_id
FROM daily_logs dl
WHERE dl.id = mh.daily_log_id
  AND mh.department_id IS NULL;

ALTER TABLE machine_hours ALTER COLUMN department_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_machine_hours_department_id ON machine_hours(department_id);

DROP TRIGGER IF EXISTS trg_machine_hours_set_department_id ON machine_hours;
CREATE TRIGGER trg_machine_hours_set_department_id
  BEFORE INSERT ON machine_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.set_child_table_department_id();


-- ---------- fuel_logs ----------
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE CASCADE;

UPDATE fuel_logs fl
SET department_id = dl.department_id
FROM daily_logs dl
WHERE dl.id = fl.daily_log_id
  AND fl.department_id IS NULL;

ALTER TABLE fuel_logs ALTER COLUMN department_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fuel_logs_department_id ON fuel_logs(department_id);

DROP TRIGGER IF EXISTS trg_fuel_logs_set_department_id ON fuel_logs;
CREATE TRIGGER trg_fuel_logs_set_department_id
  BEFORE INSERT ON fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_child_table_department_id();


-- ---------- production_logs ----------
ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE CASCADE;

UPDATE production_logs pl
SET department_id = dl.department_id
FROM daily_logs dl
WHERE dl.id = pl.daily_log_id
  AND pl.department_id IS NULL;

ALTER TABLE production_logs ALTER COLUMN department_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_production_logs_department_id ON production_logs(department_id);

DROP TRIGGER IF EXISTS trg_production_logs_set_department_id ON production_logs;
CREATE TRIGGER trg_production_logs_set_department_id
  BEFORE INSERT ON production_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_child_table_department_id();


-- ═══════════════════════════════════════════════════════════════════════
-- ⚠️  PRODUCTION DEPLOYMENT NOTE
-- ═══════════════════════════════════════════════════════════════════════
-- The backfill UPDATE and ALTER COLUMN SET NOT NULL below require an
-- ACCESS EXCLUSIVE lock and a full table scan on each target table.
-- For tables with >1M rows, run this migration during a maintenance
-- window. If needed, the backfill can be batched in smaller chunks:
--
--   DO $$ DECLARE updated INT; BEGIN
--     LOOP
--       UPDATE machine_hours SET department_id = dl.department_id
--       FROM daily_logs dl
--       WHERE dl.id = machine_hours.daily_log_id
--         AND machine_hours.department_id IS NULL
--       LIMIT 10000;
--       GET DIAGNOSTICS updated = ROW_COUNT;
--       EXIT WHEN updated = 0;
--       COMMIT;
--       PERFORM pg_sleep(0.1);
--     END LOOP;
--   END $$;
-- ═══════════════════════════════════════════════════════════════════════

-- ============================================
-- 3b. Update RLS policies to use direct department_id column
-- ============================================

-- machine_hours SELECT
DROP POLICY IF EXISTS "machine_hours_select_access" ON machine_hours;
DROP POLICY IF EXISTS "machine_hours_select_department" ON machine_hours;
CREATE POLICY "machine_hours_select_access"
  ON machine_hours FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- machine_hours INSERT
DROP POLICY IF EXISTS "machine_hours_insert_access" ON machine_hours;
DROP POLICY IF EXISTS "machine_hours_insert_department" ON machine_hours;
CREATE POLICY "machine_hours_insert_access"
  ON machine_hours FOR INSERT
  TO authenticated
  WITH CHECK (public.has_department_access(department_id));

-- fuel_logs SELECT
DROP POLICY IF EXISTS "fuel_logs_select_access" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_select_department" ON fuel_logs;
CREATE POLICY "fuel_logs_select_access"
  ON fuel_logs FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- fuel_logs INSERT
DROP POLICY IF EXISTS "fuel_logs_insert_access" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_insert_department" ON fuel_logs;
CREATE POLICY "fuel_logs_insert_access"
  ON fuel_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_department_access(department_id));

-- production_logs SELECT
DROP POLICY IF EXISTS "production_logs_select_access" ON production_logs;
DROP POLICY IF EXISTS "production_logs_select_department" ON production_logs;
CREATE POLICY "production_logs_select_access"
  ON production_logs FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- production_logs INSERT
DROP POLICY IF EXISTS "production_logs_insert_access" ON production_logs;
DROP POLICY IF EXISTS "production_logs_insert_department" ON production_logs;
CREATE POLICY "production_logs_insert_access"
  ON production_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_department_access(department_id));


-- ============================================
-- PART 4: CONSOLIDATE DUPLICATE FUNCTION DEFINITIONS
-- The following functions are defined across multiple migrations.
-- `CREATE OR REPLACE` means only the latest definition survives.
-- This migration explicitly recreates them as the single authoritative source:
--
--   is_active()                   — first in 012, latest in 999
--   create_next_month_partitions() — first in 020, latest in 068
-- ============================================

-- Authoritative is_active() — soft-delete RLS helper
CREATE OR REPLACE FUNCTION public.is_active(record_deleted_at TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT record_deleted_at IS NULL;
$$;

-- Authoritative create_next_month_partitions() — covers all 4 partitioned tables
CREATE OR REPLACE FUNCTION public.create_next_month_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_month_start DATE := date_trunc('month', NOW() + INTERVAL '1 month')::DATE;
  next_month_end   DATE := (next_month_start + INTERVAL '1 month')::DATE;
  yr               TEXT := to_char(next_month_start, 'YYYY');
  mo               TEXT := to_char(next_month_start, 'MM');
  hl_partition     TEXT := format('hourly_loads_%s_%s', yr, mo);
  dl_partition     TEXT := format('daily_logs_%s_%s', yr, mo);
  al_partition     TEXT := format('audit_logs_%s_%s', yr, mo);
  me_partition     TEXT := format('memory_embeddings_%s_%s', yr, mo);
BEGIN
  -- hourly_loads
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = hl_partition) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF hourly_loads FOR VALUES FROM (%L) TO (%L)',
      hl_partition, next_month_start, next_month_end
    );
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %s CHECK (load_date >= %L AND load_date < %L)',
      hl_partition, hl_partition || '_check_load_date', next_month_start, next_month_end
    );
  END IF;

  -- daily_logs
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = dl_partition) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF daily_logs FOR VALUES FROM (%L) TO (%L)',
      dl_partition, next_month_start, next_month_end
    );
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %s CHECK (log_date >= %L AND log_date < %L)',
      dl_partition, dl_partition || '_check_log_date', next_month_start, next_month_end
    );
  END IF;

  -- audit_logs
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = al_partition) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
      al_partition, next_month_start, next_month_end
    );
  END IF;

  -- memory_embeddings
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = me_partition) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF memory_embeddings FOR VALUES FROM (%L) TO (%L)',
      me_partition, next_month_start, next_month_end
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.is_active(TIMESTAMPTZ) IS
  'Authoritative (migration 070). Returns TRUE when record_deleted_at IS NULL.';
COMMENT ON FUNCTION public.create_next_month_partitions() IS
  'Authoritative (migration 070). Creates next-month partitions for all 4 time-series tables.';
