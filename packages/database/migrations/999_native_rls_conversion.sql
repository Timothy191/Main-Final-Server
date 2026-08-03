-- ============================================
-- Native PostgreSQL RLS Policy Conversion
-- Replaces Supabase auth.* functions with native PostgreSQL equivalents
-- ============================================

-- 1. Create native authentication helper functions
-- Replace Supabase auth.uid() with PostgreSQL current_user
-- Replace Supabase auth.* functions with custom implementations

-- Helper function to get current user ID from session
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT user_id FROM sessions WHERE session_token = current_setting('app.current_session_token', true) AND expires_at > NOW()),
    NULL
  );
$$;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE auth_id = public.current_user_id()
    AND role = 'admin'
    AND deleted_at IS NULL
  );
$$;

-- Helper function to get current user's department
CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM employees
  WHERE auth_id = public.current_user_id()
  AND deleted_at IS NULL
  LIMIT 1;
$$;

-- Helper function to check if user has access to a department
CREATE OR REPLACE FUNCTION public.has_department_access(target_dept_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE auth_id = public.current_user_id()
    AND (
      role = 'admin'
      OR department_id = target_dept_id
      OR target_dept_id = ANY(accessible_departments)
    )
    AND deleted_at IS NULL
  );
$$;

-- Helper function to check if user has access to a site
CREATE OR REPLACE FUNCTION public.has_site_access(target_site_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees e
    JOIN site_assignments sa ON sa.employee_id = e.id
    WHERE e.auth_id = public.current_user_id()
    AND (e.role = 'admin' OR sa.site_id = target_site_id)
    AND e.deleted_at IS NULL
  );
$$;

-- Helper function for soft delete filtering
CREATE OR REPLACE FUNCTION public.is_active(record_deleted_at TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT record_deleted_at IS NULL;
$$;

-- ============================================
-- Apply RLS policies using native PostgreSQL functions
-- ============================================

-- Departments
DROP POLICY IF EXISTS "departments_select_all" ON departments;
CREATE POLICY "departments_select_active"
  ON departments FOR SELECT
  TO authenticated
  USING (public.is_active(deleted_at));

-- Employees
DROP POLICY IF EXISTS "employees_select_self_or_admin" ON employees;
CREATE POLICY "employees_select_active"
  ON employees FOR SELECT
  TO authenticated
  USING (
    (auth_id = public.current_user_id() OR public.is_admin())
    AND public.is_active(deleted_at)
  );

DROP POLICY IF EXISTS "employees_update_self_or_admin" ON employees;
CREATE POLICY "employees_update_active"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    (auth_id = public.current_user_id() OR public.is_admin())
    AND public.is_active(deleted_at)
  )
  WITH CHECK (
    (auth_id = public.current_user_id() OR public.is_admin())
    AND public.is_active(deleted_at)
  );

DROP POLICY IF EXISTS "employees_insert_admin_only" ON employees;
CREATE POLICY "employees_insert_admin_only"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Machines
DROP POLICY IF EXISTS "machines_select_department" ON machines;
CREATE POLICY "machines_select_department_active"
  ON machines FOR SELECT
  TO authenticated
  USING (
    public.has_department_access(department_id)
    AND public.is_active(deleted_at)
  );

DROP POLICY IF EXISTS "machines_insert_admin_supervisor" ON machines;
CREATE POLICY "machines_insert_admin_supervisor"
  ON machines FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = public.current_user_id()
      AND role = 'supervisor'
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "machines_update_admin_supervisor" ON machines;
CREATE POLICY "machines_update_admin_supervisor"
  ON machines FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = public.current_user_id()
      AND role = 'supervisor'
      AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = public.current_user_id()
      AND role = 'supervisor'
      AND deleted_at IS NULL
    )
  );

-- Daily Logs
DROP POLICY IF EXISTS "daily_logs_select_department" ON daily_logs;
CREATE POLICY "daily_logs_select_access"
  ON daily_logs FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

DROP POLICY IF EXISTS "daily_logs_insert_department" ON daily_logs;
CREATE POLICY "daily_logs_insert_access"
  ON daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_department_access(department_id));

-- Machine Hours
DROP POLICY IF EXISTS "machine_hours_select_department" ON machine_hours;
CREATE POLICY "machine_hours_select_access"
  ON machine_hours FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      WHERE dl.id = machine_hours.daily_log_id
      AND public.has_department_access(dl.department_id)
    )
  );

DROP POLICY IF EXISTS "machine_hours_insert_department" ON machine_hours;
CREATE POLICY "machine_hours_insert_access"
  ON machine_hours FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      WHERE dl.id = machine_hours.daily_log_id
      AND public.has_department_access(dl.department_id)
    )
  );

-- Fuel Logs
DROP POLICY IF EXISTS "fuel_logs_select_department" ON fuel_logs;
CREATE POLICY "fuel_logs_select_access"
  ON fuel_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      WHERE dl.id = fuel_logs.daily_log_id
      AND public.has_department_access(dl.department_id)
    )
  );

DROP POLICY IF EXISTS "fuel_logs_insert_department" ON fuel_logs;
CREATE POLICY "fuel_logs_insert_access"
  ON fuel_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      WHERE dl.id = fuel_logs.daily_log_id
      AND public.has_department_access(dl.department_id)
    )
  );

-- Production Logs
DROP POLICY IF EXISTS "production_logs_select_department" ON production_logs;
CREATE POLICY "production_logs_select_access"
  ON production_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      WHERE dl.id = production_logs.daily_log_id
      AND public.has_department_access(dl.department_id)
    )
  );

DROP POLICY IF EXISTS "production_logs_insert_department" ON production_logs;
CREATE POLICY "production_logs_insert_access"
  ON production_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      WHERE dl.id = production_logs.daily_log_id
      AND public.has_department_access(dl.department_id)
    )
  );

-- Operators
DROP POLICY IF EXISTS "operators_select_all" ON operators;
CREATE POLICY "operators_select_active"
  ON operators FOR SELECT
  TO authenticated
  USING (public.is_active(deleted_at) AND active = true);

-- Sites
DROP POLICY IF EXISTS "sites_select_all" ON sites;
CREATE POLICY "sites_select_active"
  ON sites FOR SELECT
  TO authenticated
  USING (public.is_active(deleted_at) AND active = true);

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

-- Audit Logs
DROP POLICY IF EXISTS "audit_logs_select_department" ON audit_logs;
CREATE POLICY "audit_logs_select_access"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.has_department_access(department_id)
  );

-- Access Logs
DROP POLICY IF EXISTS "access_logs_select_department" ON access_logs;
CREATE POLICY "access_logs_select_access"
  ON access_logs FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- Badges
DROP POLICY IF EXISTS "badges_select_all" ON badges;
CREATE POLICY "badges_select_access"
  ON badges FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.has_department_access(department_id));

-- Shift Coverage
DROP POLICY IF EXISTS "shift_coverage_select_department" ON shift_coverage;
CREATE POLICY "shift_coverage_select_access"
  ON shift_coverage FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- ============================================
-- Grant necessary permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_department() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_department_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_site_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active(TIMESTAMPTZ) TO authenticated;

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE excavator_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE dozer_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_coverage ENABLE ROW LEVEL SECURITY;