-- ============================================
-- Migration 076: Department enrichment tables
-- Adds rich operational tables for all 13 departments
-- ============================================

-- ============================================
-- 1. Drill Patterns (Drilling department)
-- ============================================
CREATE TABLE IF NOT EXISTS drill_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  block_id UUID REFERENCES mine_blocks(id) ON DELETE SET NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('square', 'staggered', 'triangular', 'custom')),
  burden_m NUMERIC NOT NULL DEFAULT 0,
  spacing_m NUMERIC NOT NULL DEFAULT 0,
  hole_depth_m NUMERIC NOT NULL DEFAULT 0,
  hole_diameter_mm NUMERIC NOT NULL DEFAULT 0,
  sub_drill_m NUMERIC NOT NULL DEFAULT 0,
  stemming_m NUMERIC NOT NULL DEFAULT 0,
  powder_factor NUMERIC,
  total_holes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'drilling', 'completed', 'cancelled')),
  designed_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE drill_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drill_patterns_select_department" ON drill_patterns FOR SELECT TO authenticated USING (has_department_access(drill_patterns.department_id));
CREATE POLICY "drill_patterns_insert_department" ON drill_patterns FOR INSERT TO authenticated WITH CHECK (has_department_access(drill_patterns.department_id));
CREATE POLICY "drill_patterns_update_department" ON drill_patterns FOR UPDATE TO authenticated USING (has_department_access(drill_patterns.department_id));
CREATE POLICY "drill_patterns_delete_department" ON drill_patterns FOR DELETE TO authenticated USING (has_department_access(drill_patterns.department_id));
CREATE INDEX idx_drill_patterns_dept_status ON drill_patterns(department_id, status);
CREATE TRIGGER update_drill_patterns_updated_at BEFORE UPDATE ON drill_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Blast Designs (Drilling department)
-- ============================================
CREATE TABLE IF NOT EXISTS blast_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  blast_name TEXT NOT NULL,
  pattern_id UUID REFERENCES drill_patterns(id) ON DELETE SET NULL,
  block_id UUID REFERENCES mine_blocks(id) ON DELETE SET NULL,
  blast_date DATE,
  designed_holes INTEGER NOT NULL DEFAULT 0,
  actual_holes INTEGER,
  designed_tonnes NUMERIC,
  actual_tonnes NUMERIC,
  explosive_type TEXT,
  total_explosive_kg NUMERIC,
  status TEXT NOT NULL DEFAULT 'designed' CHECK (status IN ('designed', 'loaded', 'fired', 'mucked', 'reviewed', 'cancelled')),
  designed_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE blast_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blast_designs_select_department" ON blast_designs FOR SELECT TO authenticated USING (has_department_access(blast_designs.department_id));
CREATE POLICY "blast_designs_insert_department" ON blast_designs FOR INSERT TO authenticated WITH CHECK (has_department_access(blast_designs.department_id));
CREATE POLICY "blast_designs_update_department" ON blast_designs FOR UPDATE TO authenticated USING (has_department_access(blast_designs.department_id));
CREATE POLICY "blast_designs_delete_department" ON blast_designs FOR DELETE TO authenticated USING (has_department_access(blast_designs.department_id));
CREATE INDEX idx_blast_designs_dept_status ON blast_designs(department_id, status);
CREATE TRIGGER update_blast_designs_updated_at BEFORE UPDATE ON blast_designs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Grade Control Samples (Production / Geology)
-- ============================================
CREATE TABLE IF NOT EXISTS grade_control_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  sample_date DATE NOT NULL,
  sample_type TEXT NOT NULL CHECK (sample_type IN ('blast-hole', 'chip', 'channel', 'ROM', 'sale')),
  block_id UUID REFERENCES mine_blocks(id) ON DELETE SET NULL,
  location TEXT,
  ash_pct NUMERIC,
  sulphur_pct NUMERIC,
  calorific_value NUMERIC,
  moisture_pct NUMERIC,
  volatile_matter_pct NUMERIC,
  seam TEXT,
  sample_weight_kg NUMERIC,
  sampled_by UUID REFERENCES employees(id),
  lab_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-lab', 'results-received', 'reviewed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE grade_control_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grade_control_select_department" ON grade_control_samples FOR SELECT TO authenticated USING (has_department_access(grade_control_samples.department_id));
