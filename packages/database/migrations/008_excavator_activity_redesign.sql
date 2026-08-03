-- ============================================
-- Excavator Activity Redesign - Dumper Assignments, Mine Blocks, Site Mapping
-- ============================================

-- ============================================
-- 1. Add site_id to machines (allows assigning dumpers to sites)
-- ============================================
ALTER TABLE machines ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_machines_site ON machines(site_id);

-- ============================================
-- 2. Create mine_blocks reference table
-- ============================================
CREATE TABLE IF NOT EXISTS mine_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mine_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mine_blocks_select_all"
  ON mine_blocks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "mine_blocks_insert_admin_supervisor"
  ON mine_blocks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

CREATE POLICY "mine_blocks_update_admin_supervisor"
  ON mine_blocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'supervisor')
    )
  );

-- ============================================
-- 3. Add columns to excavator_activity
-- ============================================
ALTER TABLE excavator_activity ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;
ALTER TABLE excavator_activity ADD COLUMN IF NOT EXISTS block_mined_id UUID REFERENCES mine_blocks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_excavator_activity_site ON excavator_activity(site_id);

-- ============================================
-- 4. Create excavator_dumper_assignments child table
-- ============================================
CREATE TABLE IF NOT EXISTS excavator_dumper_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  excavator_activity_id UUID NOT NULL REFERENCES excavator_activity(id) ON DELETE CASCADE,
  dumper_machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL DEFAULT 'Unspecified',
  total_loads INTEGER NOT NULL DEFAULT 0,
  total_bcm NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (excavator_activity_id, dumper_machine_id, material_type)
);

ALTER TABLE excavator_dumper_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "excavator_dumper_assignments_select_department"
  ON excavator_dumper_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM excavator_activity ea
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE ea.id = excavator_dumper_assignments.excavator_activity_id
        AND (
          e.role = 'admin'
          OR e.department_id = ea.department_id
          OR ea.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "excavator_dumper_assignments_insert_department"
  ON excavator_dumper_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM excavator_activity ea
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE ea.id = excavator_dumper_assignments.excavator_activity_id
        AND (
          e.role = 'admin'
          OR e.department_id = ea.department_id
          OR ea.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "excavator_dumper_assignments_update_department"
  ON excavator_dumper_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM excavator_activity ea
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE ea.id = excavator_dumper_assignments.excavator_activity_id
        AND (
          e.role = 'admin'
          OR e.department_id = ea.department_id
          OR ea.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "excavator_dumper_assignments_delete_department"
  ON excavator_dumper_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM excavator_activity ea
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE ea.id = excavator_dumper_assignments.excavator_activity_id
        AND (
          e.role = 'admin'
          OR e.department_id = ea.department_id
          OR ea.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- 5. Trigger for updated_at
-- ============================================
CREATE TRIGGER update_excavator_dumper_assignments_updated_at
  BEFORE UPDATE ON excavator_dumper_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Seed mine blocks
-- ============================================
INSERT INTO mine_blocks (name, code, site_id, active) VALUES
  ('Block A North', 'BLK-A-N', (SELECT id FROM sites WHERE site_code = 'PIT-01'), true),
  ('Block A South', 'BLK-A-S', (SELECT id FROM sites WHERE site_code = 'PIT-01'), true),
  ('Block B East', 'BLK-B-E', (SELECT id FROM sites WHERE site_code = 'PIT-02'), true),
  ('Block B West', 'BLK-B-W', (SELECT id FROM sites WHERE site_code = 'PIT-02'), true),
  ('Stockpile Area', 'STOCK-A', (SELECT id FROM sites WHERE site_code = 'STOCK-A'), true),
  ('Wash Plant Area', 'WASH-A', (SELECT id FROM sites WHERE site_code = 'WASH-01'), true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 7. Assign dump trucks to sites and set bin_factor
-- ============================================
DO $$
BEGIN
  UPDATE machines SET site_id = (SELECT id FROM sites WHERE site_code = 'PIT-01'), bin_factor = 40.5
    WHERE name = 'DT-101' AND machine_type = 'Dump Truck';
  UPDATE machines SET site_id = (SELECT id FROM sites WHERE site_code = 'PIT-01'), bin_factor = 40.5
    WHERE name = 'DT-102' AND machine_type = 'Dump Truck';
END $$;