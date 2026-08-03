-- ============================================
-- Machine Breakdowns (Engineering Department)
-- ============================================
-- Tracks machine breakdown book-in/book-out workflow
-- Ported from standalone Breakdown system into Arch-Systems

CREATE TABLE IF NOT EXISTS breakdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  fleet_id TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  date_in DATE NOT NULL,
  time_in TIME DEFAULT '00:00',
  date_out DATE,
  time_out TIME,
  reason TEXT NOT NULL,
  repair_notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  missing_book_in BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_breakdowns_department ON breakdowns(department_id);
CREATE INDEX idx_breakdowns_status ON breakdowns(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_breakdowns_fleet_id ON breakdowns(fleet_id);
CREATE INDEX idx_breakdowns_date_in ON breakdowns(date_in DESC);

ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;

-- All authenticated users with department access can read breakdowns
CREATE POLICY "breakdowns_select_department"
  ON breakdowns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = breakdowns.department_id
          OR breakdowns.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- Operators, supervisors, and admins can book in breakdowns
CREATE POLICY "breakdowns_insert_department"
  ON breakdowns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.role = 'supervisor'
          OR e.role = 'operator'
        )
        AND (
          e.department_id = breakdowns.department_id
          OR breakdowns.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- Operators, supervisors, and admins can update (book out)
CREATE POLICY "breakdowns_update_department"
  ON breakdowns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.role = 'supervisor'
          OR e.role = 'operator'
        )
        AND (
          e.department_id = breakdowns.department_id
          OR breakdowns.department_id = ANY(e.accessible_departments)
        )
    )
  )
  WITH CHECK (
    (deleted_at IS NULL OR (SELECT role FROM employees WHERE auth_id = auth.uid() LIMIT 1) = 'admin')
  );

-- Only admins can soft-delete
CREATE POLICY "breakdowns_delete_admin"
  ON breakdowns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND e.role = 'admin'
    )
  );

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_breakdowns_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER breakdowns_updated_at
  BEFORE UPDATE ON breakdowns
  FOR EACH ROW
  EXECUTE FUNCTION update_breakdowns_updated_at();
