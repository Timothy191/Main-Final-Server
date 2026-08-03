-- ============================================
-- Migration 075: New departments + domain tables
-- Adds Environment, Logistics & Fleet, Geology & Survey departments
-- and the tables powering their foundational logic (plus training + tires).
-- Uses has_department_access(dept_id) from 001_initial.sql for RLS.
-- ============================================

-- ============================================
-- 1. Seed new departments
-- ============================================
INSERT INTO departments (name, display_name, icon, description, color) VALUES
  ('environment', 'Environment', 'Leaf', 'Environmental monitoring & compliance (dust, water, noise, emissions)', 'emerald'),
  ('logistics-fleet', 'Logistics & Fleet', 'Truck', 'Fleet tracking, fuel consumption & site logistics', 'indigo'),
  ('geology', 'Geology & Survey', 'Mountain', 'Survey measurements, mine blocks & geology data', 'violet')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  color = EXCLUDED.color;

-- ============================================
-- 2. Environmental readings (Environment)
-- ============================================
CREATE TABLE IF NOT EXISTS environmental_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  reading_type TEXT NOT NULL CHECK (reading_type IN ('dust', 'water', 'noise', 'emissions', 'weather')),
  value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'mg/m3',
  location TEXT,
  status TEXT NOT NULL DEFAULT 'within-limit' CHECK (status IN ('within-limit', 'exceeded', 'under-investigation')),
  recorded_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE environmental_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "environmental_readings_select_department"
  ON environmental_readings FOR SELECT
  TO authenticated
  USING (has_department_access(environmental_readings.department_id));

CREATE POLICY "environmental_readings_insert_department"
  ON environmental_readings FOR INSERT
  TO authenticated
  WITH CHECK (has_department_access(environmental_readings.department_id));

CREATE POLICY "environmental_readings_update_department"
  ON environmental_readings FOR UPDATE
  TO authenticated
  USING (has_department_access(environmental_readings.department_id));

CREATE POLICY "environmental_readings_delete_department"
  ON environmental_readings FOR DELETE
  TO authenticated
  USING (has_department_access(environmental_readings.department_id));

CREATE INDEX IF NOT EXISTS idx_environmental_readings_dept_date
  ON environmental_readings(department_id, reading_date DESC);

CREATE TRIGGER update_environmental_readings_updated_at
  BEFORE UPDATE ON environmental_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Survey measurements (Geology & Survey)
-- ============================================
CREATE TABLE IF NOT EXISTS survey_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  survey_date DATE NOT NULL,
  survey_type TEXT NOT NULL CHECK (survey_type IN ('topographic', 'grade', 'peg-out', 'volume', 'monitoring')),
  block_id UUID REFERENCES mine_blocks(id) ON DELETE SET NULL,
  location TEXT,
  measurement_value NUMERIC,
  unit TEXT,
  surveyed_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE survey_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_measurements_select_department"
  ON survey_measurements FOR SELECT
  TO authenticated
  USING (has_department_access(survey_measurements.department_id));

CREATE POLICY "survey_measurements_insert_department"
  ON survey_measurements FOR INSERT
  TO authenticated
  WITH CHECK (has_department_access(survey_measurements.department_id));

CREATE POLICY "survey_measurements_update_department"
  ON survey_measurements FOR UPDATE
  TO authenticated
  USING (has_department_access(survey_measurements.department_id));

CREATE POLICY "survey_measurements_delete_department"
  ON survey_measurements FOR DELETE
  TO authenticated
  USING (has_department_access(survey_measurements.department_id));

CREATE INDEX IF NOT EXISTS idx_survey_measurements_dept_date
  ON survey_measurements(department_id, survey_date DESC);

CREATE TRIGGER update_survey_measurements_updated_at
  BEFORE UPDATE ON survey_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Tires (Engineering - tire management)
