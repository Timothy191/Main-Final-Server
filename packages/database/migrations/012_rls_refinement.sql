-- ============================================
-- RLS Policy Refinement & Soft Delete Support
-- ============================================

-- 1. Helper Function for Soft Delete filtering in policies
CREATE OR REPLACE FUNCTION public.is_active(record_deleted_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
  SELECT record_deleted_at IS NULL;
$$ LANGUAGE sql STABLE;

-- 2. Refine Department Select Policy
DROP POLICY IF EXISTS "departments_select_all" ON departments;
CREATE POLICY "departments_select_active"
  ON departments FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- 3. Refine Employee Select Policy
DROP POLICY IF EXISTS "employees_select_self_or_admin" ON employees;
CREATE POLICY "employees_select_active"
  ON employees FOR SELECT
  TO authenticated
  USING (
    (auth_id = auth.uid() OR public.is_admin())
    AND deleted_at IS NULL
  );

-- 4. Refine Machine Select Policy
DROP POLICY IF EXISTS "machines_select_department" ON machines;
CREATE POLICY "machines_select_department_active"
  ON machines FOR SELECT
  TO authenticated
  USING (
    public.has_department_access(department_id)
    AND deleted_at IS NULL
  );

-- 5. Refine Operator Select Policy
DROP POLICY IF EXISTS "operators_select_all" ON operators;
CREATE POLICY "operators_select_active"
  ON operators FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND active = true);

-- 6. Refine Site Select Policy
DROP POLICY IF EXISTS "sites_select_all" ON sites;
CREATE POLICY "sites_select_active"
  ON sites FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND active = true);

-- 7. Update existing policies to use helper functions for clarity
-- Machine Operations
DROP POLICY IF EXISTS "machine_operations_select_department" ON machine_operations;
CREATE POLICY "machine_operations_select_access"
  ON machine_operations FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- Hourly Loads
DROP POLICY IF EXISTS "hourly_loads_select_department" ON hourly_loads;
CREATE POLICY "hourly_loads_select_access"
  ON hourly_loads FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- Shift Notes
-- DROP POLICY IF EXISTS "shift_notes_select_department" ON shift_notes;
-- CREATE POLICY "shift_notes_select_access"
--   ON shift_notes FOR SELECT
--   TO authenticated
--   USING (public.has_department_access(department_id));

-- Excavator Activity
DROP POLICY IF EXISTS "excavator_activity_select_department" ON excavator_activity;
CREATE POLICY "excavator_activity_select_access"
  ON excavator_activity FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- Dozer Rolls
DROP POLICY IF EXISTS "dozer_rolls_select_department" ON dozer_rolls;
CREATE POLICY "dozer_rolls_select_access"
  ON dozer_rolls FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- Audit Logs (Admin only for full view, department access for filtered view)
DROP POLICY IF EXISTS "audit_logs_select_department" ON audit_logs;
CREATE POLICY "audit_logs_select_access"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    public.is_admin() 
    OR public.has_department_access(department_id)
  );