CREATE POLICY "grade_control_insert_department" ON grade_control_samples FOR INSERT TO authenticated WITH CHECK (has_department_access(grade_control_samples.department_id));
CREATE POLICY "grade_control_update_department" ON grade_control_samples FOR UPDATE TO authenticated USING (has_department_access(grade_control_samples.department_id));
CREATE INDEX idx_grade_control_dept_date ON grade_control_samples(department_id, sample_date DESC);
CREATE TRIGGER update_grade_control_updated_at BEFORE UPDATE ON grade_control_samples FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Safety Observations (Safety department)
-- ============================================
CREATE TABLE IF NOT EXISTS safety_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  observation_date DATE NOT NULL,
  observation_type TEXT NOT NULL CHECK (observation_type IN ('safe-act', 'unsafe-act', 'unsafe-condition', 'good-catch', 'hazard-report')),
  description TEXT NOT NULL,
  location TEXT,
  observed_by UUID REFERENCES employees(id),
  assigned_to UUID REFERENCES employees(id),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  corrective_action TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'closed', 'closed-verified')),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE safety_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "safety_observations_select_department" ON safety_observations FOR SELECT TO authenticated USING (has_department_access(safety_observations.department_id));
CREATE POLICY "safety_observations_insert_department" ON safety_observations FOR INSERT TO authenticated WITH CHECK (has_department_access(safety_observations.department_id));
CREATE POLICY "safety_observations_update_department" ON safety_observations FOR UPDATE TO authenticated USING (has_department_access(safety_observations.department_id));
CREATE INDEX idx_safety_observations_dept_status ON safety_observations(department_id, status);
CREATE TRIGGER update_safety_observations_updated_at BEFORE UPDATE ON safety_observations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Job Safety Analysis (JSA) — Safety
-- ============================================
CREATE TABLE IF NOT EXISTS job_safety_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  jsa_number TEXT NOT NULL,
  job_description TEXT NOT NULL,
  location TEXT,
  prepared_by UUID REFERENCES employees(id),
  reviewed_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  hazards_identified INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'superseded')),
  valid_from DATE NOT NULL,
  valid_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_safety_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jsa_select_department" ON job_safety_analyses FOR SELECT TO authenticated USING (has_department_access(job_safety_analyses.department_id));
CREATE POLICY "jsa_insert_department" ON job_safety_analyses FOR INSERT TO authenticated WITH CHECK (has_department_access(job_safety_analyses.department_id));
CREATE POLICY "jsa_update_department" ON job_safety_analyses FOR UPDATE TO authenticated USING (has_department_access(job_safety_analyses.department_id));
CREATE INDEX idx_jsa_dept_status ON job_safety_analyses(department_id, status);
CREATE TRIGGER update_jsa_updated_at BEFORE UPDATE ON job_safety_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Training Trainees (Training)
-- ============================================
CREATE TABLE IF NOT EXISTS training_trainees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  role TEXT,
  enrolled_date DATE NOT NULL,
  last_activity_date DATE,
  courses_completed INTEGER NOT NULL DEFAULT 0,
  courses_in_progress INTEGER NOT NULL DEFAULT 0,
  total_hours_logged NUMERIC NOT NULL DEFAULT 0,
  avg_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'graduated')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE training_trainees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_trainees_select_department" ON training_trainees FOR SELECT TO authenticated USING (has_department_access(training_trainees.department_id));
CREATE POLICY "training_trainees_insert_department" ON training_trainees FOR INSERT TO authenticated WITH CHECK (has_department_access(training_trainees.department_id));
CREATE POLICY "training_trainees_update_department" ON training_trainees FOR UPDATE TO authenticated USING (has_department_access(training_trainees.department_id));
CREATE INDEX idx_training_trainees_dept_status ON training_trainees(department_id, status);
CREATE TRIGGER update_training_trainees_updated_at BEFORE UPDATE ON training_trainees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Training Instructor Assignments (Training)
-- ============================================
CREATE TABLE IF NOT EXISTS training_instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  instructor_name TEXT NOT NULL,
  specialization TEXT,
  certifications TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  max_concurrent_sessions INTEGER NOT NULL DEFAULT 3,
  current_sessions INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE training_instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_instructors_select_department" ON training_instructors FOR SELECT TO authenticated USING (has_department_access(training_instructors.department_id));
