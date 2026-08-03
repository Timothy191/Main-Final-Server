-- ============================================
-- Add dump trucks to Control Room for Hourly Loads bin_factor feature
-- ============================================

-- Insert production dumpers into control-room department
INSERT INTO machines (department_id, name, machine_type, serial_number, active, bin_factor)
SELECT 
    d.id as department_id,
    'DT-101' as name,
    'Dump Truck' as machine_type,
    'SER-DT-201-CR' as serial_number,
    true as active,
    40.5 as bin_factor
FROM departments d
WHERE d.name = 'control-room'
  AND NOT EXISTS (
    SELECT 1 FROM machines m
    WHERE m.department_id = d.id AND m.name = 'DT-101'
  );

INSERT INTO machines (department_id, name, machine_type, serial_number, active, bin_factor)
SELECT 
    d.id as department_id,
    'DT-102' as name,
    'Dump Truck' as machine_type,
    'SER-DT-202-CR' as serial_number,
    true as active,
    40.5 as bin_factor
FROM departments d
WHERE d.name = 'control-room'
  AND NOT EXISTS (
    SELECT 1 FROM machines m
    WHERE m.department_id = d.id AND m.name = 'DT-102'
  );
