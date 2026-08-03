-- ============================================
-- Shift Close-Out: PIN Authentication & Shift Status
-- ============================================

-- 1. Add employee_code to employees for PIN-based verification
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code TEXT UNIQUE;

-- 2. Add pin_hash to employees for bcrypt-hashed supervisor PINs
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 3. Create shift_status table
CREATE TABLE IF NOT EXISTS shift_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'night')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(department_id, shift_date, shift_type)
);

-- 4. Enable RLS
ALTER TABLE shift_status ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "shift_status_select_access" ON shift_status;
CREATE POLICY "shift_status_select_access"
  ON shift_status FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

DROP POLICY IF EXISTS "shift_status_insert_access" ON shift_status;
CREATE POLICY "shift_status_insert_access"
  ON shift_status FOR INSERT
  TO authenticated
  WITH CHECK (public.has_department_access(department_id));

DROP POLICY IF EXISTS "shift_status_update_access" ON shift_status;
CREATE POLICY "shift_status_update_access"
  ON shift_status FOR UPDATE
  TO authenticated
  USING (public.has_department_access(department_id));

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_shift_status_dept_date_shift
  ON shift_status(department_id, shift_date DESC, shift_type);

-- 7. Audit trigger
DROP TRIGGER IF EXISTS audit_shift_status ON shift_status;
CREATE TRIGGER audit_shift_status
  AFTER INSERT OR UPDATE OR DELETE ON shift_status
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ============================================
-- 8. Seed data: default PIN (0000) for existing supervisors and admins
-- ============================================
UPDATE employees
SET
  employee_code = COALESCE(employee_code, 'EMP' || SUBSTRING(id::text, 1, 6)),
  pin_hash = COALESCE(pin_hash, '$2b$10$2gnUS1ysKN0ClmCH2xf1Vuz4aWOYromWScRKDKhN.7yrEK58TZ0b.')
WHERE role IN ('supervisor', 'admin');
