-- ============================================
-- Schema Enhancements: Native Enums, Audit Columns, Generated Columns
-- ============================================

-- 1. Create Native Enum Types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
    CREATE TYPE role_type AS ENUM ('admin', 'supervisor', 'operator', 'maintenance', 'viewer', 'trainer', 'relief');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_type') THEN
    CREATE TYPE shift_type AS ENUM ('day', 'night');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_type') THEN
    CREATE TYPE incident_type AS ENUM ('near-miss', 'incident', 'lost-time', 'equipment-damage');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memory_type') THEN
    CREATE TYPE memory_type AS ENUM ('episodic', 'semantic', 'procedural');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_status_type') THEN
    CREATE TYPE shift_status_type AS ENUM ('open', 'closed');
  END IF;
END $$;

-- 2. Migrate Columns to Enum Types
-- Employees
-- Keep employees.role as TEXT to avoid breaking cross-table RLS policy dependencies in PostgreSQL.
-- The allowed values are already strictly validated via CHECK constraints.

-- Daily Logs
ALTER TABLE daily_logs ALTER COLUMN shift DROP DEFAULT;
ALTER TABLE daily_logs DROP CONSTRAINT IF EXISTS daily_logs_shift_check;
ALTER TABLE daily_logs ALTER COLUMN shift TYPE shift_type USING shift::shift_type;
ALTER TABLE daily_logs ALTER COLUMN shift SET DEFAULT 'day'::shift_type;

-- Safety Incidents
-- incident_type column in safety_incidents
ALTER TABLE safety_incidents DROP CONSTRAINT IF EXISTS safety_incidents_incident_type_check;
ALTER TABLE safety_incidents ALTER COLUMN incident_type TYPE incident_type USING incident_type::incident_type;

-- Memory Embeddings
ALTER TABLE memory_embeddings DROP CONSTRAINT IF EXISTS memory_embeddings_memory_type_check;
ALTER TABLE memory_embeddings DROP CONSTRAINT IF EXISTS memory_type_check;
ALTER TABLE memory_embeddings ALTER COLUMN memory_type DROP DEFAULT;
ALTER TABLE memory_embeddings ALTER COLUMN memory_type TYPE memory_type USING memory_type::memory_type;
ALTER TABLE memory_embeddings ALTER COLUMN memory_type SET DEFAULT 'episodic'::memory_type;

-- Shift Status
ALTER TABLE shift_status DROP CONSTRAINT IF EXISTS shift_status_shift_type_check;
ALTER TABLE shift_status DROP CONSTRAINT IF EXISTS shift_status_status_check;
ALTER TABLE shift_status ALTER COLUMN status DROP DEFAULT;
ALTER TABLE shift_status ALTER COLUMN shift_type TYPE shift_type USING shift_type::shift_type;
ALTER TABLE shift_status ALTER COLUMN status TYPE shift_status_type USING status::shift_status_type;
ALTER TABLE shift_status ALTER COLUMN status SET DEFAULT 'open'::shift_status_type;

-- 3. Add Soft Delete to Missing Tables
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. Add Audit Trail Columns
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES employees(id);

ALTER TABLE hourly_loads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);
ALTER TABLE hourly_loads ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES employees(id);

ALTER TABLE machine_hours ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);
ALTER TABLE machine_hours ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES employees(id);

ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES employees(id);

ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);
ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES employees(id);

-- 5. Add Generated Columns for Calculations
-- Breakdown duration (hours)
ALTER TABLE breakdowns DROP COLUMN IF EXISTS duration_hours;
ALTER TABLE breakdowns ADD COLUMN duration_hours NUMERIC 
GENERATED ALWAYS AS (
  CASE 
    WHEN date_out IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (
        (date_out + time_out::interval) - (date_in + time_in::interval)
      )) / 3600
    ELSE NULL
  END
) STORED;

-- 6. Update Comments
COMMENT ON COLUMN employees.role IS 'Enum: admin, supervisor, operator, maintenance, viewer, trainer, relief';
COMMENT ON COLUMN daily_logs.shift IS 'Enum: day, night';
COMMENT ON COLUMN safety_incidents.incident_type IS 'Enum: near-miss, incident, lost-time, equipment-damage';
COMMENT ON COLUMN memory_embeddings.memory_type IS 'Enum: episodic, semantic, procedural';
COMMENT ON COLUMN breakdowns.duration_hours IS 'Automatically calculated duration between book-in and book-out';