CREATE POLICY "training_instructors_insert_department" ON training_instructors FOR INSERT TO authenticated WITH CHECK (has_department_access(training_instructors.department_id));
CREATE POLICY "training_instructors_update_department" ON training_instructors FOR UPDATE TO authenticated USING (has_department_access(training_instructors.department_id));
CREATE INDEX idx_training_instructors_dept ON training_instructors(department_id, active);
CREATE TRIGGER update_training_instructors_updated_at BEFORE UPDATE ON training_instructors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Training Archived Documents (Training)
-- ============================================
CREATE TABLE IF NOT EXISTS training_archived_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('certificate', 'training-record', 'course-material', 'assessment', 'compliance-report', 'other')),
  employee_name TEXT,
  file_url TEXT,
  file_size_bytes INTEGER,
  archived_by UUID REFERENCES employees(id),
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE training_archived_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_docs_select_department" ON training_archived_documents FOR SELECT TO authenticated USING (has_department_access(training_archived_documents.department_id));
CREATE POLICY "training_docs_insert_department" ON training_archived_documents FOR INSERT TO authenticated WITH CHECK (has_department_access(training_archived_documents.department_id));
CREATE INDEX idx_training_docs_dept_type ON training_archived_documents(department_id, document_type);
CREATE INDEX idx_training_docs_archived_at ON training_archived_documents(department_id, archived_at DESC);

-- ============================================
-- 9. Environmental Incidents (Environment)
-- ============================================
CREATE TABLE IF NOT EXISTS environmental_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('spill', 'emission-exceedance', 'water-contamination', 'waste-violation', 'biodiversity', 'complaint', 'other')),
  description TEXT NOT NULL,
  location TEXT,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  root_cause TEXT,
  corrective_action TEXT,
  reported_by UUID REFERENCES employees(id),
  regulatory_notified BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE environmental_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "env_incidents_select_department" ON environmental_incidents FOR SELECT TO authenticated USING (has_department_access(environmental_incidents.department_id));
CREATE POLICY "env_incidents_insert_department" ON environmental_incidents FOR INSERT TO authenticated WITH CHECK (has_department_access(environmental_incidents.department_id));
CREATE POLICY "env_incidents_update_department" ON environmental_incidents FOR UPDATE TO authenticated USING (has_department_access(environmental_incidents.department_id));
CREATE INDEX idx_env_incidents_dept_status ON environmental_incidents(department_id, status);
CREATE TRIGGER update_env_incidents_updated_at BEFORE UPDATE ON environmental_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. Fleet Maintenance Schedule (Logistics)
-- ============================================
CREATE TABLE IF NOT EXISTS fleet_maintenance_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  fleet_id UUID REFERENCES fleet(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('daily-check', 'weekly', 'monthly', 'quarterly', 'annual', 'major-overhaul')),
  description TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  assigned_to UUID REFERENCES employees(id),
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  parts_used TEXT[],
  cost_estimate NUMERIC,
  actual_cost NUMERIC,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE fleet_maintenance_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fleet_maint_select_department" ON fleet_maintenance_schedule FOR SELECT TO authenticated USING (has_department_access(fleet_maintenance_schedule.department_id));