-- ============================================
CREATE TABLE IF NOT EXISTS tires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  fleet_id UUID REFERENCES fleet(id) ON DELETE SET NULL,
  machine_name TEXT,
  position TEXT,
  size TEXT,
  tread_depth_mm NUMERIC,
  pressure_psi NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'service-due', 'critical', 'replaced', 'decommissioned')),
  installed_at DATE,
  replaced_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tires_select_department"
  ON tires FOR SELECT
  TO authenticated
  USING (has_department_access(tires.department_id));

CREATE POLICY "tires_insert_department"
  ON tires FOR INSERT
  TO authenticated
  WITH CHECK (has_department_access(tires.department_id));

CREATE POLICY "tires_update_department"
  ON tires FOR UPDATE
  TO authenticated
  USING (has_department_access(tires.department_id));

CREATE POLICY "tires_delete_department"
  ON tires FOR DELETE
  TO authenticated
  USING (has_department_access(tires.department_id));

CREATE INDEX IF NOT EXISTS idx_tires_dept_status ON tires(department_id, status);

CREATE TRIGGER update_tires_updated_at
  BEFORE UPDATE ON tires
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Certifications (Training)
-- ============================================
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  role TEXT,
  certification TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  issued_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certifications_select_department"
  ON certifications FOR SELECT
  TO authenticated
  USING (has_department_access(certifications.department_id));

CREATE POLICY "certifications_insert_department"
  ON certifications FOR INSERT
  TO authenticated
  WITH CHECK (has_department_access(certifications.department_id));

CREATE POLICY "certifications_update_department"
  ON certifications FOR UPDATE
  TO authenticated
  USING (has_department_access(certifications.department_id));

CREATE POLICY "certifications_delete_department"
  ON certifications FOR DELETE
  TO authenticated
  USING (has_department_access(certifications.department_id));

CREATE INDEX IF NOT EXISTS idx_certifications_dept_expiry
  ON certifications(department_id, expiry_date);

CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Training courses (Training / LMS)
-- ============================================
CREATE TABLE IF NOT EXISTS training_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Safety' CHECK (category IN ('Safety', 'Equipment', 'Induction', 'Compliance')),
  description TEXT,
  lessons INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'Basic' CHECK (level IN ('Basic', 'Intermediate', 'Advanced')),
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_courses_select_department"
  ON training_courses FOR SELECT
  TO authenticated
  USING (has_department_access(training_courses.department_id));

CREATE POLICY "training_courses_insert_department"
  ON training_courses FOR INSERT
  TO authenticated
  WITH CHECK (has_department_access(training_courses.department_id));

CREATE POLICY "training_courses_update_department"
  ON training_courses FOR UPDATE
  TO authenticated
  USING (has_department_access(training_courses.department_id));

CREATE POLICY "training_courses_delete_department"
  ON training_courses FOR DELETE
  TO authenticated
  USING (has_department_access(training_courses.department_id));

CREATE INDEX IF NOT EXISTS idx_training_courses_dept_category
  ON training_courses(department_id, category);

CREATE TRIGGER update_training_courses_updated_at
  BEFORE UPDATE ON training_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Training schedules (Training)
-- ============================================
CREATE TABLE IF NOT EXISTS training_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  course_id UUID REFERENCES training_courses(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL,
  location TEXT,
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  instructor TEXT,
  capacity INTEGER NOT NULL DEFAULT 0,
  filled INTEGER NOT NULL DEFAULT 0,
  session_type TEXT NOT NULL DEFAULT 'Mandatory' CHECK (session_type IN ('Mandatory', 'Refresher', 'Voluntary')),
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Tentative', 'Cancelled')),
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE training_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_schedules_select_department"
  ON training_schedules FOR SELECT
  TO authenticated
  USING (has_department_access(training_schedules.department_id));

CREATE POLICY "training_schedules_insert_department"
  ON training_schedules FOR INSERT
  TO authenticated
  WITH CHECK (has_department_access(training_schedules.department_id));

CREATE POLICY "training_schedules_update_department"
  ON training_schedules FOR UPDATE
  TO authenticated
  USING (has_department_access(training_schedules.department_id));

CREATE POLICY "training_schedules_delete_department"
  ON training_schedules FOR DELETE
  TO authenticated
  USING (has_department_access(training_schedules.department_id));

CREATE INDEX IF NOT EXISTS idx_training_schedules_dept_date
  ON training_schedules(department_id, session_date);

CREATE TRIGGER update_training_schedules_updated_at
  BEFORE UPDATE ON training_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Update RLS on fleet table to include logistics role
-- ============================================
DROP POLICY IF EXISTS "Allow access control read fleet" ON fleet;
CREATE POLICY "Allow access control read fleet" ON fleet
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.role = 'access_control' OR e.role = 'logistics' OR e.department_id = fleet.department_id)
    )
  );

