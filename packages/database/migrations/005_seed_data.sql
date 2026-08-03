-- ============================================
-- Seed Data: Core Departments
-- ============================================
INSERT INTO departments (name, display_name, icon, description, color) VALUES
  ('drilling', 'Drilling', 'Drill', 'Drill rig operations & bit depth telemetry', 'blue'),
  ('production', 'Production', 'Factory', 'Coal yield, tonnage & extraction tracking', 'emerald'),
  ('access-control', 'Access Control', 'ShieldCheck', 'Site access, badging & security', 'blue'),
  ('engineering', 'Engineering', 'Wrench', 'Equipment specs, maintenance & CAD', 'violet'),
  ('control-room', 'Control Room', 'Monitor', 'SCADA systems & real-time monitoring', 'red'),
  ('safety', 'Safety', 'HardHat', 'Incident logs, compliance & inspections', 'blue'),
  ('training', 'Training', 'GraduationCap', 'LMS, certifications & competency tracking', 'cyan'),
  ('satellite-monitoring', 'Satellite Monitoring', 'Satellite', 'SAR/InSAR, hyperspectral & high-resolution imagery', 'indigo')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  color = EXCLUDED.color;

-- ============================================
-- Seed Data: Initial Machines
-- ============================================
DO $$
DECLARE
  drilling_id UUID;
  production_id UUID;
  engineering_id UUID;
  control_room_id UUID;
BEGIN
  SELECT id INTO drilling_id FROM departments WHERE name = 'drilling';
  SELECT id INTO production_id FROM departments WHERE name = 'production';
  SELECT id INTO engineering_id FROM departments WHERE name = 'engineering';
  SELECT id INTO control_room_id FROM departments WHERE name = 'control-room';

  -- Drilling machines
  INSERT INTO machines (department_id, name, machine_type, serial_number, active) VALUES
    (drilling_id, 'DR-001', 'Drill Rig', 'SER-DR-101', true),
    (drilling_id, 'DR-002', 'Drill Rig', 'SER-DR-102', true)
  ON CONFLICT DO NOTHING;

  -- Production machines
  INSERT INTO machines (department_id, name, machine_type, serial_number, active, bin_factor) VALUES
    (production_id, 'DT-101', 'Dump Truck', 'SER-DT-201', true, 40.5),
    (production_id, 'DT-102', 'Dump Truck', 'SER-DT-202', true, 40.5),
    (production_id, 'EX-501', 'Excavator', 'SER-EX-301', true, NULL)
  ON CONFLICT DO NOTHING;

  -- Engineering/Control Room machines
  INSERT INTO machines (department_id, name, machine_type, serial_number, active) VALUES
    (control_room_id, 'GEN-A', 'Generator', 'SER-GEN-401', true),
    (control_room_id, 'GEN-B', 'Generator', 'SER-GEN-402', true)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- Seed Data: Sites
-- ============================================
INSERT INTO sites (name, site_code, active) VALUES
  ('Main Pit', 'PIT-01', true),
  ('South Pit', 'PIT-02', true),
  ('Wash Plant', 'WASH-01', true),
  ('Stockpile A', 'STOCK-A', true)
ON CONFLICT (site_code) DO NOTHING;

-- ============================================
-- Seed Data: Operators (Control Room)
-- ============================================
INSERT INTO operators (full_name, employee_code, role, active) VALUES
  ('John Doe', 'EMP-001', 'operator', true),
  ('Jane Smith', 'EMP-002', 'operator', true),
  ('Mike Johnson', 'EMP-003', 'supervisor', true)
ON CONFLICT (employee_code) DO NOTHING;

-- ============================================
-- Seed Data: Delay Categories (Extended)
-- ============================================
INSERT INTO delay_categories (name, color, icon, sort_order) VALUES
  ('Equipment Breakdown', '#ef4444', 'Wrench', 1),
  ('Weather', '#3b82f6', 'CloudRain', 2),
  ('Safety Incident', '#007aff', 'ShieldAlert', 3),
  ('Maintenance', '#8b5cf6', 'Settings', 4),
  ('Material Shortage', '#6366f1', 'PackageX', 5),
  ('Shift Change', '#10b981', 'Users', 6),
  ('Operator Unavailable', '#007aff', 'UserX', 7),
  ('Other', '#6b7280', 'FileText', 99)
ON CONFLICT (name) DO UPDATE SET
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;
