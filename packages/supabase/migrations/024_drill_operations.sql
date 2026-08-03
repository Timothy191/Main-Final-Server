-- ============================================
-- Drill Operations Table
-- Tracks daily drilling operations per rig
-- ============================================

CREATE TABLE IF NOT EXISTS drill_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  operation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Time tracking
  open_hours NUMERIC(10,2),
  close_hours NUMERIC(10,2),
  total_hours NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN close_hours IS NOT NULL AND open_hours IS NOT NULL 
        AND close_hours >= open_hours 
      THEN close_hours - open_hours
      ELSE NULL
    END
  ) STORED,
  
  -- Operator assignment
  operator_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  operator_name TEXT,
  
  -- Drilling metrics
  block_drilled TEXT,
  holes INTEGER DEFAULT 0,
  meters_drilled NUMERIC(10,2) DEFAULT 0,
  
  -- Delay tracking (in minutes)
  production_delays NUMERIC(10,2) DEFAULT 0,
  non_productional_delays NUMERIC(10,2) DEFAULT 0,
  engineering_delays NUMERIC(10,2) DEFAULT 0,
  
  -- Shift tracking
  shift_id UUID REFERENCES shift_status(id) ON DELETE SET NULL,
  shift_type TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'maintenance')),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Unique constraint: one operation record per machine per date
  UNIQUE(machine_id, operation_date)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_drill_operations_machine_date ON drill_operations(machine_id, operation_date);
CREATE INDEX IF NOT EXISTS idx_drill_operations_department_date ON drill_operations(department_id, operation_date);
CREATE INDEX IF NOT EXISTS idx_drill_operations_operator ON drill_operations(operator_id);
CREATE INDEX IF NOT EXISTS idx_drill_operations_shift ON drill_operations(shift_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_drill_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS drill_operations_updated_at ON drill_operations;
CREATE TRIGGER drill_operations_updated_at
  BEFORE UPDATE ON drill_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_drill_operations_updated_at();

-- Enable RLS
ALTER TABLE drill_operations ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "drill_operations_select_department"
  ON drill_operations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = drill_operations.department_id
          OR drill_operations.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- Insert policy
CREATE POLICY "drill_operations_insert_department"
  ON drill_operations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = drill_operations.department_id
          OR drill_operations.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- Update policy
CREATE POLICY "drill_operations_update_department"
  ON drill_operations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = drill_operations.department_id
          OR drill_operations.department_id = ANY(e.accessible_departments)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = drill_operations.department_id
          OR drill_operations.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- Delete policy
CREATE POLICY "drill_operations_delete_department"
  ON drill_operations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = drill_operations.department_id
          OR drill_operations.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE drill_operations;
