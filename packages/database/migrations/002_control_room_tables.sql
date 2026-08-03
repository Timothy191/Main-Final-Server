-- ============================================
-- Control Room Department - Reference Tables
-- ============================================

-- Operators reference table (for dropdowns)
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  employee_code TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'operator',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operators_select_all"
  ON operators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "operators_insert_admin_supervisor"
  ON operators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

CREATE POLICY "operators_update_admin_supervisor"
  ON operators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

-- Sites/Locations reference table (for dropdowns)
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  site_code TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sites_select_all"
  ON sites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sites_insert_admin_supervisor"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

CREATE POLICY "sites_update_admin_supervisor"
  ON sites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

-- ============================================
-- Machine Operations (Hours, Operator, Site)
-- ============================================
CREATE TABLE IF NOT EXISTS machine_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES operators(id),
  site_id UUID REFERENCES sites(id),
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  start_time TIME NOT NULL,
  end_time TIME,
  hours_worked NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0
      ELSE NULL
    END
  ) STORED,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (machine_id, shift_date, shift_type, start_time)
);

ALTER TABLE machine_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "machine_operations_select_department"
  ON machine_operations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = machine_operations.department_id
          OR machine_operations.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "machine_operations_insert_department"
  ON machine_operations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = machine_operations.department_id
          OR machine_operations.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "machine_operations_update_creator_or_supervisor"
  ON machine_operations FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

-- ============================================
-- Hourly Loads Sheet
-- ============================================
CREATE TABLE IF NOT EXISTS hourly_loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  load_date DATE NOT NULL,
  hour_00 INTEGER NOT NULL DEFAULT 0,
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
  hour_13 INTEGER NOT NULL DEFAULT 0,
  hour_14 INTEGER NOT NULL DEFAULT 0,
  hour_15 INTEGER NOT NULL DEFAULT 0,
  hour_16 INTEGER NOT NULL DEFAULT 0,
  hour_17 INTEGER NOT NULL DEFAULT 0,
  hour_18 INTEGER NOT NULL DEFAULT 0,
  hour_19 INTEGER NOT NULL DEFAULT 0,
  hour_20 INTEGER NOT NULL DEFAULT 0,
  hour_21 INTEGER NOT NULL DEFAULT 0,
  hour_22 INTEGER NOT NULL DEFAULT 0,
  hour_23 INTEGER NOT NULL DEFAULT 0,
  total_loads INTEGER GENERATED ALWAYS AS (
    hour_00 + hour_01 + hour_02 + hour_03 + hour_04 + hour_05 +
    hour_06 + hour_07 + hour_08 + hour_09 + hour_10 + hour_11 +
    hour_12 + hour_13 + hour_14 + hour_15 + hour_16 + hour_17 +
    hour_18 + hour_19 + hour_20 + hour_21 + hour_22 + hour_23
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (machine_id, load_date)
);

ALTER TABLE hourly_loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hourly_loads_select_department"
  ON hourly_loads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = hourly_loads.department_id
          OR hourly_loads.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "hourly_loads_insert_department"
  ON hourly_loads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = hourly_loads.department_id
          OR hourly_loads.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "hourly_loads_update_department"
  ON hourly_loads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = hourly_loads.department_id
          OR hourly_loads.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- Notes/Delays - Categories
-- ============================================
CREATE TABLE IF NOT EXISTS delay_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#898989',
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE delay_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delay_categories_select_all"
  ON delay_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "delay_categories_insert_admin"
  ON delay_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

-- ============================================
-- Shift Notes / Delays
-- ============================================
CREATE TABLE IF NOT EXISTS shift_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  category_id UUID REFERENCES delay_categories(id),
  is_delay BOOLEAN NOT NULL DEFAULT false,
  delay_minutes INTEGER,
  note_text TEXT NOT NULL,
  requires_supervisor_review BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shift_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shift_notes_select_department"
  ON shift_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = shift_notes.department_id
          OR shift_notes.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "shift_notes_insert_department"
  ON shift_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = shift_notes.department_id
          OR shift_notes.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "shift_notes_update_creator_or_supervisor"
  ON shift_notes FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

-- ============================================
-- Excavator Activity (Passes, Loads, Cycles)
-- ============================================
CREATE TABLE IF NOT EXISTS excavator_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES operators(id),
  activity_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  passes INTEGER NOT NULL DEFAULT 0,
  loads INTEGER NOT NULL DEFAULT 0,
  avg_cycle_time_seconds INTEGER,
  material_type TEXT,
  estimated_tonnes NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (machine_id, activity_date, shift_type)
);

ALTER TABLE excavator_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "excavator_activity_select_department"
  ON excavator_activity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = excavator_activity.department_id
          OR excavator_activity.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "excavator_activity_insert_department"
  ON excavator_activity FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = excavator_activity.department_id
          OR excavator_activity.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "excavator_activity_update_department"
  ON excavator_activity FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = excavator_activity.department_id
          OR excavator_activity.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- Roll Over / Dozer Activity
-- ============================================
CREATE TABLE IF NOT EXISTS dozer_rolls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES operators(id),
  roll_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  blade_passes INTEGER NOT NULL DEFAULT 0,
  push_count INTEGER NOT NULL DEFAULT 0,
  area_covered_sqm NUMERIC,
  material_moved_tonnes NUMERIC,
  hours_operated NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (machine_id, roll_date, shift_type)
);

ALTER TABLE dozer_rolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dozer_rolls_select_department"
  ON dozer_rolls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = dozer_rolls.department_id
          OR dozer_rolls.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "dozer_rolls_insert_department"
  ON dozer_rolls FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = dozer_rolls.department_id
          OR dozer_rolls.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "dozer_rolls_update_department"
  ON dozer_rolls FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = dozer_rolls.department_id
          OR dozer_rolls.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- Report System
-- ============================================
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL,
  auto_generate BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_templates_select_all"
  ON report_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "report_templates_insert_admin"
  ON report_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES report_templates(id),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  shift_type TEXT,
  report_data JSONB,
  pdf_url TEXT,
  generated_by UUID REFERENCES employees(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_reports_select_department"
  ON generated_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = generated_reports.department_id
          OR generated_reports.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- Seed Data: Delay Categories
-- ============================================
INSERT INTO delay_categories (name, color, icon, sort_order) VALUES
  ('Equipment Breakdown', '#ef4444', 'Wrench', 1),
  ('Weather', '#3b82f6', 'CloudRain', 2),
  ('Safety Incident', '#007aff', 'ShieldAlert', 3),
  ('Maintenance', '#8b5cf6', 'Settings', 4),
  ('Material Shortage', '#6366f1', 'PackageX', 5),
  ('Shift Change', '#10b981', 'Users', 6),
  ('Other', '#6b7280', 'FileText', 99)
ON CONFLICT DO NOTHING;

-- ============================================
-- Update Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_machine_operations_updated_at
  BEFORE UPDATE ON machine_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hourly_loads_updated_at
  BEFORE UPDATE ON hourly_loads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_excavator_activity_updated_at
  BEFORE UPDATE ON excavator_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dozer_rolls_updated_at
  BEFORE UPDATE ON dozer_rolls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