DROP POLICY IF EXISTS "Allow access control insert fleet" ON fleet;
CREATE POLICY "Allow access control insert fleet" ON fleet
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'logistics', 'admin'))
  );

DROP POLICY IF EXISTS "Allow access control update fleet" ON fleet;
CREATE POLICY "Allow access control update fleet" ON fleet
  FOR UPDATE TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'logistics', 'admin'))
  );

DROP POLICY IF EXISTS "Allow access control delete fleet" ON fleet;
CREATE POLICY "Allow access control delete fleet" ON fleet
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'logistics', 'admin'))
  );

-- ============================================
-- 9. Seed data
-- ============================================

-- Environmental readings (Environment)
INSERT INTO environmental_readings (department_id, reading_date, reading_type, value, unit, location, status, notes)
SELECT d.id, v.reading_date, v.reading_type, v.value, v.unit, v.location, v.status, v.notes
FROM departments d
CROSS JOIN (VALUES
  (CURRENT_DATE - 1, 'dust',      0.42, 'mg/m3', 'Main Pit - Drill Floor', 'within-limit',   'Routine daily dust sample'),
  (CURRENT_DATE - 1, 'water',     6.8,  'pH',    'South Pit - Settling Dam', 'within-limit', 'pH within statutory range'),
  (CURRENT_DATE - 1, 'noise',     82.5, 'dB(A)', 'Crusher Station',       'within-limit',   'Peak blasting period sample'),
  (CURRENT_DATE - 2, 'emissions', 18.2, 'ppm',   'Wash Plant Stack 1',    'within-limit',   'CO2 continuous monitor'),
  (CURRENT_DATE - 2, 'dust',      0.61, 'mg/m3', 'Haul Road North',       'exceeded',       'Dry conditions - water cart dispatched'),
  (CURRENT_DATE - 3, 'weather',   31.4, '°C',    'Main Pit',              'within-limit',   'Ambient temperature log'),
  (CURRENT_DATE - 3, 'water',     118,  'mg/L',  'Brakfontein Stream',    'under-investigation', 'Suspended solids follow-up required'),
  (CURRENT_DATE - 4, 'noise',     74.1, 'dB(A)', 'Admin Block',           'within-limit',   'Background noise survey')
) AS v(reading_date, reading_type, value, unit, location, status, notes)
WHERE d.name = 'environment'
ON CONFLICT DO NOTHING;

-- Survey measurements (Geology & Survey)
INSERT INTO survey_measurements (department_id, survey_date, survey_type, block_id, location, measurement_value, unit, notes)
SELECT d.id, v.survey_date, v.survey_type, mb.id, v.location, v.measurement_value, v.unit, v.notes
FROM departments d
CROSS JOIN (VALUES
  (CURRENT_DATE - 1, 'topographic', 'BLK-A-N', 'Block A North', 12.45, 'm³', 'Post-blast topographic pick-up'),
  (CURRENT_DATE - 1, 'grade',       'BLK-A-S', 'Block A South', 1.85,  't/m³', 'In-situ grade control sample'),
  (CURRENT_DATE - 2, 'volume',      'BLK-B-E', 'Block B East',   8450, 'm³', 'Weekly volume reconciliation'),
  (CURRENT_DATE - 2, 'peg-out',     'BLK-B-W', 'Block B West',   32,   'pegs', 'Blast hole peg-out complete'),
  (CURRENT_DATE - 3, 'monitoring',  'STOCK-A', 'Stockpile A',    4.2,  'm',   'Stockpile crest height check'),
  (CURRENT_DATE - 5, 'topographic', 'WASH-A',  'Wash Plant Area', 2200, 'm³', 'Pad level survey')
) AS v(survey_date, survey_type, block_code, location, measurement_value, unit, notes)
JOIN mine_blocks mb ON mb.code = v.block_code
WHERE d.name = 'geology'
ON CONFLICT DO NOTHING;

