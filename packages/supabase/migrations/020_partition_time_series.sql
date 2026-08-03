-- ============================================
-- Migration: 020_partition_time_series
-- Description: Convert hourly_loads and daily_logs to partitioned tables
--              using RANGE partitioning on their date columns.
--              Monthly partitions created for 2025-01 through 2027-12.
--              Auto-partition function added for future months.
-- ============================================

-- ============================================
-- PART 1: PARTITION hourly_loads BY load_date
-- ============================================

-- 1a. Rename existing table to legacy
ALTER TABLE hourly_loads RENAME TO hourly_loads_legacy;

-- 1b. Remove RLS from legacy (policies transferred below)
ALTER TABLE hourly_loads_legacy DISABLE ROW LEVEL SECURITY;

-- 1c. Create new partitioned table
--     NOTE: GENERATED ALWAYS AS columns are inherited by partitions.
--     UNIQUE constraint must include the partition key (load_date) — it does.
--     FK references (department_id, machine_id) are declared on parent only;
--     PostgreSQL 12+ propagates constraints to child partitions automatically.
CREATE TABLE hourly_loads (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  load_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  hour_01 INTEGER NOT NULL DEFAULT 0,
  hour_02 INTEGER NOT NULL DEFAULT 0,
  hour_03 INTEGER NOT NULL DEFAULT 0,
  hour_04 INTEGER NOT NULL DEFAULT 0,
  hour_05 INTEGER NOT NULL DEFAULT 0,
  hour_06 INTEGER NOT NULL DEFAULT 0,
  hour_07 INTEGER NOT NULL DEFAULT 0,
  hour_08 INTEGER NOT NULL DEFAULT 0,
  hour_09 INTEGER NOT NULL DEFAULT 0,
  hour_10 INTEGER NOT NULL DEFAULT 0,
  hour_11 INTEGER NOT NULL DEFAULT 0,
  hour_12 INTEGER NOT NULL DEFAULT 0,
  total_loads INTEGER GENERATED ALWAYS AS (
    hour_01 + hour_02 + hour_03 + hour_04 + hour_05 + hour_06 +
    hour_07 + hour_08 + hour_09 + hour_10 + hour_11 + hour_12
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  PRIMARY KEY (id, load_date),
  UNIQUE (machine_id, load_date, shift_type)
) PARTITION BY RANGE (load_date);

-- 1d. Enable RLS on partitioned parent
ALTER TABLE hourly_loads ENABLE ROW LEVEL SECURITY;

-- 1e. RLS policies (use has_department_access helper from migration 012)
CREATE POLICY "hourly_loads_select_access"
  ON hourly_loads FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

CREATE POLICY "hourly_loads_insert_access"
  ON hourly_loads FOR INSERT
  TO authenticated
  WITH CHECK (public.has_department_access(department_id));

CREATE POLICY "hourly_loads_update_access"
  ON hourly_loads FOR UPDATE
  TO authenticated
  USING (public.has_department_access(department_id));

-- 1f. Indexes on partitioned parent (inherited by all partitions)
CREATE INDEX idx_hourly_loads_department_date ON hourly_loads(department_id, load_date DESC);
CREATE INDEX idx_hourly_loads_machine_date    ON hourly_loads(machine_id, load_date DESC);
CREATE INDEX idx_hourly_loads_shift_type      ON hourly_loads(shift_type);

-- 1g. Create monthly partitions: 2025-01 through 2027-12
DO $$
DECLARE
  yr  INT;
  mo  INT;
  partition_start DATE;
  partition_end   DATE;
  partition_name  TEXT;
BEGIN
  FOR yr IN 2025..2027 LOOP
    FOR mo IN 1..12 LOOP
      partition_start := make_date(yr, mo, 1);
      partition_end   := partition_start + INTERVAL '1 month';
      partition_name  := format('hourly_loads_%s_%s', yr, lpad(mo::text, 2, '0'));

      -- Skip if already exists
      IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name AND n.nspname = 'public'
      ) THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF hourly_loads FOR VALUES FROM (%L) TO (%L)',
          partition_name, partition_start, partition_end
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 1h. Migrate data from legacy table
INSERT INTO hourly_loads (
  id, department_id, machine_id, load_date, shift_type,
  hour_01, hour_02, hour_03, hour_04, hour_05, hour_06,
  hour_07, hour_08, hour_09, hour_10, hour_11, hour_12,
  created_at, updated_at, created_by, updated_by
)
SELECT
  id, department_id, machine_id, load_date, shift_type,
  hour_01, hour_02, hour_03, hour_04, hour_05, hour_06,
  hour_07, hour_08, hour_09, hour_10, hour_11, hour_12,
  created_at, updated_at, created_by, updated_by
