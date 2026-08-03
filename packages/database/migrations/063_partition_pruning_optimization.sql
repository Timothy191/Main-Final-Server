-- ============================================
-- Migration: 063_partition_pruning_optimization
-- Description: Add check constraints to partitions for constraint exclusion
--              and implement automatic partition archiving function.
--
--              Benefits:
--              1. PostgreSQL query planner can exclude entire partitions
--                 based on WHERE clauses (constraint exclusion)
--              2. Automatic archiving of old partitions to separate tables
--              3. Reduced query time for date-range filtered queries
-- ============================================

-- ============================================
-- PART 1: Add check constraints to existing partitions
-- ============================================

-- Function to add check constraints to all partitions
CREATE OR REPLACE FUNCTION public.add_partition_check_constraints()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  partition_record RECORD;
  partition_name TEXT;
  table_name TEXT;
  date_column TEXT;
  partition_start DATE;
  partition_end DATE;
BEGIN
  -- Process hourly_loads partitions
  FOR partition_record IN 
    SELECT 
      c.relname AS partition_name,
      'hourly_loads' AS table_name,
      'load_date' AS date_column
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_inherits i ON i.inhrelid = c.oid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = 'hourly_loads'
    AND n.nspname = 'public'
    AND c.relname LIKE 'hourly_loads_%'
  LOOP
    partition_name := partition_record.partition_name;
    table_name := partition_record.table_name;
    date_column := partition_record.date_column;
    
    -- Extract year and month from partition name (format: hourly_loads_YYYY_MM)
    BEGIN
      partition_start := to_date(substring(partition_name from 'hourly_loads_[0-9]{4}_[0-9]{2}'), 'hourly_loads_YYYY_MM');
      partition_end := partition_start + INTERVAL '1 month';
      
      -- Add check constraint if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = partition_name || '_check_' || date_column
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %s CHECK (%s >= %L AND %s < %L)',
          partition_name,
          partition_name || '_check_' || date_column,
          date_column,
          partition_start,
          date_column,
          partition_end
        );
        RAISE NOTICE 'Added check constraint to partition: %', partition_name;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping partition % due to error: %', partition_name, SQLERRM;
    END;
  END LOOP;
  
  -- Process daily_logs partitions
  FOR partition_record IN 
    SELECT 
      c.relname AS partition_name,
      'daily_logs' AS table_name,
      'log_date' AS date_column
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_inherits i ON i.inhrelid = c.oid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = 'daily_logs'
    AND n.nspname = 'public'
    AND c.relname LIKE 'daily_logs_%'
  LOOP
    partition_name := partition_record.partition_name;
    table_name := partition_record.table_name;
    date_column := partition_record.date_column;
    
    -- Extract year and month from partition name (format: daily_logs_YYYY_MM)
    BEGIN
      partition_start := to_date(substring(partition_name from 'daily_logs_[0-9]{4}_[0-9]{2}'), 'daily_logs_YYYY_MM');
      partition_end := partition_start + INTERVAL '1 month';
      
      -- Add check constraint if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = partition_name || '_check_' || date_column
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %s CHECK (%s >= %L AND %s < %L)',
          partition_name,
          partition_name || '_check_' || date_column,
          date_column,
          partition_start,
          date_column,
          partition_end
        );
        RAISE NOTICE 'Added check constraint to partition: %', partition_name;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping partition % due to error: %', partition_name, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Run the function to add constraints to existing partitions
SELECT public.add_partition_check_constraints();

-- Update the auto-partition creation function to include check constraints
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
    
    -- Add check constraint for constraint exclusion
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %s CHECK (load_date >= %L AND load_date < %L)',
      hl_partition,
      hl_partition || '_check_load_date',
      next_month_start,
      next_month_start,
      next_month_end
    );
    
    RAISE NOTICE 'Created partition with check constraint: %', hl_partition;
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
    
    -- Add check constraint for constraint exclusion
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %s CHECK (log_date >= %L AND log_date < %L)',
      dl_partition,
      dl_partition || '_check_log_date',
      next_month_start,
      next_month_start,
      next_month_end
    );
    
    RAISE NOTICE 'Created partition with check constraint: %', dl_partition;
  END IF;
