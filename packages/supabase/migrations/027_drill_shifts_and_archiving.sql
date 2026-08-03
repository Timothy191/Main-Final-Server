-- ============================================
-- Drill Operations Shift Segregation & Archiving
-- ============================================

-- 1. Drop the single daily unique constraint
ALTER TABLE drill_operations 
  DROP CONSTRAINT IF EXISTS drill_operations_machine_id_operation_date_key;

-- 2. Enforce shift_type values and uniqueness per shift
ALTER TABLE drill_operations 
  ADD CONSTRAINT chk_shift_type CHECK (shift_type IN ('day', 'night'));

-- Allow one day shift and one night shift per machine per day
ALTER TABLE drill_operations
  ADD CONSTRAINT uq_drill_ops_machine_date_shift UNIQUE (machine_id, operation_date, shift_type);

-- ============================================
-- 3. Monthly Archival Table
-- ============================================
CREATE TABLE IF NOT EXISTS drill_operations_archive (
  LIKE drill_operations INCLUDING ALL
);

-- Remove the unique constraint on the archive table so it can hold infinite history safely
ALTER TABLE drill_operations_archive
  DROP CONSTRAINT IF EXISTS uq_drill_ops_machine_date_shift;

-- ============================================
-- 4. Archival Function
-- Safely moves operations older than 30 days to the archive
-- ============================================
CREATE OR REPLACE FUNCTION archive_monthly_drill_operations()
RETURNS void AS $$
BEGIN
  -- Move records older than the beginning of the previous month
  WITH moved_rows AS (
    DELETE FROM drill_operations
    WHERE operation_date < date_trunc('month', CURRENT_DATE)
    RETURNING *
  )
  INSERT INTO drill_operations_archive
  SELECT * FROM moved_rows;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on archive table
ALTER TABLE drill_operations_archive ENABLE ROW LEVEL SECURITY;

-- Admins and Department users can view archived records
CREATE POLICY "drill_operations_archive_select"
  ON drill_operations_archive FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = drill_operations_archive.department_id
          OR drill_operations_archive.department_id = ANY(e.accessible_departments)
        )
    )
  );