CREATE POLICY "fleet_maint_insert_department" ON fleet_maintenance_schedule FOR INSERT TO authenticated WITH CHECK (has_department_access(fleet_maintenance_schedule.department_id));
CREATE POLICY "fleet_maint_update_department" ON fleet_maintenance_schedule FOR UPDATE TO authenticated USING (has_department_access(fleet_maintenance_schedule.department_id));
CREATE INDEX idx_fleet_maint_dept_date ON fleet_maintenance_schedule(department_id, scheduled_date);
CREATE TRIGGER update_fleet_maint_updated_at BEFORE UPDATE ON fleet_maintenance_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. Survey Plans (Geology)
-- ============================================
CREATE TABLE IF NOT EXISTS survey_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  block_id UUID REFERENCES mine_blocks(id) ON DELETE SET NULL,
  survey_type TEXT NOT NULL CHECK (survey_type IN ('topographic', 'control', 'cadastral', 'as-built', 'monitoring')),
  planned_date DATE,
  completed_date DATE,
  area_size_ha NUMERIC,
  point_count INTEGER,
  accuracy_requirement TEXT,
  assigned_surveyor UUID REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE survey_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "survey_plans_select_department" ON survey_plans FOR SELECT TO authenticated USING (has_department_access(survey_plans.department_id));
CREATE POLICY "survey_plans_insert_department" ON survey_plans FOR INSERT TO authenticated WITH CHECK (has_department_access(survey_plans.department_id));
CREATE POLICY "survey_plans_update_department" ON survey_plans FOR UPDATE TO authenticated USING (has_department_access(survey_plans.department_id));
CREATE INDEX idx_survey_plans_dept_status ON survey_plans(department_id, status);
CREATE TRIGGER update_survey_plans_updated_at BEFORE UPDATE ON survey_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. Admin Audit Trail (Admin)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  performed_by UUID REFERENCES employees(id),
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_audit_select_department" ON admin_audit_trail FOR SELECT TO authenticated USING (has_department_access(admin_audit_trail.department_id));
CREATE POLICY "admin_audit_insert_department" ON admin_audit_trail FOR INSERT TO authenticated WITH CHECK (has_department_access(admin_audit_trail.department_id));
CREATE INDEX idx_admin_audit_dept_created ON admin_audit_trail(department_id, created_at DESC);
CREATE INDEX idx_admin_audit_entity ON admin_audit_trail(entity_type, entity_id);

-- ============================================
-- 13. Access Card Print History (Access Card Actions)
-- ============================================
CREATE TABLE IF NOT EXISTS card_print_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('personnel', 'visitor', 'contractor', 'temporary')),
  badge_id UUID REFERENCES badges(id) ON DELETE SET NULL,
  printed_by UUID REFERENCES employees(id),
  printer_name TEXT,
  print_status TEXT NOT NULL DEFAULT 'pending' CHECK (print_status IN ('pending', 'printing', 'completed', 'failed', 're-printed')),
  qr_code TEXT,
  notes TEXT,
  printed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE card_print_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "card_print_history_select_department" ON card_print_history FOR SELECT TO authenticated USING (has_department_access(card_print_history.department_id));
CREATE POLICY "card_print_history_insert_department" ON card_print_history FOR INSERT TO authenticated WITH CHECK (has_department_access(card_print_history.department_id));
CREATE INDEX idx_card_print_history_dept ON card_print_history(department_id, printed_at DESC);

-- ============================================
-- 14. Satellite Monitoring Alerts (Satellite)
-- ============================================
CREATE TABLE IF NOT EXISTS satellite_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('deformation', 'subsidence', 'slope-movement', 'water-accumulation', 'vegetation-change', 'thermal')),
  source TEXT NOT NULL CHECK (source IN ('SAR', 'InSAR', 'hyperspectral', 'optical', 'thermal')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location JSONB,
  confidence_pct NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE satellite_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "satellite_alerts_select_department" ON satellite_alerts FOR SELECT TO authenticated USING (has_department_access(satellite_alerts.department_id));
CREATE POLICY "satellite_alerts_insert_department" ON satellite_alerts FOR INSERT TO authenticated WITH CHECK (has_department_access(satellite_alerts.department_id));
CREATE INDEX idx_satellite_alerts_dept_type ON satellite_alerts(department_id, alert_type, detected_at DESC);

-- ============================================
-- 15. Seed data for enrichment
-- ============================================

-- Drill patterns (Drilling)
INSERT INTO drill_patterns (department_id, pattern_name, block_id, pattern_type, burden_m, spacing_m, hole_depth_m, hole_diameter_mm, sub_drill_m, stemming_m, total_holes, status)
SELECT d.id, v.pattern_name, mb.id, v.pattern_type, v.burden_m, v.spacing_m, v.hole_depth_m, v.hole_diameter_mm, v.sub_drill_m, v.stemming_m, v.total_holes, v.status
FROM departments d
CROSS JOIN (VALUES
  ('Main Pit Production A', 'BLK-A-N', 'square', 6.0, 7.0, 12.0, 165, 1.5, 4.0, 48, 'approved'),
  ('South Bench Extension', 'BLK-B-E', 'staggered', 5.5, 6.5, 10.0, 150, 1.2, 3.5, 36, 'drilling'),
  ('West Wall Pre-split', 'BLK-B-W', 'triangular', 4.0, 4.5, 14.0, 200, 2.0, 5.0, 24, 'draft')
) AS v(pattern_name, block_code, pattern_type, burden_m, spacing_m, hole_depth_m, hole_diameter_mm, sub_drill_m, stemming_m, total_holes, status)
LEFT JOIN mine_blocks mb ON mb.code = v.block_code
WHERE d.name = 'drilling'
ON CONFLICT DO NOTHING;

-- Blast designs (Drilling)
INSERT INTO blast_designs (department_id, blast_name, block_id, designed_holes, designed_tonnes, status)
SELECT d.id, v.blast_name, mb.id, v.designed_holes, v.designed_tonnes, v.status
FROM departments d
CROSS JOIN (VALUES
  ('Main Pit Blast #142', 'BLK-A-N', 48, 24500, 'designed'),
  ('South Bench #87', 'BLK-B-E', 36, 18200, 'loaded'),
  ('West Wall Trim #12', 'BLK-B-W', 24, 9800, 'fired')
) AS v(blast_name, block_code, designed_holes, designed_tonnes, status)
LEFT JOIN mine_blocks mb ON mb.code = v.block_code
WHERE d.name = 'drilling'
ON CONFLICT DO NOTHING;

-- Grade control samples (Production)
INSERT INTO grade_control_samples (department_id, sample_date, sample_type, ash_pct, sulphur_pct, calorific_value, moisture_pct, status)
SELECT d.id, v.sample_date, v.sample_type, v.ash_pct, v.sulphur_pct, v.calorific_value, v.moisture_pct, v.status
FROM departments d
CROSS JOIN (VALUES
  (CURRENT_DATE - 1, 'blast-hole', 22.4, 0.8, 5400, 8.2, 'results-received'),
  (CURRENT_DATE - 1, 'blast-hole', 21.8, 0.7, 5550, 7.9, 'results-received'),
  (CURRENT_DATE - 2, 'chip', 24.1, 1.2, 5100, 9.1, 'in-lab'),
  (CURRENT_DATE - 3, 'channel', 18.5, 0.5, 5900, 6.8, 'reviewed'),
  (CURRENT_DATE - 5, 'ROM', 20.2, 0.6, 5700, 7.5, 'reviewed')
) AS v(sample_date, sample_type, ash_pct, sulphur_pct, calorific_value, moisture_pct, status)
WHERE d.name = 'production'
ON CONFLICT DO NOTHING;

-- Safety observations (Safety)
INSERT INTO safety_observations (department_id, observation_date, observation_type, description, location, risk_level, status)
SELECT d.id, v.observation_date, v.observation_type, v.description, v.location, v.risk_level, v.status
FROM departments d
CROSS JOIN (VALUES
  (CURRENT_DATE - 1, 'safe-act', 'Operator completed full pre-start inspection before shift', 'Main Pit - EX10', 'low', 'closed'),
  (CURRENT_DATE - 1, 'unsafe-condition', 'Guard rail missing on walkway near crusher', 'Crusher Station Level 2', 'high', 'in-progress'),
  (CURRENT_DATE - 2, 'good-catch', 'Spotter identified approaching vehicle while reversing', 'Haul Road North Junction', 'medium', 'closed'),
  (CURRENT_DATE - 3, 'unsafe-act', 'Personnel observed working without gloves in chemical storage', 'Chem Store - Admin Block', 'medium', 'closed'),
  (CURRENT_DATE - 4, 'hazard-report', 'Poor lighting on night shift at workshop bay entrance', 'Workshop Bay 3', 'low', 'open')
) AS v(observation_date, observation_type, description, location, risk_level, status)
WHERE d.name = 'safety'
ON CONFLICT DO NOTHING;

-- Job safety analyses (Safety)
INSERT INTO job_safety_analyses (department_id, jsa_number, job_description, location, hazards_identified, risk_level, status, valid_from, valid_to)
SELECT d.id, v.jsa_number, v.job_description, v.location, v.hazards_identified, v.risk_level, v.status, v.valid_from, v.valid_to
FROM departments d
CROSS JOIN (VALUES
  ('JSA-2026-001', 'Crusher Maintenance - Lockout/Tagout', 'Crusher Station', 8, 'critical', 'approved', '2026-01-15', '2026-07-15'),
  ('JSA-2026-002', 'Blast Area Clearance & Firing Procedure', 'Main Pit', 6, 'high', 'approved', '2026-02-01', '2026-08-01'),
  ('JSA-2026-003', 'Fuel Bowser Refuelling Operations', 'Fuel Bay', 4, 'medium', 'reviewed', '2026-03-01', '2026-09-01'),
  ('JSA-2026-004', 'Suspended Load - Crane Lifting Operations', 'Workshop Bay 2', 7, 'critical', 'draft', '2026-04-01', '2026-10-01')
) AS v(jsa_number, job_description, location, hazards_identified, risk_level, status, valid_from, valid_to)
WHERE d.name = 'safety'
ON CONFLICT DO NOTHING;

-- Training trainees (Training)
INSERT INTO training_trainees (department_id, employee_name, role, enrolled_date, courses_completed, courses_in_progress, total_hours_logged, avg_score, status)
SELECT d.id, v.employee_name, v.role, v.enrolled_date, v.courses_completed, v.courses_in_progress, v.total_hours_logged, v.avg_score, v.status
FROM departments d
CROSS JOIN (VALUES
  ('Jared Leto', 'Drill Operator', '2025-06-01', 4, 2, 48, 87, 'active'),
  ('Sarah Connor', 'Safety Inspector', '2025-01-15', 8, 1, 96, 94, 'active'),
  ('Mark Ronson', 'Haul Dumper Pilot', '2025-08-10', 3, 1, 36, 82, 'active'),
  ('Elena Rostova', 'Excavator Operator', '2025-03-22', 6, 0, 72, 91, 'active'),
  ('Peter Parker', 'Electrical Specialist', '2024-02-15', 12, 0, 144, 78, 'graduated'),
  ('Bruce Wayne', 'Site Supervisor', '2025-01-01', 10, 2, 120, 96, 'active'),
  ('Diana Prince', 'Environmental Engineer', '2025-09-01', 2, 3, 42, 88, 'active'),
  ('Clark Kent', 'Heavy Equipment Mech', '2024-11-01', 7, 0, 84, 85, 'graduated')
) AS v(employee_name, role, enrolled_date, courses_completed, courses_in_progress, total_hours_logged, avg_score, status)
WHERE d.name = 'training'
ON CONFLICT DO NOTHING;

-- Training instructors (Training)
INSERT INTO training_instructors (department_id, instructor_name, specialization, certifications, max_concurrent_sessions, current_sessions, rating)
SELECT d.id, v.instructor_name, v.specialization, v.certifications, v.max_concurrent_sessions, v.current_sessions, v.rating
FROM departments d
CROSS JOIN (VALUES
  ('Sarah Jenkins', 'Equipment Safety', ARRAY['Train-the-Trainer', 'Advanced Safety', 'Rig Operations'], 4, 3, 4.8),
  ('David Vance', 'HAZMAT & Chemical', ARRAY['HAZMAT Instructor', 'Chemical Safety', 'Emergency Response'], 3, 2, 4.6),
  ('Marcus Stone', 'Excavator Operations', ARRAY['Heavy Equipment Trainer', 'PC-2000 Certified'], 2, 1, 4.9),
  ('Dr. Amanda Ross', 'First Aid & Emergency', ARRAY['Advanced First Aid Instructor', 'CPR Trainer', 'Emergency Response Coordinator'], 3, 1, 4.7),
  ('Toby Miller', 'Haul Truck Operations', ARRAY['HD-785 Certified', 'Fleet Trainer', 'Defensive Driving'], 3, 1, 4.5)
) AS v(instructor_name, specialization, certifications, max_concurrent_sessions, current_sessions, rating)
WHERE d.name = 'training'
ON CONFLICT DO NOTHING;

-- Training archived documents (Training)
INSERT INTO training_archived_documents (department_id, document_name, document_type, employee_name, notes)
SELECT d.id, v.document_name, v.document_type, v.employee_name, v.notes
FROM departments d
CROSS JOIN (VALUES
  ('Certificate_HV_Isolation_PeterParker_2026.pdf', 'certificate', 'Peter Parker', 'High Voltage Isolation - Complete'),
  ('Training_Record_HD785_MarkRonson_Q1_2026.pdf', 'training-record', 'Mark Ronson', 'Q1 2026 HD-785 refresher completed'),
  ('Course_Material_Underground_Safety_V2.pdf', 'course-material', NULL, 'Version 2 of the underground safety module'),
  ('Assessment_Excavator_Ops_ElenaRostova.pdf', 'assessment', 'Elena Rostova', 'PC-2000 operational assessment - Passed 91%'),
  ('Compliance_Report_Q1_2026_Training.pdf', 'compliance-report', NULL, 'Quarterly training compliance summary'),
  ('Certificate_FirstAid_SarahConnor_2026.pdf', 'certificate', 'Sarah Connor', 'Advanced First Aid recertification'),
  ('Training_Record_Induction_BruceWayne.pdf', 'training-record', 'Bruce Wayne', 'Site supervisor induction record')
) AS v(document_name, document_type, employee_name, notes)
WHERE d.name = 'training'
ON CONFLICT DO NOTHING;

-- Environmental incidents (Environment)
INSERT INTO environmental_incidents (department_id, incident_date, incident_type, description, location, severity, status)
SELECT d.id, v.incident_date, v.incident_type, v.description, v.location, v.severity, v.status
FROM departments d
CROSS JOIN (VALUES
  (CURRENT_DATE - 5, 'spill', 'Hydraulic oil spill from excavator hose burst', 'EX10 - Main Pit Floor', 'moderate', 'resolved'),
  (CURRENT_DATE - 12, 'emission-exceedance', 'Dust exceedance at haul road north - 30min average above limit', 'Haul Road North', 'minor', 'closed'),
  (CURRENT_DATE - 20, 'water-contamination', 'Suspended solids detected in Brakfontein Stream above trigger level', 'Brakfontein Stream', 'moderate', 'investigating'),
  (CURRENT_DATE - 45, 'complaint', 'Community noise complaint regarding blasting hours', 'South Pit Boundary', 'minor', 'resolved')
) AS v(incident_date, incident_type, description, location, severity, status)
WHERE d.name = 'environment'
ON CONFLICT DO NOTHING;

-- Fleet maintenance schedule (Logistics)
INSERT INTO fleet_maintenance_schedule (department_id, fleet_id, service_type, description, scheduled_date, status)
SELECT d.id, f.id, v.service_type, v.description, v.scheduled_date, v.status
FROM departments d
CROSS JOIN (VALUES
  ('DT12', 'weekly', 'Weekly service - oil, filters, greasing', CURRENT_DATE, 'scheduled'),
  ('RDT17', 'monthly', 'Monthly major inspection - brakes, suspension, hydraulics', CURRENT_DATE + 3, 'scheduled'),
  ('EX10', 'quarterly', 'Quarterly comprehensive - engine, swing, tracks', CURRENT_DATE + 14, 'scheduled'),
  ('DT12', 'annual', 'Annual major overhaul - engine rebuild, transmission', CURRENT_DATE + 60, 'scheduled')
) AS v(fleet_code, service_type, description, scheduled_date, status)
JOIN fleet f ON f.fleet_code = v.fleet_code
WHERE d.name = 'logistics-fleet'
ON CONFLICT DO NOTHING;

-- Survey plans (Geology)
INSERT INTO survey_plans (department_id, plan_name, block_id, survey_type, planned_date, area_size_ha, point_count, status)
SELECT d.id, v.plan_name, mb.id, v.survey_type, v.planned_date, v.area_size_ha, v.point_count, v.status
FROM departments d
CROSS JOIN (VALUES
  ('Main Pit Monthly Topo', 'BLK-A-N', 'topographic', CURRENT_DATE + 2, 12.5, 850, 'planned'),
  ('South Bench Volume Check', 'BLK-B-E', 'volume', CURRENT_DATE + 5, 8.2, 420, 'planned'),
  ('Wash Plant As-Built Survey', 'WASH-A', 'as-built', CURRENT_DATE + 10, 3.1, 200, 'planned'),
  ('Stockpile A Monitoring', 'STOCK-A', 'monitoring', CURRENT_DATE - 5, 4.0, 150, 'completed')
) AS v(plan_name, block_code, survey_type, planned_date, area_size_ha, point_count, status)
LEFT JOIN mine_blocks mb ON mb.code = v.block_code
WHERE d.name = 'geology'
ON CONFLICT DO NOTHING;

-- Card print history (Access Card Actions)
INSERT INTO card_print_history (department_id, employee_name, card_type, print_status, printed_at)
SELECT d.id, v.employee_name, v.card_type, v.print_status, v.printed_at
FROM departments d
CROSS JOIN (VALUES
  ('Thabo Mbeki', 'personnel', 'completed', CURRENT_DATE - 1),
  ('Grace Molefe', 'personnel', 'completed', CURRENT_DATE - 2),
  ('John Contractor', 'contractor', 'completed', CURRENT_DATE - 3),
  ('Site Visitor 2026-04', 'visitor', 'completed', CURRENT_DATE - 5),
  ('Peter Ndlovu', 'personnel', 'failed', CURRENT_DATE - 1)
) AS v(employee_name, card_type, print_status, printed_at)
WHERE d.name = 'access-card-actions'
ON CONFLICT DO NOTHING;

-- Admin audit trail (Admin)
INSERT INTO admin_audit_trail (department_id, action, entity_type, details)
SELECT d.id, v.action, v.entity_type, v.details::jsonb
FROM departments d
CROSS JOIN (VALUES
  ('user.created', 'employee', '{"full_name": "Thabo Mbeki", "role": "operator"}'),
  ('user.role_changed', 'employee', '{"full_name": "Grace Molefe", "from": "operator", "to": "supervisor"}'),
  ('department.updated', 'department', '{"name": "environment", "display_name": "Environment"}'),
  ('shift.created', 'shift', '{"date": "2026-04-07", "shift": "day"}'),
  ('user.deactivated', 'employee', '{"full_name": "John Contractor", "reason": "contract expired"}')
) AS v(action, entity_type, details)
WHERE d.name = 'admin'
ON CONFLICT DO NOTHING;

-- Satellite alerts (Satellite Monitoring)
INSERT INTO satellite_alerts (department_id, alert_type, source, detected_at, confidence_pct, description, severity, reviewed)
SELECT d.id, v.alert_type, v.source, v.detected_at, v.confidence_pct, v.description, v.severity, v.reviewed
FROM departments d
CROSS JOIN (VALUES
  ('deformation', 'InSAR', CURRENT_DATE - 3, 87, '3.2cm deformation detected on Main Pit south wall', 'warning', false),
  ('subsidence', 'SAR', CURRENT_DATE - 5, 92, '2.8cm subsidence in stockpile area', 'warning', true),
  ('slope-movement', 'InSAR', CURRENT_DATE - 7, 78, 'Minor slope movement on west wall - within normal range', 'info', true),
  ('water-accumulation', 'hyperspectral', CURRENT_DATE - 10, 95, 'Water accumulation detected in South Pit sump area', 'info', true),
  ('thermal', 'thermal', CURRENT_DATE - 14, 88, 'Thermal anomaly detected near conveyor belt', 'critical', false)
) AS v(alert_type, source, detected_at, confidence_pct, description, severity, reviewed)
WHERE d.name = 'satellite-monitoring'
ON CONFLICT DO NOTHING;