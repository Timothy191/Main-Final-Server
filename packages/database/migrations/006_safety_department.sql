-- ============================================
-- Safety Department Tables
-- ============================================

-- Safety incident severity levels
CREATE TABLE IF NOT EXISTS safety_severities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL UNIQUE,
  weight INTEGER NOT NULL DEFAULT 1,
  color TEXT NOT NULL DEFAULT '#ef4444',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE safety_severities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "safety_severities_select_all"
  ON safety_severities FOR SELECT
  TO authenticated
  USING (true);

-- Safety incident categories
CREATE TABLE IF NOT EXISTS safety_incident_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#898989',
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE safety_incident_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "safety_incident_categories_select_all"
  ON safety_incident_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "safety_incident_categories_insert_admin"
  ON safety_incident_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

-- ============================================
-- Safety Incidents
-- ============================================
CREATE TABLE IF NOT EXISTS safety_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  category_id UUID REFERENCES safety_incident_categories(id),
  severity_id UUID REFERENCES safety_severities(id),
  incident_type TEXT NOT NULL CHECK (incident_type IN ('near-miss', 'incident', 'lost-time', 'equipment-damage')),
  description TEXT NOT NULL,
  location TEXT,
  injured_parties INTEGER NOT NULL DEFAULT 0,
  reported_by UUID REFERENCES employees(id),
  reviewed_by UUID REFERENCES employees(id),
  root_cause TEXT,
  corrective_action TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under-investigation', 'resolved', 'closed')),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;

-- SELECT: department-scoped + admin
CREATE POLICY "safety_incidents_select_department"
  ON safety_incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = safety_incidents.department_id
          OR safety_incidents.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- INSERT: department users + admin
CREATE POLICY "safety_incidents_insert_department"
  ON safety_incidents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = safety_incidents.department_id
          OR safety_incidents.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- UPDATE: creator, supervisor, or admin
CREATE POLICY "safety_incidents_update_creator_or_supervisor"
  ON safety_incidents FOR UPDATE
  TO authenticated
  USING (
    reported_by = (SELECT id FROM employees WHERE auth_id = auth.uid() LIMIT 1)
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

-- Seed safety category data
INSERT INTO safety_severities (level, weight, color, sort_order) VALUES
  ('low', 1, '#3ecf8e', 1),
  ('medium', 2, '#007aff', 2),
  ('high', 3, '#ef4444', 3),
  ('critical', 4, '#dc2626', 4)
ON CONFLICT (level) DO UPDATE SET
  weight = EXCLUDED.weight,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

INSERT INTO safety_incident_categories (name, description, color, icon, sort_order) VALUES
  ('Slip, Trip, or Fall', 'Worker slip, trip, or fall events', '#007aff', 'AlertTriangle', 1),
  ('Equipment Contact', 'Contact with machinery or equipment', '#ef4444', 'Wrench', 2),
  ('Vehicle Incident', 'Vehicle-related safety events', '#007aff', 'Truck', 3),
  ('Hazardous Material', 'Chemical or material exposure', '#8b5cf6', 'FlaskConical', 4),
  ('Environmental', 'Environmental-related safety issues', '#10b981', 'TreePine', 5),
  ('Near Miss', 'Close-call event with no injury', '#3b82f6', 'Eye', 6),
  ('Other', 'Other safety incidents', '#898989', 'FileText', 99)
  ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;