-- Tires (Engineering)
INSERT INTO tires (department_id, fleet_id, machine_name, position, size, tread_depth_mm, pressure_psi, status, installed_at, notes)
SELECT d.id, f.id, f.fleet_code, v.position, v.size, v.tread_depth_mm, v.pressure_psi, v.status, v.installed_at, v.notes
FROM departments d
CROSS JOIN (VALUES
  ('DT12', 'FL', '29.5R25', 38.2, 105, 'active',       '2026-02-10', 'Front-left, good condition'),
  ('DT12', 'FR', '29.5R25', 12.1, 92,  'service-due',  '2025-11-22', 'Tread below 15mm - schedule replacement'),
  ('RDT17', 'RL', '40.00R57', 55.4, 120, 'active',     '2026-01-15', 'Rigid dumper drive axle'),
  ('RDT17', 'RR', '40.00R57', 8.3, 88,  'critical',    '2025-06-30', 'Critical wear - replace before next shift'),
  ('EX10', 'FL', '35/65R33', 26.0, 110, 'active',      '2026-03-05', 'Excavator front set'),
  ('EX10', 'FR', '35/65R33', 27.5, 108, 'active',      '2026-03-05', 'Excavator front set')
) AS v(fleet_code, position, size, tread_depth_mm, pressure_psi, status, installed_at, notes)
JOIN fleet f ON f.fleet_code = v.fleet_code
WHERE d.name = 'engineering'
ON CONFLICT DO NOTHING;

-- Certifications (Training)
INSERT INTO certifications (department_id, employee_name, role, certification, issue_date, expiry_date, notes)
SELECT d.id, v.employee_name, v.role, v.certification, v.issue_date, v.expiry_date, v.notes
FROM departments d
CROSS JOIN (VALUES
  ('Jared Leto',    'Drill Operator',        'Class A Rig Telemetry',            '2025-05-28', '2027-05-28', 'Renewal reminder set'),
  ('Sarah Connor',  'Safety Inspector',      'Advanced First Aid & Rescue',      '2025-05-26', '2026-08-20', 'Expires soon - book refresher'),
  ('Mark Ronson',   'Haul Dumper Pilot',     'HD-785 Mechanical Induction',      '2025-05-25', '2026-08-28', 'Expires soon'),
  ('Elena Rostova', 'Excavator Operator',    'PC-2000 Operation & Maintenance',  '2025-05-22', '2027-05-22', NULL),
  ('Peter Parker',  'Electrical Specialist', 'High Voltage Site Isolation',      '2024-03-10', '2026-03-10', 'EXPIRED - retraining required'),
  ('Bruce Wayne',   'Site Supervisor',       'Mine Safety Act Compliance',       '2025-01-15', '2028-01-15', NULL),
  ('Diana Prince',  'Environmental Engineer','Hazardous Dust Mitigation',        '2025-11-20', '2026-11-20', NULL),
  ('Clark Kent',    'Heavy Equipment Mech',  'Hydraulic Systems Diagnosis',      '2024-09-12', '2026-09-12', NULL)
) AS v(employee_name, role, certification, issue_date, expiry_date, notes)
WHERE d.name = 'training'
ON CONFLICT DO NOTHING;

