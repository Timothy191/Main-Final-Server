-- Migration 044: Access Control Dashboard Schema Updates
-- Adds department_id and entity foreign keys to badges for dashboard queries

-- ============================================
-- 1. Add department_id to badges for fast department-scoped queries
-- ============================================
ALTER TABLE badges
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);

-- Backfill department_id from related personnel records
UPDATE badges b
SET department_id = p.department_id
FROM personnel p
WHERE b.personnel_id = p.id
  AND b.department_id IS NULL;

-- Backfill department_id from related visitor host personnel
UPDATE badges b
SET department_id = p.department_id
FROM visitors v
JOIN personnel p ON v.host_id = p.id
WHERE b.visitor_id = v.id
  AND b.department_id IS NULL;

-- ============================================
-- 2. Add fleet_id and equipment_id for complete entity coverage
-- ============================================
ALTER TABLE badges
  ADD COLUMN IF NOT EXISTS fleet_id uuid REFERENCES fleet(id);

ALTER TABLE badges
  ADD COLUMN IF NOT EXISTS equipment_id uuid REFERENCES equipment(id);

-- ============================================
-- 3. Indexes for dashboard performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_badges_department_id ON badges(department_id);
CREATE INDEX IF NOT EXISTS idx_badges_is_active ON badges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_badges_expires_at ON badges(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_badges_fleet_id ON badges(fleet_id);
CREATE INDEX IF NOT EXISTS idx_badges_equipment_id ON badges(equipment_id);

-- ============================================
-- 4. Update RLS policies to include department-based access
-- ============================================
-- Drop old restrictive policies and create department-aware ones
DROP POLICY IF EXISTS "Allow access control read badges" ON badges;

CREATE POLICY "Allow access control read badges" ON badges
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'access_control' OR e.department_id = badges.department_id)
    )
  );

-- ============================================
-- 5. Comments
-- ============================================
COMMENT ON COLUMN badges.department_id IS 'Denormalized department for fast dashboard queries. Derived from personnel or visitor host.';
COMMENT ON COLUMN badges.fleet_id IS 'Links badge to fleet vehicle when entity_type = vehicle';
COMMENT ON COLUMN badges.equipment_id IS 'Links badge to equipment asset';
