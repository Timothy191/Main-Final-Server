-- ============================================
-- Migration 080: Admin reference-data management & machine onboarding
-- ============================================================
-- 1. machines: add machine_category (drives bin_factor prompt), keep
--    bin_factor (already exists) + current_smr (already exists from 077).
-- 2. machine_operations: add the three standard 1-hour downtime buckets
--    (lunch, safety talk, GET/diesel refill) that apply to every machine
--    and default to 1 hour until an operator changes them.
-- 3. Seed reference data owned by the Admin department: operators, sites,
--    delay_categories — managed from the Admin dashboard only.
-- ============================================================

-- 1. machines.machine_category -------------------------------------------------
ALTER TABLE machines ADD COLUMN IF NOT EXISTS machine_category TEXT;

-- Backfill existing dumper-style machines so the new CHECK is safe.
UPDATE machines SET machine_category = 'rigid_dumper' WHERE machine_category IS NULL AND machine_type ILIKE '%dumper%';
UPDATE machines SET machine_category = 'excavator' WHERE machine_category IS NULL AND machine_type ILIKE '%excavator%';
UPDATE machines SET machine_category = 'dozer' WHERE machine_category IS NULL AND machine_type ILIKE '%dozer%';
UPDATE machines SET machine_category = 'haul_truck' WHERE machine_category IS NULL AND machine_type ILIKE '%haul truck%';
UPDATE machines SET machine_category = 'other' WHERE machine_category IS NULL;

ALTER TABLE machines
  DROP CONSTRAINT IF EXISTS machines_machine_category_check;

ALTER TABLE machines
  ADD CONSTRAINT machines_machine_category_check
  CHECK (machine_category IN (
    'excavator',
    'articulated_dumper',
    'rigid_dumper',
    'haul_truck',
    'dozer',
    'water_cart',
    'grader',
    'other'
  ));

COMMENT ON COLUMN machines.machine_category IS
  'Equipment class. Dumpers (articulated/rigid) require a bin_factor for tonnage math.';

-- 2. machine_operations standard downtime buckets -----------------------------
ALTER TABLE machine_operations
  ADD COLUMN IF NOT EXISTS lunch_delay_minutes INTEGER NOT NULL DEFAULT 1
    CHECK (lunch_delay_minutes >= 0),
  ADD COLUMN IF NOT EXISTS safety_talk_delay_minutes INTEGER NOT NULL DEFAULT 1
    CHECK (safety_talk_delay_minutes >= 0),
  ADD COLUMN IF NOT EXISTS get_diesel_delay_minutes INTEGER NOT NULL DEFAULT 1
    CHECK (get_diesel_delay_minutes >= 0);

COMMENT ON COLUMN machine_operations.lunch_delay_minutes IS
  'Standard 1h lunch downtime, applied to every machine until changed.';
COMMENT ON COLUMN machine_operations.safety_talk_delay_minutes IS
  'Standard 1h safety-talk downtime, applied to every machine until changed.';
COMMENT ON COLUMN machine_operations.get_diesel_delay_minutes IS
  'Standard 1h GET / diesel-refill downtime, applied to every machine until changed.';

-- Mirror the new buckets onto the archive table for parity.
ALTER TABLE machine_operations_archive
  ADD COLUMN IF NOT EXISTS lunch_delay_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS safety_talk_delay_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS get_diesel_delay_minutes INTEGER;

-- Unique constraint backing the Control Room -> Engineering engineering-delay
-- mirror upsert (one mirrored note per machine/shift/day).
ALTER TABLE engineering_notes
  DROP CONSTRAINT IF EXISTS uq_engineering_notes_dept_machine_date_shift;
CREATE UNIQUE INDEX IF NOT EXISTS uq_engineering_notes_dept_machine_date_shift
  ON engineering_notes (department_id, machine_id, note_date, shift_type);

-- 3. Admin-owned reference data seeds -----------------------------------------
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM departments WHERE name = 'admin';

  -- Operators (managed only from Admin department)
  INSERT INTO operators (full_name, employee_code, role, active)
  SELECT v.full_name, v.employee_code, v.role, true
  FROM (VALUES
    ('Control Room Operator A', 'OP-CR-001', 'operator'),
    ('Control Room Operator B', 'OP-CR-002', 'operator'),
    ('Dispatch Lead', 'OP-CR-003', 'supervisor')
  ) AS v(full_name, employee_code, role)
  WHERE admin_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM operators o WHERE o.employee_code = v.employee_code);

  -- Sites (managed only from Admin department)
  INSERT INTO sites (name, site_code, active)
  SELECT v.name, v.site_code, true
  FROM (VALUES
    ('Pit Alpha', 'PIT-ALPHA'),
    ('Pit Bravo', 'PIT-BRAVO'),
    ('Central Dump', 'CENTRAL-DUMP'),
    ('Workshop', 'WORKSHOP')
  ) AS v(name, site_code)
  WHERE admin_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM sites s WHERE s.site_code = v.site_code);

  -- Delay categories (managed only from Admin department)
  INSERT INTO delay_categories (name, color, icon, sort_order)
  SELECT v.name, v.color, v.icon, v.sort_order
  FROM (VALUES
    ('Equipment Breakdown', '#ef4444', 'Wrench', 1),
    ('Weather', '#3b82f6', 'CloudRain', 2),
    ('Safety Incident', '#007aff', 'ShieldAlert', 3),
    ('Maintenance', '#8b5cf6', 'Settings', 4),
    ('Material Shortage', '#6366f1', 'PackageX', 5),
    ('Shift Change', '#10b981', 'Users', 6),
    ('Lunch', '#f59e0b', 'Utensils', 7),
    ('Safety Talk', '#ec4899', 'MessagesSquare', 8),
    ('GET / Diesel Refill', '#14b8a6', 'Fuel', 9),
    ('Other', '#6b7280', 'FileText', 99)
  ) AS v(name, color, icon, sort_order)
  WHERE admin_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM delay_categories d WHERE d.name = v.name);
END $$;