END;
$$;

-- ============================================
-- PART 2: Automatic partition archiving function
-- ============================================

-- Create archive schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS archive;

-- Grant usage on archive schema
GRANT USAGE ON SCHEMA archive TO authenticated;

-- Function to archive old partitions (older than 12 months)
CREATE OR REPLACE FUNCTION public.archive_old_partitions(months_to_keep INT DEFAULT 12)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cutoff_date DATE := date_trunc('month', NOW() - INTERVAL '1 month' * months_to_keep)::DATE;
  partition_record RECORD;
  archive_table_name TEXT;
BEGIN
  -- Archive hourly_loads partitions older than cutoff
  FOR partition_record IN 
    SELECT 
      c.relname AS partition_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_inherits i ON i.inhrelid = c.oid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = 'hourly_loads'
    AND n.nspname = 'public'
    AND c.relname LIKE 'hourly_loads_%'
  LOOP
    -- Extract date from partition name
    BEGIN
      DECLARE
        partition_date DATE := to_date(substring(partition_record.partition_name from 'hourly_loads_[0-9]{4}_[0-9]{2}'), 'YYYY_MM');
      BEGIN
        IF partition_date < cutoff_date THEN
          archive_table_name := 'archive.' || partition_record.partition_name;
          
          -- Detach partition from parent
          EXECUTE format('ALTER TABLE hourly_loads DETACH PARTITION %I', partition_record.partition_name);
          
          -- Move to archive schema
          EXECUTE format('ALTER TABLE %I SET SCHEMA archive', partition_record.partition_name);
          
          RAISE NOTICE 'Archived partition: % to %', partition_record.partition_name, archive_table_name;
        END IF;
      END;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping partition % due to error: %', partition_record.partition_name, SQLERRM;
    END;
  END LOOP;
  
  -- Archive daily_logs partitions older than cutoff
  FOR partition_record IN 
    SELECT 
      c.relname AS partition_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_inherits i ON i.inhrelid = c.oid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = 'daily_logs'
    AND n.nspname = 'public'
    AND c.relname LIKE 'daily_logs_%'
  LOOP
    BEGIN
      DECLARE
        partition_date DATE := to_date(substring(partition_record.partition_name from 'daily_logs_[0-9]{4}_[0-9]{2}'), 'YYYY_MM');
      BEGIN
        IF partition_date < cutoff_date THEN
          archive_table_name := 'archive.' || partition_record.partition_name;
          
          -- Detach partition from parent
          EXECUTE format('ALTER TABLE daily_logs DETACH PARTITION %I', partition_record.partition_name);
          
          -- Move to archive schema
          EXECUTE format('ALTER TABLE %I SET SCHEMA archive', partition_record.partition_name);
          
          RAISE NOTICE 'Archived partition: % to %', partition_record.partition_name, archive_table_name;
        END IF;
      END;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping partition % due to error: %', partition_record.partition_name, SQLERRM;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_old_partitions(INT) TO authenticated;

COMMENT ON FUNCTION public.archive_old_partitions(INT) IS 
'Archives partitions older than specified months to archive schema. 
Default: 12 months. Run monthly via pg_cron.';

-- ============================================
-- PART 3: Update pg_cron schedule for archiving
-- ============================================

-- Schedule partition archiving for the 15th of each month at 02:00
-- This runs after partition creation (1st of month) to give time for data to settle
SELECT cron.schedule(
  'archive-old-partitions',
  '0 2 15 * *',
  'SELECT public.archive_old_partitions(12)'
);

-- Remove existing schedule if it exists (idempotent)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'archive-old-partitions';

-- Re-schedule with proper timing
SELECT cron.schedule(
  'archive-old-partitions',
  '0 2 15 * *',
  'SELECT public.archive_old_partitions(12)'
);

COMMENT ON FUNCTION public.add_partition_check_constraints() IS 
'Adds check constraints to existing partitions to enable constraint exclusion.
Call this once after migration to backfill constraints on existing partitions.';
