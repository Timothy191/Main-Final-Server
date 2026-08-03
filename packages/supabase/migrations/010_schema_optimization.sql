-- ============================================
-- Schema Optimization: Indexes, Constraints, Soft Deletes
-- ============================================

-- 1. Soft Delete Columns
ALTER TABLE departments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE mine_blocks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE delay_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Missing Indexes for Performance
-- Foreign Keys
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_machines_department ON machines(department_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_department ON daily_logs(department_id);
CREATE INDEX IF NOT EXISTS idx_machine_operations_department ON machine_operations(department_id);
CREATE INDEX IF NOT EXISTS idx_machine_operations_machine ON machine_operations(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_operations_site ON machine_operations(site_id);
CREATE INDEX IF NOT EXISTS idx_machine_operations_operator ON machine_operations(operator_id);
CREATE INDEX IF NOT EXISTS idx_hourly_loads_department ON hourly_loads(department_id);
CREATE INDEX IF NOT EXISTS idx_hourly_loads_machine ON hourly_loads(machine_id);
-- CREATE INDEX IF NOT EXISTS idx_shift_notes_department ON shift_notes(department_id);
-- CREATE INDEX IF NOT EXISTS idx_shift_notes_category ON shift_notes(category_id);
CREATE INDEX IF NOT EXISTS idx_excavator_activity_department ON excavator_activity(department_id);
CREATE INDEX IF NOT EXISTS idx_excavator_activity_machine ON excavator_activity(machine_id);
CREATE INDEX IF NOT EXISTS idx_excavator_activity_operator ON excavator_activity(operator_id);
CREATE INDEX IF NOT EXISTS idx_dozer_rolls_department ON dozer_rolls(department_id);
CREATE INDEX IF NOT EXISTS idx_dozer_rolls_machine ON dozer_rolls(machine_id);
CREATE INDEX IF NOT EXISTS idx_dozer_rolls_operator ON dozer_rolls(operator_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_department ON generated_reports(department_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_template ON generated_reports(template_id);

-- Date & Search Columns
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_machine_operations_date ON machine_operations(shift_date DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_loads_date ON hourly_loads(load_date DESC);
-- CREATE INDEX IF NOT EXISTS idx_shift_notes_date ON shift_notes(note_date DESC);
CREATE INDEX IF NOT EXISTS idx_excavator_activity_date ON excavator_activity(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_dozer_rolls_date ON dozer_rolls(roll_date DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_date ON generated_reports(report_date DESC);

-- 3. Data Integrity Constraints
-- Role validation for employees
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_role_check') THEN
    ALTER TABLE employees ADD CONSTRAINT employees_role_check 
      CHECK (role IN ('admin', 'supervisor', 'operator', 'maintenance', 'viewer'));
  END IF;
END $$;

-- Standardize shift/shift_type across tables (ensuring consistency)
-- machine_operations uses shift_type
-- excavator_activity uses shift_type
-- dozer_rolls uses shift_type
-- shift_notes uses shift_type
-- daily_logs uses shift (legacy)
-- generated_reports uses shift_type

-- Ensure all shift columns follow the same rule
ALTER TABLE daily_logs DROP CONSTRAINT IF EXISTS daily_logs_shift_check;
ALTER TABLE daily_logs ADD CONSTRAINT daily_logs_shift_check CHECK (shift IN ('day', 'night'));

-- 4. Utility Functions for Soft Deletes
-- CREATE OR REPLACE FUNCTION public.is_not_deleted()
-- RETURNS BOOLEAN AS $$
--   SELECT deleted_at IS NULL;
-- $$ LANGUAGE sql STABLE;
