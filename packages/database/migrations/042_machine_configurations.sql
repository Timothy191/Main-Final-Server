-- Control Room: per-department operational setpoints (RPM, power, pressure)
CREATE TABLE IF NOT EXISTS machine_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  target_rpm INTEGER NOT NULL CHECK (target_rpm >= 0 AND target_rpm <= 5000),
  power_allocation INTEGER NOT NULL CHECK (power_allocation >= 0 AND power_allocation <= 100),
  hydraulic_pressure INTEGER NOT NULL CHECK (hydraulic_pressure >= 0 AND hydraulic_pressure <= 1000),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (department_id)
);

ALTER TABLE machine_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "machine_configurations_select_access"
  ON machine_configurations FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

CREATE POLICY "machine_configurations_insert_access"
  ON machine_configurations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_department_access(department_id));

CREATE POLICY "machine_configurations_update_access"
  ON machine_configurations FOR UPDATE
  TO authenticated
  USING (public.has_department_access(department_id));

CREATE POLICY "machine_configurations_delete_access"
  ON machine_configurations FOR DELETE
  TO authenticated
  USING (public.has_department_access(department_id));

CREATE INDEX IF NOT EXISTS idx_machine_configurations_department
  ON machine_configurations(department_id);

DROP TRIGGER IF EXISTS update_machine_configurations_updated_at ON machine_configurations;
CREATE TRIGGER update_machine_configurations_updated_at
  BEFORE UPDATE ON machine_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE machine_configurations IS 'Control room setpoints per department (one row per department)';
