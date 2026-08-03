-- Migration 034: Access Control schema updates
-- 1. Restructure visitors table: split name into first_name/surname, add id_number, visiting, reason_for_entry, department_id
-- 2. Expand badges entity_type CHECK to include fleet and equipment
-- 3. Add department_id, fleet_id, equipment_id columns to badges
-- 4. RLS INSERT/UPDATE/DELETE policies for badges, visitors, personnel

-- ============================================
-- 1. Visitors table restructure
-- ============================================

ALTER TABLE visitors ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS surname text;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS visiting text;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS reason_for_entry text;
ALTER TABLE visitors ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);

-- Migrate existing data
UPDATE visitors SET
  first_name = split_part(name, ' ', 1),
  surname = CASE
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END,
  reason_for_entry = COALESCE(purpose, 'Site Visit'),
  visiting = host_id::text
WHERE first_name IS NULL;

-- Make new columns NOT NULL (id_number stays nullable — visitors may not always have one)
ALTER TABLE visitors ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE visitors ALTER COLUMN surname SET NOT NULL;
ALTER TABLE visitors ALTER COLUMN reason_for_entry SET NOT NULL;

-- Drop old columns
ALTER TABLE visitors DROP COLUMN IF EXISTS name;
ALTER TABLE visitors DROP COLUMN IF EXISTS purpose;

-- Unique on id_number where present
CREATE UNIQUE INDEX IF NOT EXISTS visitors_id_number_key ON visitors(id_number) WHERE id_number IS NOT NULL;

-- Index for department-based queries
CREATE INDEX IF NOT EXISTS idx_visitors_department ON visitors(department_id);

-- ============================================
-- 2. Badges table expansion
-- ============================================

-- Expand entity_type CHECK constraint
ALTER TABLE badges DROP CONSTRAINT IF EXISTS badges_entity_type_check;
ALTER TABLE badges ADD CONSTRAINT badges_entity_type_check
  CHECK (entity_type IN ('personnel', 'visitor', 'vehicle', 'fleet', 'equipment'));

-- Add new columns
ALTER TABLE badges ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);
ALTER TABLE badges ADD COLUMN IF NOT EXISTS fleet_id uuid;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS equipment_id uuid;

-- Backfill department_id from linked entities
UPDATE badges SET department_id = p.department_id
FROM personnel p
WHERE badges.personnel_id = p.id AND badges.department_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_badges_department ON badges(department_id);
CREATE INDEX IF NOT EXISTS idx_badges_fleet_id ON badges(fleet_id);
CREATE INDEX IF NOT EXISTS idx_badges_equipment_id ON badges(equipment_id);

-- ============================================
-- 3. RLS policies — INSERT/UPDATE/DELETE
-- ============================================

-- Visitors: INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Allow access control insert visitors" ON visitors;
CREATE POLICY "Allow access control insert visitors" ON visitors
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

DROP POLICY IF EXISTS "Allow access control update visitors" ON visitors;
CREATE POLICY "Allow access control update visitors" ON visitors
  FOR UPDATE TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

DROP POLICY IF EXISTS "Allow access control delete visitors" ON visitors;
CREATE POLICY "Allow access control delete visitors" ON visitors
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

-- Badges: INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Allow access control insert badges" ON badges;
CREATE POLICY "Allow access control insert badges" ON badges
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

DROP POLICY IF EXISTS "Allow access control update badges" ON badges;
CREATE POLICY "Allow access control update badges" ON badges
  FOR UPDATE TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

DROP POLICY IF EXISTS "Allow access control delete badges" ON badges;
CREATE POLICY "Allow access control delete badges" ON badges
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

-- Department members can read badges
DROP POLICY IF EXISTS "Allow department members read badges" ON badges;
CREATE POLICY "Allow department members read badges" ON badges
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'access_control' OR e.department_id = badges.department_id)
    )
  );

-- Personnel: INSERT/UPDATE
DROP POLICY IF EXISTS "Allow access control insert personnel" ON personnel;
CREATE POLICY "Allow access control insert personnel" ON personnel
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );

DROP POLICY IF EXISTS "Allow access control update personnel" ON personnel;
CREATE POLICY "Allow access control update personnel" ON personnel
  FOR UPDATE TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
  );