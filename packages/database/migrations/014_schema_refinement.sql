-- ============================================
-- Schema Refinement: Indexes, Constraints, Security, Comments
-- ============================================

-- ============================================
-- 1. Consolidate Trigger Functions
-- ============================================
-- Drop duplicate breakdowns trigger function; reuse existing
DROP FUNCTION IF EXISTS update_breakdowns_updated_at CASCADE;

DROP TRIGGER IF EXISTS breakdowns_updated_at ON breakdowns;
CREATE TRIGGER breakdowns_updated_at
  BEFORE UPDATE ON breakdowns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Add NUMERIC Precision Constraints
-- ============================================
-- Machine hours
ALTER TABLE machine_hours
  ALTER COLUMN hours_worked TYPE NUMERIC(10,2);

-- Fuel logs
ALTER TABLE fuel_logs
  ALTER COLUMN diesel_litres TYPE NUMERIC(10,2);

-- Production logs
ALTER TABLE production_logs
  ALTER COLUMN coal_tonnes TYPE NUMERIC(12,2),
  ALTER COLUMN waste_tonnes TYPE NUMERIC(12,2);

-- Machine operations
ALTER TABLE machine_operations
  ALTER COLUMN hours_worked TYPE NUMERIC(10,2);

-- Dozer rolls
ALTER TABLE dozer_rolls
  ALTER COLUMN hours_operated TYPE NUMERIC(10,2),
  ALTER COLUMN area_covered_sqm TYPE NUMERIC(12,2),
  ALTER COLUMN material_moved_tonnes TYPE NUMERIC(12,2);

-- Excavator activity
ALTER TABLE excavator_activity
  ALTER COLUMN estimated_tonnes TYPE NUMERIC(12,2);

-- Excavator dumper assignments
ALTER TABLE excavator_dumper_assignments
  ALTER COLUMN total_bcm TYPE NUMERIC(12,2);

-- Machines bin factor
ALTER TABLE machines
  ALTER COLUMN bin_factor TYPE NUMERIC(10,2);