-- Training courses (Training)
INSERT INTO training_courses (department_id, title, category, description, lessons, duration_minutes, level, enrolled_count, completion_rate)
SELECT d.id, v.title, v.category, v.description, v.lessons, v.duration_minutes, v.level, v.enrolled, v.completion_rate
FROM departments d
CROSS JOIN (VALUES
  ('Underground Equipment Safety V2', 'Safety',     'Standard safety protocols for operating equipment in high-risk underground extraction areas.', 8,  270, 'Intermediate', 24, 88),
  ('HAZMAT & Chemical Handling',      'Safety',     'Regulatory compliance and emergency drills for managing site chemicals and hazardous wastes.', 6,  195, 'Advanced',     15, 92),
  ('PC-2000 Operation & Maintenance', 'Equipment',  'Detailed system walk-around, hydraulic telemetry, and advanced operation methods for Komatsu PC-2000.', 12, 480, 'Advanced',     9,  75),
  ('HD-785 Haul Dumper Induction',    'Equipment',  'In-cab simulation, braking physics, loading alignment, and daily inspection checklists for HD-785 dumps.', 10, 405, 'Intermediate', 18, 83),
  ('Refresher: Excavator Ops',        'Equipment',  'Refresher module covering excavator pre-start, safe digging procedures and emergency shutdown.', 4, 150, 'Intermediate', 5, 70),
  ('Mine Site General Induction',     'Induction',  'Mandatory general entry induction briefing covering core policies, safety controls, and facility layouts.', 5,  120, 'Basic',        32, 100),
  ('High-Voltage Isolation Protocols','Compliance', 'LOTO procedures, electrical shock risk matrices, and multi-point panel isolation operations.', 9,  330, 'Advanced',     7,  60)
) AS v(title, category, description, lessons, duration_minutes, level, enrolled, completion_rate)
WHERE d.name = 'training'
ON CONFLICT DO NOTHING;

-- Training schedules (Training) - courses reference by title
INSERT INTO training_schedules (department_id, course_id, course_name, location, session_date, start_time, end_time, instructor, capacity, filled, session_type, status)
SELECT d.id, c.id, c.title, v.location, v.session_date, v.start_time, v.end_time, v.instructor, v.capacity, v.filled, v.session_type, v.status
FROM departments d
CROSS JOIN (VALUES
  ('Underground Equipment Safety V2', 'South Pit Simulator & Training Suite B', CURRENT_DATE + 2, '08:00', '12:00', 'Sarah Jenkins', 15, 14, 'Mandatory', 'Confirmed'),
  ('HAZMAT & Chemical Handling',      'Main Boardroom (Admin Block)',           CURRENT_DATE + 2, '10:30', '13:00', 'David Vance',   10, 8,  'Mandatory', 'Confirmed'),
  ('Refresher: Excavator Ops',        'North Quarry Excavation Field',          CURRENT_DATE + 3, '14:00', '16:30', 'Marcus Stone',  6,  5,  'Refresher',  'Confirmed'),
  ('First Aid & Emergency Response', 'Emergency Response Hub - Training Lab',  CURRENT_DATE + 5, '09:00', '17:00', 'Dr. Amanda Ross', 12, 12, 'Mandatory', 'Confirmed'),
  ('HD-785 Haul Dumper Induction',    'Workshop Bay 4 Training Deck',           CURRENT_DATE + 7, '13:00', '16:00', 'Toby Miller',   8,  3,  'Refresher',  'Tentative'),
  ('PC-2000 Operation & Maintenance', 'Training Room A (E-Learning Wing)',      CURRENT_DATE + 9, '10:00', '11:30', 'Jared Leto',    20, 16, 'Voluntary',  'Confirmed')
) AS v(course_title, location, session_date, start_time, end_time, instructor, capacity, filled, session_type, status)
JOIN training_courses c ON c.title = v.course_title
WHERE d.name = 'training'
ON CONFLICT DO NOTHING;