-- Migration 057: Security Fixes for P0 Vulnerabilities
--
-- 1. Redefine handle_new_user() trigger to ignore user-supplied metadata role.
-- 2. Enforce column-level constraints on public.employees so non-admins cannot self-elevate.
-- 3. Harden the employees_update_self_or_admin RLS update policy with a WITH CHECK clause.

-- ============================================
-- 1. Redefine handle_new_user() trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.employees (auth_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'operator' -- Hardcode default to prevent raw_user_meta_data.role elevation
  );
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. Create trigger function to enforce employee update constraints
-- ============================================
CREATE OR REPLACE FUNCTION public.enforce_employee_update_constraints()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the updater is not a system administrator, prevent changing key identity and access columns
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.department_id := OLD.department_id;
    NEW.accessible_departments := OLD.accessible_departments;
    NEW.auth_id := OLD.auth_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_employee_update_constraints_trigger ON public.employees;
CREATE TRIGGER enforce_employee_update_constraints_trigger
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_employee_update_constraints();

-- ============================================
-- 3. Harden employees update RLS policy
-- ============================================
DROP POLICY IF EXISTS "employees_update_self_or_admin" ON public.employees;
CREATE POLICY "employees_update_self_or_admin" ON public.employees
  FOR UPDATE TO authenticated
  USING ( auth_id = auth.uid() OR public.is_admin() )
  WITH CHECK ( auth_id = auth.uid() OR public.is_admin() );