-- ============================================
-- 3. Add CHECK Constraints
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'machines_machine_type_check') THEN
    ALTER TABLE machines ADD CONSTRAINT machines_machine_type_check
      CHECK (machine_type IN (
        'Drill Rig', 'Dump Truck', 'Excavator', 'Generator',
        'Dozer', 'Grader', 'Loader', 'Water Truck', 'Light Vehicle',
        'Compactor', 'Crusher', 'Screen', 'Conveyor', 'Pump',
        'Transformer', 'Switchgear', 'Other'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'operators_role_check') THEN
    ALTER TABLE operators ADD CONSTRAINT operators_role_check
      CHECK (role IN ('operator', 'supervisor', 'trainer', 'relief'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sites_name_unique') THEN
    ALTER TABLE sites ADD CONSTRAINT sites_name_unique UNIQUE (name);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'delay_categories_name_unique') THEN
    ALTER TABLE delay_categories ADD CONSTRAINT delay_categories_name_unique UNIQUE (name);
  END IF;
END $$;

-- ============================================
-- 4. Add Missing updated_at Columns
-- ============================================
-- Reference tables that don't have updated_at
ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE delay_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE mine_blocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE safety_severities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE safety_incident_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Operational tables missing updated_at
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE machine_hours ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE production_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE memory_embeddings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add triggers for updated_at on tables that have the column but no trigger
CREATE OR REPLACE FUNCTION ensure_updated_at_trigger(p_table_name TEXT) RETURNS void AS $$
BEGIN
  EXECUTE format(
    'DROP TRIGGER IF EXISTS %I ON %I; CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
    'update_' || p_table_name || '_updated_at',
    p_table_name,
    'update_' || p_table_name || '_updated_at',
    p_table_name
  );
END;
$$ LANGUAGE plpgsql;

SELECT ensure_updated_at_trigger('departments');
SELECT ensure_updated_at_trigger('employees');
SELECT ensure_updated_at_trigger('machines');
SELECT ensure_updated_at_trigger('sites');
SELECT ensure_updated_at_trigger('operators');
SELECT ensure_updated_at_trigger('delay_categories');
SELECT ensure_updated_at_trigger('report_templates');
SELECT ensure_updated_at_trigger('mine_blocks');
SELECT ensure_updated_at_trigger('safety_severities');
SELECT ensure_updated_at_trigger('safety_incident_categories');
SELECT ensure_updated_at_trigger('daily_logs');
SELECT ensure_updated_at_trigger('machine_hours');
SELECT ensure_updated_at_trigger('fuel_logs');
SELECT ensure_updated_at_trigger('production_logs');
SELECT ensure_updated_at_trigger('generated_reports');

-- operational_delays, engineering_notes, safety_incidents already have updated_at

DROP FUNCTION ensure_updated_at_trigger;

-- ============================================
-- 5. Add Missing Indexes
-- ============================================

-- Operational delays
CREATE INDEX IF NOT EXISTS idx_operational_delays_department ON operational_delays(department_id);
CREATE INDEX IF NOT EXISTS idx_operational_delays_category ON operational_delays(delay_category_id);
CREATE INDEX IF NOT EXISTS idx_operational_delays_machine ON operational_delays(affected_machine_id);
CREATE INDEX IF NOT EXISTS idx_operational_delays_date ON operational_delays(delay_date DESC);
CREATE INDEX IF NOT EXISTS idx_operational_delays_status ON operational_delays(status);
CREATE INDEX IF NOT EXISTS idx_operational_delays_created_by ON operational_delays(created_by);

-- Engineering notes
CREATE INDEX IF NOT EXISTS idx_engineering_notes_department ON engineering_notes(department_id);
CREATE INDEX IF NOT EXISTS idx_engineering_notes_machine ON engineering_notes(machine_id);
CREATE INDEX IF NOT EXISTS idx_engineering_notes_date ON engineering_notes(note_date DESC);
CREATE INDEX IF NOT EXISTS idx_engineering_notes_status ON engineering_notes(status);
CREATE INDEX IF NOT EXISTS idx_engineering_notes_severity ON engineering_notes(severity);
CREATE INDEX IF NOT EXISTS idx_engineering_notes_created_by ON engineering_notes(created_by);

-- Safety incidents
CREATE INDEX IF NOT EXISTS idx_safety_incidents_department ON safety_incidents(department_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_category ON safety_incidents(category_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_severity ON safety_incidents(severity_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_date ON safety_incidents(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_status ON safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_reported_by ON safety_incidents(reported_by);

-- Excavator dumper assignments
CREATE INDEX IF NOT EXISTS idx_excavator_dumper_assignments_activity ON excavator_dumper_assignments(excavator_activity_id);
CREATE INDEX IF NOT EXISTS idx_excavator_dumper_assignments_machine ON excavator_dumper_assignments(dumper_machine_id);

-- Mine blocks
CREATE INDEX IF NOT EXISTS idx_mine_blocks_site ON mine_blocks(site_id);

-- ============================================
-- 6. Add Composite Indexes for Common Query Patterns
-- ============================================

-- Daily logs: department + date (dashboard)
CREATE INDEX IF NOT EXISTS idx_daily_logs_dept_date_shift
  ON daily_logs(department_id, log_date DESC, shift);

-- Machine operations: department + date + shift (dashboard)
CREATE INDEX IF NOT EXISTS idx_machine_operations_dept_date_shift
  ON machine_operations(department_id, shift_date DESC, shift_type);

-- Hourly loads: department + date (dashboard)
CREATE INDEX IF NOT EXISTS idx_hourly_loads_dept_date
  ON hourly_loads(department_id, load_date DESC);

-- Operational delays: department + date + shift (dashboard)
CREATE INDEX IF NOT EXISTS idx_operational_delays_dept_date_shift
  ON operational_delays(department_id, delay_date DESC, shift_type);

-- Engineering notes: department + date + status (dashboard)
CREATE INDEX IF NOT EXISTS idx_engineering_notes_dept_date_status
  ON engineering_notes(department_id, note_date DESC, status);

-- Excavator activity: department + date + shift (dashboard)
CREATE INDEX IF NOT EXISTS idx_excavator_activity_dept_date_shift
  ON excavator_activity(department_id, activity_date DESC, shift_type);

-- Dozer rolls: department + date + shift (dashboard)
CREATE INDEX IF NOT EXISTS idx_dozer_rolls_dept_date_shift
  ON dozer_rolls(department_id, roll_date DESC, shift_type);

-- Safety incidents: department + date + status (dashboard)
CREATE INDEX IF NOT EXISTS idx_safety_incidents_dept_date_status
  ON safety_incidents(department_id, incident_date DESC, status);

-- Breakdowns: department + date + status (dashboard)
CREATE INDEX IF NOT EXISTS idx_breakdowns_dept_date_status
  ON breakdowns(department_id, date_in DESC, status);

-- Generated reports: department + date (dashboard)
CREATE INDEX IF NOT EXISTS idx_generated_reports_dept_date
  ON generated_reports(department_id, report_date DESC);

-- Audit logs: department + created_at (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_audit_logs_dept_created
  ON audit_logs(department_id, created_at DESC);

-- ============================================
-- 7. Add Missing RLS Policies
-- ============================================

-- Delay categories: UPDATE/DELETE for admin
DROP POLICY IF EXISTS "delay_categories_update_admin" ON delay_categories;
CREATE POLICY "delay_categories_update_admin"
  ON delay_categories FOR UPDATE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "delay_categories_delete_admin" ON delay_categories;
CREATE POLICY "delay_categories_delete_admin"
  ON delay_categories FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Report templates: UPDATE/DELETE for admin
DROP POLICY IF EXISTS "report_templates_update_admin" ON report_templates;
CREATE POLICY "report_templates_update_admin"
  ON report_templates FOR UPDATE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "report_templates_delete_admin" ON report_templates;
CREATE POLICY "report_templates_delete_admin"
  ON report_templates FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Safety severities: INSERT/UPDATE/DELETE for admin
DROP POLICY IF EXISTS "safety_severities_insert_admin" ON safety_severities;
CREATE POLICY "safety_severities_insert_admin"
  ON safety_severities FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "safety_severities_update_admin" ON safety_severities;
CREATE POLICY "safety_severities_update_admin"
  ON safety_severities FOR UPDATE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "safety_severities_delete_admin" ON safety_severities;
CREATE POLICY "safety_severities_delete_admin"
  ON safety_severities FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Safety incident categories: UPDATE/DELETE for admin/supervisor
DROP POLICY IF EXISTS "safety_incident_categories_update_admin" ON safety_incident_categories;
CREATE POLICY "safety_incident_categories_update_admin"
  ON safety_incident_categories FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM employees e WHERE e.auth_id = auth.uid() AND e.role = 'supervisor'
  ));

DROP POLICY IF EXISTS "safety_incident_categories_delete_admin" ON safety_incident_categories;
CREATE POLICY "safety_incident_categories_delete_admin"
  ON safety_incident_categories FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Mine blocks: DELETE for admin/supervisor
DROP POLICY IF EXISTS "mine_blocks_delete_admin_supervisor" ON mine_blocks;
CREATE POLICY "mine_blocks_delete_admin_supervisor"
  ON mine_blocks FOR DELETE
  TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM employees e WHERE e.auth_id = auth.uid() AND e.role = 'supervisor'
  ));

-- Daily logs: UPDATE/DELETE for creator or admin
DROP POLICY IF EXISTS "daily_logs_update_creator_or_admin" ON daily_logs;
CREATE POLICY "daily_logs_update_creator_or_admin"
  ON daily_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (e.role = 'admin' OR e.department_id = daily_logs.department_id)
    )
  );

DROP POLICY IF EXISTS "daily_logs_delete_admin" ON daily_logs;
CREATE POLICY "daily_logs_delete_admin"
  ON daily_logs FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Machine hours: UPDATE/DELETE through parent daily_log
CREATE POLICY "machine_hours_update_department"
  ON machine_hours FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE dl.id = machine_hours.daily_log_id
        AND (e.role = 'admin' OR e.department_id = dl.department_id)
    )
  );

CREATE POLICY "machine_hours_delete_admin"
  ON machine_hours FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Fuel logs: UPDATE/DELETE through parent daily_log
CREATE POLICY "fuel_logs_update_department"
  ON fuel_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE dl.id = fuel_logs.daily_log_id
        AND (e.role = 'admin' OR e.department_id = dl.department_id)
    )
  );

CREATE POLICY "fuel_logs_delete_admin"
  ON fuel_logs FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Production logs: UPDATE/DELETE through parent daily_log
CREATE POLICY "production_logs_update_department"
  ON production_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_logs dl
      JOIN employees e ON e.auth_id = auth.uid()
      WHERE dl.id = production_logs.daily_log_id
        AND (e.role = 'admin' OR e.department_id = dl.department_id)
    )
  );

CREATE POLICY "production_logs_delete_admin"
  ON production_logs FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- 8. Add NOT NULL Constraints
-- ============================================
DO $$
BEGIN
  -- Employees must have an auth_id (already NOT NULL by schema, reinforce)
  ALTER TABLE employees ALTER COLUMN auth_id SET NOT NULL;

  -- Machines: name should be required
  ALTER TABLE machines ALTER COLUMN name SET NOT NULL;

  -- Sites: name should be required
  ALTER TABLE sites ALTER COLUMN name SET NOT NULL;

  -- Operators: full_name should be required
  ALTER TABLE operators ALTER COLUMN full_name SET NOT NULL;

  -- Safety incidents: required fields
  ALTER TABLE safety_incidents ALTER COLUMN location SET NOT NULL;
  ALTER TABLE safety_incidents ALTER COLUMN root_cause SET NOT NULL;
  ALTER TABLE safety_incidents ALTER COLUMN corrective_action SET NOT NULL;

  -- Engineering notes: required fields
  ALTER TABLE engineering_notes ALTER COLUMN action_taken SET NOT NULL;

  -- Operational delays: description should be required (already NOT NULL)
  -- impact_description should be required
  ALTER TABLE operational_delays ALTER COLUMN impact_description SET NOT NULL;

  -- Shift notes (recreated as operational_delays? No, it was dropped in 003)
  -- Actually shift_notes was dropped. No action needed.

  -- Generated reports: report_data should be required
  ALTER TABLE generated_reports ALTER COLUMN report_data SET NOT NULL;
  ALTER TABLE generated_reports ALTER COLUMN generated_by SET NOT NULL;
END $$;

-- ============================================
-- 9. Add Table and Column Comments
-- ============================================
COMMENT ON TABLE departments IS 'Mining operational departments (Drilling, Production, Engineering, etc.)';
COMMENT ON COLUMN departments.name IS 'URL-safe unique slug for routing';
COMMENT ON COLUMN departments.display_name IS 'Human-readable department name';
COMMENT ON COLUMN departments.icon IS 'Lucide icon identifier';
COMMENT ON COLUMN departments.color IS 'Theme color key (blue, emerald, blue, etc.)';
COMMENT ON COLUMN departments.deleted_at IS 'Soft delete timestamp';

COMMENT ON TABLE employees IS 'Application users linked to auth.users with role-based access';
COMMENT ON COLUMN employees.auth_id IS 'FK to auth.users (Supabase Auth)';
COMMENT ON COLUMN employees.department_id IS 'Primary department assignment';
COMMENT ON COLUMN employees.role IS 'Access level: admin, supervisor, operator, maintenance, viewer';
COMMENT ON COLUMN employees.accessible_departments IS 'Additional departments this user can access';
COMMENT ON COLUMN employees.deleted_at IS 'Soft delete timestamp';

COMMENT ON TABLE machines IS 'Equipment registry across all departments';
COMMENT ON COLUMN machines.machine_type IS 'Category of equipment (Drill Rig, Dump Truck, Excavator, etc.)';
COMMENT ON COLUMN machines.bin_factor IS 'Payload factor for dump trucks (tonnes per load)';
COMMENT ON COLUMN machines.site_id IS 'Current operational site assignment';
COMMENT ON COLUMN machines.deleted_at IS 'Soft delete timestamp';

COMMENT ON TABLE daily_logs IS 'Per-department, per-shift operational log container';
COMMENT ON COLUMN daily_logs.log_date IS 'Date of the shift';
COMMENT ON COLUMN daily_logs.shift IS 'Shift identifier (day or night)';
COMMENT ON COLUMN daily_logs.notes IS 'General shift notes';

COMMENT ON TABLE machine_hours IS 'Hours worked per machine within a daily log';
COMMENT ON COLUMN machine_hours.hours_worked IS 'Decimal hours with 2 decimal precision';

COMMENT ON TABLE fuel_logs IS 'Diesel/litre consumption per machine within a daily log';
COMMENT ON COLUMN fuel_logs.diesel_litres IS 'Volume in litres with 2 decimal precision';

COMMENT ON TABLE production_logs IS 'Coal and waste tonnage per daily log';
COMMENT ON COLUMN production_logs.coal_tonnes IS 'Coal production in metric tonnes';
COMMENT ON COLUMN production_logs.waste_tonnes IS 'Waste/overburden in metric tonnes';

COMMENT ON TABLE operators IS 'Reference table for equipment operators (linked to Control Room)';
COMMENT ON COLUMN operators.employee_code IS 'Unique operator identifier code';
COMMENT ON COLUMN operators.deleted_at IS 'Soft delete timestamp';

COMMENT ON TABLE sites IS 'Mining site locations';
COMMENT ON COLUMN sites.site_code IS 'Unique site code (e.g., PIT-01)';
COMMENT ON COLUMN sites.deleted_at IS 'Soft delete timestamp';

COMMENT ON TABLE machine_operations IS 'Detailed shift operations with time tracking per machine';
COMMENT ON COLUMN machine_operations.start_time IS 'Operation start time';
COMMENT ON COLUMN machine_operations.end_time IS 'Operation end time (null if ongoing)';
COMMENT ON COLUMN machine_operations.hours_worked IS 'Generated: computed from end_time - start_time';

COMMENT ON TABLE hourly_loads IS '12-hour shift load counts per machine (24h split into day/night)';
COMMENT ON COLUMN hourly_loads.shift_type IS 'Shift identifier (day 06-18 or night 18-06)';
COMMENT ON COLUMN hourly_loads.total_loads IS 'Generated: sum of hour_01 through hour_12';

COMMENT ON TABLE delay_categories IS 'Categorization taxonomy for operational delays';
COMMENT ON COLUMN delay_categories.sort_order IS 'Display ordering in dropdowns';

COMMENT ON TABLE engineering_notes IS 'Engineering department issue tracking (mechanical, electrical, etc.)';
COMMENT ON COLUMN engineering_notes.issue_type IS 'Category of engineering issue';
COMMENT ON COLUMN engineering_notes.severity IS 'Impact level: low, medium, high, critical';
COMMENT ON COLUMN engineering_notes.status IS 'Resolution workflow status';

COMMENT ON TABLE operational_delays IS 'Real-time delay tracking with recovery workflow';
COMMENT ON COLUMN operational_delays.delay_type IS 'Categorization of delay cause';
COMMENT ON COLUMN operational_delays.delay_minutes IS 'Duration in minutes (must be > 0)';
COMMENT ON COLUMN operational_delays.status IS 'Active, recovered, or extended';

COMMENT ON TABLE breakdowns IS 'Machine breakdown book-in/book-out workflow';
COMMENT ON COLUMN breakdowns.fleet_id IS 'Equipment fleet identifier';
COMMENT ON COLUMN breakdowns.date_in IS 'Date equipment was brought in for repair';
COMMENT ON COLUMN breakdowns.date_out IS 'Date equipment returned to service';
COMMENT ON COLUMN breakdowns.missing_book_in IS 'Flag for incomplete book-in paperwork';
COMMENT ON COLUMN breakdowns.deleted_at IS 'Soft delete timestamp';

COMMENT ON TABLE report_templates IS 'Configurable report generation templates';
COMMENT ON COLUMN report_templates.report_type IS 'Type/category of report';
COMMENT ON COLUMN report_templates.config IS 'JSON configuration for report generation';

COMMENT ON TABLE generated_reports IS 'Generated report instances with stored data';
COMMENT ON COLUMN generated_reports.report_data IS 'JSON payload of report content';
COMMENT ON COLUMN generated_reports.pdf_url IS 'URL to generated PDF (if exported)';

COMMENT ON TABLE safety_severities IS 'Safety incident severity classifications';
COMMENT ON COLUMN safety_severities.weight IS 'Numeric weight for severity scoring';

COMMENT ON TABLE safety_incident_categories IS 'Safety incident type classification';

COMMENT ON TABLE safety_incidents IS 'Safety event records with investigation workflow';
COMMENT ON COLUMN safety_incidents.incident_type IS 'near-miss, incident, lost-time, equipment-damage';
COMMENT ON COLUMN safety_incidents.status IS 'Workflow status: open, under-investigation, resolved, closed';

COMMENT ON TABLE audit_logs IS 'Immutable record of data changes across core tables';
COMMENT ON COLUMN audit_logs.action IS 'DML operation: insert, update, delete';
COMMENT ON COLUMN audit_logs.old_data IS 'Row state before the change (null for inserts)';
COMMENT ON COLUMN audit_logs.new_data IS 'Row state after the change (null for deletes)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Client IP address at time of change';
COMMENT ON COLUMN audit_logs.user_agent IS 'Client user agent string';

COMMENT ON TABLE mine_blocks IS 'Mining block zones within sites';
COMMENT ON COLUMN mine_blocks.code IS 'Unique block identifier code';

COMMENT ON TABLE excavator_activity IS 'Excavator shift performance metrics';
COMMENT ON COLUMN excavator_activity.avg_cycle_time_seconds IS 'Average loader cycle time in seconds';
COMMENT ON COLUMN excavator_activity.material_type IS 'Type of material being excavated';

COMMENT ON TABLE excavator_dumper_assignments IS 'Dump truck assignments to excavator activity';
COMMENT ON COLUMN excavator_dumper_assignments.total_bcm IS 'Total bank cubic metres moved';

COMMENT ON TABLE dozer_rolls IS 'Dozer shift activities and production metrics';
COMMENT ON COLUMN dozer_rolls.blade_passes IS 'Number of blade passes';
COMMENT ON COLUMN dozer_rolls.push_count IS 'Number of push operations';

COMMENT ON TABLE memory_embeddings IS 'AI agent memory with vector embeddings for semantic retrieval';
COMMENT ON COLUMN memory_embeddings.session_id IS 'Conversation session identifier';
COMMENT ON COLUMN memory_embeddings.user_id IS 'FK to auth.users (memory owner)';
COMMENT ON COLUMN memory_embeddings.embedding IS 'OpenAI-compatible 1536-dimension vector';
COMMENT ON COLUMN memory_embeddings.memory_type IS 'episodic (conversations), semantic (facts), procedural (instructions)';
COMMENT ON COLUMN memory_embeddings.metadata IS 'Flexible JSON metadata for filtering';

-- ============================================
-- 10. Add generated_reports NOT NULL on created_by (if column exists)
-- ============================================
-- Already handled above with ALTER COLUMN SET NOT NULL
