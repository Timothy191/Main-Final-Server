-- ============================================
-- Migration 050: Fleet seed from CSV + RLS update
-- All machines centralised under admin department.
-- Other departments pull by machine_type.
-- ============================================

-- ============================================
-- 1. Create admin department if not exists
-- ============================================
INSERT INTO departments (name, display_name, icon, description, color)
VALUES ('admin', 'Admin', 'Shield', 'Personnel management, shift oversight & quotas', 'violet')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. Open machines SELECT to all authenticated (shared resource)
-- ============================================
DROP POLICY IF EXISTS "machines_select_department_active" ON machines;
CREATE POLICY "machines_select_all_authenticated" ON machines
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- ============================================
-- 3. Remove old placeholder machines
-- ============================================
DELETE FROM machines WHERE name IN ('DR-001', 'DR-002', 'DT-101', 'DT-102', 'EX-501', 'GEN-A', 'GEN-B');

-- ============================================
-- 4. Seed machines table (all under admin)
-- ============================================
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM departments WHERE name = 'admin';

  -- Articulated Dumpers (Dump Truck, bin_factor=20.5)
  INSERT INTO machines (department_id, name, machine_type, active, bin_factor) VALUES
    (admin_id, 'DT12', 'Dump Truck', true, 20.5),
    (admin_id, 'DT13', 'Dump Truck', true, 20.5),
    (admin_id, 'DT14', 'Dump Truck', true, 20.5),
    (admin_id, 'DT15', 'Dump Truck', true, 20.5),
    (admin_id, 'DT30', 'Dump Truck', true, 20.5),
    (admin_id, 'DT34', 'Dump Truck', true, 20.5),
    (admin_id, 'DT35', 'Dump Truck', true, 20.5),
    (admin_id, 'DT42', 'Dump Truck', true, 20.5),
    (admin_id, 'DT46', 'Dump Truck', true, 20.5),
    (admin_id, 'DT61', 'Dump Truck', true, 20.5),
    (admin_id, 'DT69', 'Dump Truck', true, 20.5),
    (admin_id, 'DT73', 'Dump Truck', true, 20.5),
    (admin_id, 'DT77', 'Dump Truck', true, 20.5),
    (admin_id, 'DT79', 'Dump Truck', true, 20.5),
    (admin_id, 'DT80', 'Dump Truck', true, 20.5),
    (admin_id, 'DT87', 'Dump Truck', true, 20.5),
    (admin_id, 'DT91', 'Dump Truck', true, 20.5),
    (admin_id, 'DT102', 'Dump Truck', true, 20.5),
    (admin_id, 'DT103', 'Dump Truck', true, 20.5),
    (admin_id, 'DT108', 'Dump Truck', true, 20.5),
    (admin_id, 'DT109', 'Dump Truck', true, 20.5),
    (admin_id, 'DT110', 'Dump Truck', true, 20.5),
    (admin_id, 'DT111', 'Dump Truck', true, 20.5),
    (admin_id, 'DT112', 'Dump Truck', true, 20.5)
  ON CONFLICT DO NOTHING;

  -- Rigid Dumpers (Dump Truck, bin_factor=40.6)
  INSERT INTO machines (department_id, name, machine_type, active, bin_factor) VALUES
    (admin_id, 'RDT17', 'Dump Truck', true, 40.6),
    (admin_id, 'RDT20', 'Dump Truck', true, 40.6),
    (admin_id, 'RDT25', 'Dump Truck', true, 40.6),
    (admin_id, 'RDT26', 'Dump Truck', true, 40.6),
    (admin_id, 'RDT34', 'Dump Truck', true, 40.6),
    (admin_id, 'RDT35', 'Dump Truck', true, 40.6),
    (admin_id, 'RDT36', 'Dump Truck', true, 40.6),
    (admin_id, 'RDT37', 'Dump Truck', true, 40.6),
    (admin_id, 'RDT39', 'Dump Truck', true, 40.6)
  ON CONFLICT DO NOTHING;

  -- Excavators
  INSERT INTO machines (department_id, name, machine_type, active) VALUES
    (admin_id, 'EX10', 'Excavator', true),
    (admin_id, 'EX22', 'Excavator', true),
    (admin_id, 'EX24', 'Excavator', true),
    (admin_id, 'EX36', 'Excavator', true),
    (admin_id, 'EX39', 'Excavator', true),
    (admin_id, 'EX40', 'Excavator', true),
    (admin_id, 'EX45', 'Excavator', true),
    (admin_id, 'EX48', 'Excavator', true),
    (admin_id, 'EX52', 'Excavator', true),
    (admin_id, 'EX53', 'Excavator', true)
  ON CONFLICT DO NOTHING;

  -- Bulldozers (Dozer)
  INSERT INTO machines (department_id, name, machine_type, active) VALUES
    (admin_id, 'BD19', 'Dozer', true),
    (admin_id, 'BD22', 'Dozer', true),
    (admin_id, 'BD24', 'Dozer', true),
    (admin_id, 'BD26', 'Dozer', true),
    (admin_id, 'BD29', 'Dozer', true),
    (admin_id, 'BD33', 'Dozer', true),
    (admin_id, 'BD34', 'Dozer', true),
    (admin_id, 'BD35', 'Dozer', true),
    (admin_id, 'BD39', 'Dozer', true),
    (admin_id, 'BD43', 'Dozer', true)
  ON CONFLICT DO NOTHING;

  -- Graders
  INSERT INTO machines (department_id, name, machine_type, active) VALUES
    (admin_id, 'G21', 'Grader', true),
    (admin_id, 'G24', 'Grader', true),
    (admin_id, 'G25', 'Grader', true)
  ON CONFLICT DO NOTHING;

  -- Frontend Loaders (Loader)
  INSERT INTO machines (department_id, name, machine_type, active) VALUES
    (admin_id, 'L17', 'Loader', true),
    (admin_id, 'L20', 'Loader', true),
    (admin_id, 'L22', 'Loader', true),
    (admin_id, 'L25', 'Loader', true),
    (admin_id, 'L31', 'Loader', true),
    (admin_id, 'L35', 'Loader', true),
    (admin_id, 'L36', 'Loader', true),
    (admin_id, 'L41', 'Loader', true),
    (admin_id, 'L42', 'Loader', true),
    (admin_id, 'L48', 'Loader', true),
    (admin_id, 'L50', 'Loader', true)
  ON CONFLICT DO NOTHING;

  -- Drill Rigs
  INSERT INTO machines (department_id, name, machine_type, active) VALUES
    (admin_id, 'DR02', 'Drill Rig', true),
    (admin_id, 'DR07', 'Drill Rig', true),
    (admin_id, 'DR09', 'Drill Rig', true),
    (admin_id, 'DR10', 'Drill Rig', true),
    (admin_id, 'DR12', 'Drill Rig', true)
  ON CONFLICT DO NOTHING;

  -- Other (Crusher, TLB, Bowsers, Generators, Welding, Pressure Washer, Coal Truck)
  INSERT INTO machines (department_id, name, machine_type, active) VALUES
    (admin_id, 'CROO6', 'Crusher', true),
    (admin_id, 'TLB004', 'Other', true),
    (admin_id, 'GEN001', 'Generator', true),
    (admin_id, 'GEN006', 'Generator', true),
    (admin_id, 'GEN007', 'Generator', true),
    (admin_id, 'GEN009', 'Generator', true),
    (admin_id, 'WM002', 'Other', true),
    (admin_id, 'WM003', 'Other', true),
    (admin_id, 'PW002', 'Other', true),
    (admin_id, 'FB16', 'Other', true),
    (admin_id, 'FB18', 'Other', true),
    (admin_id, 'WB004', 'Water Truck', true),
    (admin_id, 'T001', 'Other', true)
  ON CONFLICT DO NOTHING;

  -- Lighting Plants (Other)
  INSERT INTO machines (department_id, name, machine_type, active) VALUES
    (admin_id, 'LP01', 'Other', true),
    (admin_id, 'LP05', 'Other', true),
    (admin_id, 'LP08', 'Other', true),
    (admin_id, 'LP12', 'Other', true)
  ON CONFLICT DO NOTHING;

  -- Light Vehicles
  INSERT INTO machines (department_id, name, machine_type, active) VALUES
    (admin_id, 'MDV002', 'Light Vehicle', true),
    (admin_id, 'LDV006', 'Light Vehicle', true),
    (admin_id, 'LDV10', 'Light Vehicle', true),
    (admin_id, 'LDV21', 'Light Vehicle', true),
    (admin_id, 'LDV22', 'Light Vehicle', true),
    (admin_id, 'LDV25', 'Light Vehicle', true),
    (admin_id, 'LDV27', 'Light Vehicle', true),
    (admin_id, 'LDV28', 'Light Vehicle', true),
    (admin_id, 'LDV37', 'Light Vehicle', true),
    (admin_id, 'LDV42', 'Light Vehicle', true),
    (admin_id, 'LDV43', 'Light Vehicle', true),
    (admin_id, 'LDV53', 'Light Vehicle', true),
    (admin_id, 'LDV76', 'Light Vehicle', true),
    (admin_id, 'LDV88', 'Light Vehicle', true),
    (admin_id, 'LDV90', 'Light Vehicle', true),
    (admin_id, 'LDV101', 'Light Vehicle', true),
    (admin_id, 'LDV105', 'Light Vehicle', true),
    (admin_id, 'LDV110', 'Light Vehicle', true),
    (admin_id, 'LDV111', 'Light Vehicle', true),
    (admin_id, 'LDV116', 'Light Vehicle', true),
    (admin_id, 'LDV117', 'Light Vehicle', true),
    (admin_id, 'LDV121', 'Light Vehicle', true),
    (admin_id, 'LDV130', 'Light Vehicle', true),
    (admin_id, 'LDV132', 'Light Vehicle', true),
    (admin_id, 'LDV133', 'Light Vehicle', true),
    (admin_id, 'LDV139', 'Light Vehicle', true),
    (admin_id, 'LDV141', 'Light Vehicle', true),
    (admin_id, 'LDV144', 'Light Vehicle', true),
    (admin_id, 'LDV155', 'Light Vehicle', true),
    (admin_id, 'LDV157', 'Light Vehicle', true),
    (admin_id, 'LDV161', 'Light Vehicle', true),
    (admin_id, 'LDV166', 'Light Vehicle', true),
    (admin_id, 'LDV167', 'Light Vehicle', true),
    (admin_id, 'LDV174', 'Light Vehicle', true)
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- 5. Seed fleet table (all under admin)
-- ============================================
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM departments WHERE name = 'admin';

  INSERT INTO fleet (fleet_code, vehicle_type, make, model, department_id, status) VALUES
    ('DT12', 'Articulated Dumper', 'Volvo', 'A35D', admin_id, 'Active'),
    ('DT13', 'Articulated Dumper', 'Volvo', 'A35E', admin_id, 'Active'),
    ('DT14', 'Articulated Dumper', 'Volvo', 'A35E', admin_id, 'Active'),
    ('DT15', 'Articulated Dumper', 'Volvo', 'A35E', admin_id, 'Active'),
    ('DT30', 'Articulated Dumper', 'Volvo', 'A40F', admin_id, 'Active'),
    ('DT34', 'Articulated Dumper', 'Volvo', 'A40G', admin_id, 'Active'),
    ('DT35', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT42', 'Articulated Dumper', 'Volvo', 'A35F', admin_id, 'Active'),
    ('DT46', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT61', 'Articulated Dumper', 'Volvo', 'A35F', admin_id, 'Active'),
    ('DT69', 'Articulated Dumper', 'Volvo', 'A40G', admin_id, 'Active'),
    ('DT73', 'Articulated Dumper', 'Volvo', 'A40G', admin_id, 'Active'),
    ('DT77', 'Articulated Dumper', 'Volvo', 'A40G', admin_id, 'Active'),
    ('DT79', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT80', 'Articulated Dumper', 'Volvo', 'A40G', admin_id, 'Active'),
    ('DT87', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT91', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT102', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT103', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT108', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT109', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT110', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT111', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('DT112', 'Articulated Dumper', 'Volvo', 'A45G', admin_id, 'Active'),
    ('RDT17', 'Rigid Dumper', 'Cat', '777E', admin_id, 'Active'),
    ('RDT20', 'Rigid Dumper', 'Cat', '777E', admin_id, 'Active'),
    ('RDT25', 'Rigid Dumper', 'Komatsu', 'HD785', admin_id, 'Active'),
    ('RDT26', 'Rigid Dumper', 'Komatsu', 'HD785', admin_id, 'Active'),
    ('RDT34', 'Rigid Dumper', 'Cat', '777E', admin_id, 'Active'),
    ('RDT35', 'Rigid Dumper', 'Cat', '777E', admin_id, 'Active'),
    ('RDT36', 'Rigid Dumper', 'Cat', '777E', admin_id, 'Active'),
    ('RDT37', 'Rigid Dumper', 'Cat', '777E', admin_id, 'Active'),
    ('RDT39', 'Rigid Dumper', 'Cat', '777E', admin_id, 'Active'),
    ('EX10', 'Excavator', 'Hitachi', '400', admin_id, 'Active'),
    ('EX22', 'Excavator', 'Hitachi', '870', admin_id, 'Active'),
    ('EX24', 'Excavator', 'Hitachi', '1200', admin_id, 'Active'),
    ('EX36', 'Excavator', 'Volvo', '380D', admin_id, 'Active'),
    ('EX39', 'Excavator', 'Komatsu', 'PC1250 sp', admin_id, 'Active'),
    ('EX40', 'Excavator', 'Volvo', 'EC 380 DL', admin_id, 'Active'),
    ('EX45', 'Excavator', 'Hitachi', '870', admin_id, 'Active'),
    ('EX48', 'Excavator', 'Komatsu', 'PC1250 sp', admin_id, 'Active'),
    ('EX52', 'Excavator', 'Hitachi', '870', admin_id, 'Active'),
    ('EX53', 'Excavator', 'Hitachi', '870', admin_id, 'Active'),
    ('BD19', 'Bulldozer', 'Cat', 'Dozer D8R', admin_id, 'Active'),
    ('BD22', 'Bulldozer', 'Cat', 'Dozer D9R', admin_id, 'Active'),
    ('BD24', 'Bulldozer', 'Cat', 'Dozer D9R', admin_id, 'Active'),
    ('BD26', 'Bulldozer', 'Cat', 'Dozer D9R', admin_id, 'Active'),
    ('BD29', 'Bulldozer', 'Cat', 'Dozer D10T', admin_id, 'Active'),
    ('BD33', 'Bulldozer', 'Cat', 'Dozer D11T', admin_id, 'Active'),
    ('BD34', 'Bulldozer', 'Cat', 'Dozer D11T', admin_id, 'Active'),
    ('BD35', 'Bulldozer', 'Komatsu', 'D65', admin_id, 'Active'),
    ('BD39', 'Bulldozer', 'Cat', 'Dozer D11T', admin_id, 'Active'),
    ('BD43', 'Bulldozer', 'Cat', 'Dozer D9GC', admin_id, 'Active'),
    ('G21', 'Grader', 'Cat', 'Grader 16H', admin_id, 'Active'),
    ('G24', 'Grader', 'Cat', 'Grader 140K', admin_id, 'Active'),
    ('G25', 'Grader', 'SANY', 'GRADER (SMG 200 C-8)', admin_id, 'Active'),
    ('L17', 'Frontend Loader', 'Cat', '966H', admin_id, 'Active'),
    ('L20', 'Frontend Loader', 'Volvo', 'L180H', admin_id, 'Active'),
    ('L22', 'Frontend Loader', 'Volvo', 'L180H', admin_id, 'Active'),
    ('L25', 'Frontend Loader', 'Cat', '966H', admin_id, 'Active'),
    ('L31', 'Frontend Loader', 'Volvo', 'L150H', admin_id, 'Active'),
    ('L35', 'Frontend Loader', 'Volvo', 'L150H', admin_id, 'Active'),
    ('L36', 'Frontend Loader', 'Volvo', 'L150H', admin_id, 'Active'),
    ('L41', 'Frontend Loader', 'Volvo', 'L150H', admin_id, 'Active'),
    ('L42', 'Frontend Loader', 'Volvo', 'L150H', admin_id, 'Active'),
    ('L48', 'Frontend Loader', 'Volvo', 'L150H', admin_id, 'Active'),
    ('L50', 'Frontend Loader', 'Volvo', 'L150H', admin_id, 'Active'),
    ('DR02', 'Drill', 'DM30', 'DRILL RIG', admin_id, 'Active'),
    ('DR07', 'Drill', 'DM30', 'DRILL RIG', admin_id, 'Active'),
    ('DR09', 'Drill', 'DM30', 'DRILL RIG', admin_id, 'Active'),
    ('DR10', 'Drill', 'DM30', 'DRILL RIG', admin_id, 'Active'),
    ('DR12', 'Drill', 'EPIROC', 'D65 DRILL RIG', admin_id, 'Active'),
    ('CROO6', 'Other', 'METSO', 'LOKO TRACK', admin_id, 'Active'),
    ('TLB004', 'Other', 'Cat', 'TLB 428E', admin_id, 'Active'),
    ('LP01', 'Lighting Plant', 'LIGHTING', 'PLANT', admin_id, 'Active'),
    ('LP05', 'Lighting Plant', 'LIGHTING', 'PLANT', admin_id, 'Active'),
    ('LP08', 'Lighting Plant', 'LIGHTING', 'PLANT', admin_id, 'Active'),
    ('LP12', 'Lighting Plant', 'LIGHTING', 'PLANT', admin_id, 'Active'),
    ('GEN001', 'Other', 'GENERATOR', NULL, admin_id, 'Active'),
    ('GEN006', 'Other', 'GENERATOR', NULL, admin_id, 'Active'),
    ('GEN007', 'Other', 'GENERATOR', NULL, admin_id, 'Active'),
    ('GEN009', 'Other', 'GENERATOR', NULL, admin_id, 'Active'),
    ('WM002', 'Other', 'WELDING', 'MACHINE', admin_id, 'Active'),
    ('WM003', 'Other', 'WELDING', 'MACHINE', admin_id, 'Active'),
    ('PW002', 'Other', 'PRESSURE', 'WASHER', admin_id, 'Active'),
    ('FB16', 'Other', 'DIESEL', 'BOWSER', admin_id, 'Active'),
    ('FB18', 'Other', 'DIESEL', 'BOWSER(VOLVO A30F)', admin_id, 'Active'),
    ('WB004', 'Other', 'WATER', 'BOWSER(VOLVO A35F)', admin_id, 'Active'),
    ('T001', 'Other', 'COAL', 'TRUCK', admin_id, 'Active'),
    ('MDV002', 'Light Vehicle', 'Toyota', 'Landcruiser', admin_id, 'Active'),
    ('LDV006', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV10', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV21', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV22', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV25', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV27', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV28', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV37', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV42', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV43', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV53', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV76', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV88', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV90', 'Light Vehicle', 'Isuzu', 'Bakkie', admin_id, 'Active'),
    ('LDV101', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV105', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV110', 'Light Vehicle', 'Ford', 'Ranger', admin_id, 'Active'),
    ('LDV111', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV116', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV117', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV121', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV130', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV132', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV133', 'Light Vehicle', 'Nissan', 'Bakkie NP200', admin_id, 'Active'),
    ('LDV139', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV141', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV144', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV155', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV157', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV161', 'Light Vehicle', 'GWM', 'P-SERIES', admin_id, 'Active'),
    ('LDV166', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV167', 'Light Vehicle', 'Toyota', 'Hilux', admin_id, 'Active'),
    ('LDV174', 'Light Vehicle', 'Ford', 'Ranger', admin_id, 'Active')
  ON CONFLICT (fleet_code) DO NOTHING;

END $$;
