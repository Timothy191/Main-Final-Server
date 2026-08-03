-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Departments
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select_all"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Employees (linked to auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator',
  accessible_departments UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_select_self_or_admin"
  ON employees FOR SELECT
  TO authenticated
  USING (
    auth_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

CREATE POLICY "employees_update_self_or_admin"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    auth_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

CREATE POLICY "employees_insert_admin_only"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

-- ============================================
-- Machines
-- ============================================
CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  serial_number TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "machines_select_department"
  ON machines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = machines.department_id
          OR machines.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "machines_insert_admin_supervisor"
  ON machines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

CREATE POLICY "machines_update_admin_supervisor"
  ON machines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

-- ============================================
-- Daily Logs
-- ============================================
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('day', 'night')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (department_id, log_date, shift)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_logs_select_department"
  ON daily_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = daily_logs.department_id
          OR daily_logs.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "daily_logs_insert_department"
  ON daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = daily_logs.department_id
          OR daily_logs.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- No DELETE policy — append-only

-- ============================================
-- Machine Hours (child of daily_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS machine_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE machine_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "machine_hours_select_department"
  ON machine_hours FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE dl.id = machine_hours.daily_log_id
        AND (
          e.role = 'admin'
          OR e.department_id = dl.department_id
          OR dl.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "machine_hours_insert_department"
  ON machine_hours FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE dl.id = machine_hours.daily_log_id
        AND (
          e.role = 'admin'
          OR e.department_id = dl.department_id
          OR dl.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- Fuel Logs (child of daily_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  diesel_litres NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fuel_logs_select_department"
  ON fuel_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE dl.id = fuel_logs.daily_log_id
        AND (
          e.role = 'admin'
          OR e.department_id = dl.department_id
          OR dl.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "fuel_logs_insert_department"
  ON fuel_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE dl.id = fuel_logs.daily_log_id
        AND (
          e.role = 'admin'
          OR e.department_id = dl.department_id
          OR dl.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- Production Logs (child of daily_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS production_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  coal_tonnes NUMERIC NOT NULL DEFAULT 0,
  waste_tonnes NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_logs_select_department"
  ON production_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE dl.id = production_logs.daily_log_id
        AND (
          e.role = 'admin'
          OR e.department_id = dl.department_id
          OR dl.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "production_logs_insert_department"
  ON production_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE dl.id = production_logs.daily_log_id
        AND (
          e.role = 'admin'
          OR e.department_id = dl.department_id
          OR dl.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- Helper Functions
-- ============================================
CREATE OR REPLACE FUNCTION public.user_department_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM employees WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_department_access(dept_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE auth_id = auth.uid()
      AND (
        role = 'admin'
        OR department_id = dept_id
        OR dept_id = ANY(accessible_departments)
      )
  );
$$;

-- ============================================
-- Auth Trigger: auto-create employee on signup
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
