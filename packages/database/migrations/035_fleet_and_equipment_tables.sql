-- Migration 035: Fleet and Equipment tables for access-control

-- ============================================
-- 1. Fleet table (mining vehicles/heavy machinery)
-- ============================================
CREATE TABLE fleet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_code text UNIQUE NOT NULL,
  vehicle_type text NOT NULL,
  registration_number text,
  make text,
  model text,
  year integer,
  department_id uuid REFERENCES departments(id),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'In Service', 'Decommissioned')),
  last_service_date date,
  next_service_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. Equipment table (non-vehicle portable/fixed assets)
-- ============================================
CREATE TABLE equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equip_code text UNIQUE NOT NULL,
  equipment_type text NOT NULL,
  serial_number text,
  manufacturer text,
  model text,
  department_id uuid REFERENCES departments(id),
  assigned_to uuid REFERENCES personnel(id),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'In Calibration', 'Decommissioned')),
  calibration_expiry date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. FK constraints from badges
-- ============================================
ALTER TABLE badges ADD CONSTRAINT badges_fleet_id_fkey
  FOREIGN KEY (fleet_id) REFERENCES fleet(id);

ALTER TABLE badges ADD CONSTRAINT badges_equipment_id_fkey
  FOREIGN KEY (equipment_id) REFERENCES equipment(id);

-- ============================================
-- 4. Indexes
-- ============================================
CREATE INDEX idx_fleet_code ON fleet(fleet_code);
CREATE INDEX idx_fleet_department ON fleet(department_id);
CREATE INDEX idx_equipment_code ON equipment(equip_code);
CREATE INDEX idx_equipment_department ON equipment(department_id);
CREATE INDEX idx_equipment_assigned_to ON equipment(assigned_to);

-- ============================================
-- 5. RLS
-- ============================================
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Fleet RLS
CREATE POLICY "Allow access control read fleet" ON fleet
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'access_control' OR e.department_id = fleet.department_id)
    )
  );

CREATE POLICY "Allow access control insert fleet" ON fleet
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

CREATE POLICY "Allow access control update fleet" ON fleet
  FOR UPDATE TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

CREATE POLICY "Allow access control delete fleet" ON fleet
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

-- Equipment RLS
CREATE POLICY "Allow access control read equipment" ON equipment
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'access_control' OR e.department_id = equipment.department_id)
    )
  );

CREATE POLICY "Allow access control insert equipment" ON equipment
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

CREATE POLICY "Allow access control update equipment" ON equipment
  FOR UPDATE TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

CREATE POLICY "Allow access control delete equipment" ON equipment
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );