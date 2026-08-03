-- ============================================
-- Control Room Revisions - 12-Hour Grid, Bin Factor, Split Notes
-- ============================================

-- ============================================
-- 1. Modify machines table - Add bin_factor for dumpers
-- ============================================
ALTER TABLE machines ADD COLUMN IF NOT EXISTS bin_factor NUMERIC;

-- ============================================
-- 2. Drop and recreate hourly_loads with 12-hour shift structure
-- ============================================
DROP TABLE IF EXISTS hourly_loads;

CREATE TABLE IF NOT EXISTS hourly_loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  load_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  -- 12 hours per shift
  -- Day shift: 06:00, 07:00, 08:00, 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00
  -- Night shift: 18:00, 19:00, 20:00, 21:00, 22:00, 23:00, 00:00, 01:00, 02:00, 03:00, 04:00, 05:00
  hour_01 INTEGER NOT NULL DEFAULT 0,  -- Day: 06-07, Night: 18-19
  hour_02 INTEGER NOT NULL DEFAULT 0,  -- Day: 07-08, Night: 19-20
  hour_03 INTEGER NOT NULL DEFAULT 0,  -- Day: 08-09, Night: 20-21
  hour_04 INTEGER NOT NULL DEFAULT 0,  -- Day: 09-10, Night: 21-22
  hour_05 INTEGER NOT NULL DEFAULT 0,  -- Day: 10-11, Night: 22-23
  hour_06 INTEGER NOT NULL DEFAULT 0,  -- Day: 11-12, Night: 23-00
  hour_07 INTEGER NOT NULL DEFAULT 0,  -- Day: 12-13, Night: 00-01
  hour_08 INTEGER NOT NULL DEFAULT 0,  -- Day: 13-14, Night: 01-02
  hour_09 INTEGER NOT NULL DEFAULT 0,  -- Day: 14-15, Night: 02-03
  hour_10 INTEGER NOT NULL DEFAULT 0,  -- Day: 15-16, Night: 03-04
  hour_11 INTEGER NOT NULL DEFAULT 0,  -- Day: 16-17, Night: 04-05
  hour_12 INTEGER NOT NULL DEFAULT 0,  -- Day: 17-18, Night: 05-06
  total_loads INTEGER GENERATED ALWAYS AS (
    hour_01 + hour_02 + hour_03 + hour_04 + hour_05 + hour_06 +
    hour_07 + hour_08 + hour_09 + hour_10 + hour_11 + hour_12
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (machine_id, load_date, shift_type)
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
-- 3. Create engineering_notes table
-- ============================================
CREATE TABLE IF NOT EXISTS engineering_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  issue_type TEXT NOT NULL CHECK (issue_type IN ('mechanical', 'electrical', 'structural', 'hydraulic', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  action_taken TEXT,
  requires_follow_up BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE engineering_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engineering_notes_select_department"
  ON engineering_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = engineering_notes.department_id
          OR engineering_notes.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "engineering_notes_insert_department"
  ON engineering_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = engineering_notes.department_id
          OR engineering_notes.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "engineering_notes_update_department"
  ON engineering_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = engineering_notes.department_id
          OR engineering_notes.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- 4. Create operational_delays table
-- ============================================
CREATE TABLE IF NOT EXISTS operational_delays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  delay_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  delay_category_id UUID REFERENCES delay_categories(id) ON DELETE SET NULL,
  delay_type TEXT NOT NULL CHECK (delay_type IN ('equipment', 'weather', 'safety', 'material', 'shift_change', 'operator', 'other')),
  affected_machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  delay_minutes INTEGER NOT NULL CHECK (delay_minutes > 0),
  description TEXT NOT NULL,
  impact_description TEXT,
  recovery_action TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recovered', 'extended')),
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE operational_delays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operational_delays_select_department"
  ON operational_delays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = operational_delays.department_id
          OR operational_delays.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "operational_delays_insert_department"
  ON operational_delays FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = operational_delays.department_id
          OR operational_delays.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "operational_delays_update_department"
  ON operational_delays FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = operational_delays.department_id
          OR operational_delays.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- 5. Drop old shift_notes table
-- ============================================
DROP TABLE IF EXISTS shift_notes;

-- ============================================
-- 6. Update triggers for new tables
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for hourly_loads
DROP TRIGGER IF EXISTS update_hourly_loads_updated_at ON hourly_loads;
CREATE TRIGGER update_hourly_loads_updated_at
  BEFORE UPDATE ON hourly_loads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for engineering_notes
CREATE TRIGGER update_engineering_notes_updated_at
  BEFORE UPDATE ON engineering_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for operational_delays
CREATE TRIGGER update_operational_delays_updated_at
  BEFORE UPDATE ON operational_delays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Seed additional delay categories
-- ============================================
INSERT INTO delay_categories (name, color, icon, sort_order) VALUES
  ('Operator Unavailable', '#007aff', 'UserX', 7),
  ('Material Shortage', '#6366f1', 'Package', 8)
ON CONFLICT DO NOTHING;