FROM hourly_loads_legacy;

-- 1i. Recreate updated_at trigger on new partitioned table
DROP TRIGGER IF EXISTS update_hourly_loads_updated_at ON hourly_loads_legacy;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hourly_loads_updated_at
  BEFORE UPDATE ON hourly_loads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- PART 2: PARTITION daily_logs BY log_date
-- ============================================

-- 2a. Rename existing table to legacy
ALTER TABLE daily_logs RENAME TO daily_logs_legacy;

-- 2b. Disable RLS on legacy
ALTER TABLE daily_logs_legacy DISABLE ROW LEVEL SECURITY;

-- 2c. Create new partitioned table
--     Note: machine_hours and fuel_logs reference daily_logs(id) via FK.
--     PostgreSQL 12+ supports FK references to partitioned tables.
CREATE TABLE daily_logs (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('day', 'night')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  idempotency_key UUID DEFAULT gen_random_uuid(),
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, log_date),
  UNIQUE (department_id, log_date, shift)
) PARTITION BY RANGE (log_date);

-- 2d. Enable RLS on parent
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- 2e. RLS policies
CREATE POLICY "daily_logs_select_access"
  ON daily_logs FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

CREATE POLICY "daily_logs_insert_access"
  ON daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_department_access(department_id));

CREATE POLICY "daily_logs_update_access"
  ON daily_logs FOR UPDATE
  TO authenticated
  USING (public.has_department_access(department_id));

-- 2f. Indexes on parent
CREATE INDEX idx_daily_logs_department_date ON daily_logs(department_id, log_date DESC);
CREATE INDEX idx_daily_logs_shift           ON daily_logs(shift);
CREATE INDEX idx_daily_logs_sync_status     ON daily_logs(sync_status) WHERE sync_status != 'synced';

-- 2g. Monthly partitions: 2025-01 through 2027-12
DO $$
DECLARE
  yr  INT;
  mo  INT;
  partition_start DATE;
  partition_end   DATE;
  partition_name  TEXT;
BEGIN
  FOR yr IN 2025..2027 LOOP
    FOR mo IN 1..12 LOOP
      partition_start := make_date(yr, mo, 1);
      partition_end   := partition_start + INTERVAL '1 month';
      partition_name  := format('daily_logs_%s_%s', yr, lpad(mo::text, 2, '0'));

      IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name AND n.nspname = 'public'
      ) THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF daily_logs FOR VALUES FROM (%L) TO (%L)',
          partition_name, partition_start, partition_end
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 2h. Migrate data from legacy
INSERT INTO daily_logs (
  id, department_id, log_date, shift, notes, created_at, updated_at,
  created_by, updated_by, sync_status, idempotency_key, last_synced_at
)
SELECT
  id, department_id, log_date, shift, notes, created_at, updated_at,
  created_by, updated_by, sync_status, idempotency_key, last_synced_at
FROM daily_logs_legacy;

-- 2i. Updated_at trigger on new partitioned table
CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- PART 3: Auto-partition creation function
-- (called by pg_cron on the 1st of each month)
-- ============================================

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
BEGIN
  -- hourly_loads partition
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = hl_partition AND n.nspname = 'public'
  ) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF hourly_loads FOR VALUES FROM (%L) TO (%L)',
      hl_partition, next_month_start, next_month_end
    );
    RAISE NOTICE 'Created partition: %', hl_partition;
  END IF;

  -- daily_logs partition
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = dl_partition AND n.nspname = 'public'
  ) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF daily_logs FOR VALUES FROM (%L) TO (%L)',
      dl_partition, next_month_start, next_month_end
    );
    RAISE NOTICE 'Created partition: %', dl_partition;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_next_month_partitions() TO authenticated;
