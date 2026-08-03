-- Migration 043: Admin Data Lockdown
-- 
-- Goal: Only admins can UPDATE/DELETE most operational tables.
-- Operators retain UPDATE on workflow-specific tables (hourly_loads, excavator_activity).
-- Safety incident reporters can still edit their own reports.
-- Fixes broken machine_operations own-record policy.
--
-- Phase 1 of the Admin Data Lockdown initiative.

-- ============================================
-- 1. machines
-- ============================================
DROP POLICY IF EXISTS "machines_update_admin_supervisor" ON machines;
CREATE POLICY "machines_update_admin" ON machines
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 2. daily_logs (partitioned — policies on parent)
-- ============================================
DROP POLICY IF EXISTS "daily_logs_update_access" ON daily_logs;
DROP POLICY IF EXISTS "daily_logs_update_creator_or_admin" ON daily_logs;
DROP POLICY IF EXISTS "daily_logs_delete_admin" ON daily_logs;
CREATE POLICY "daily_logs_update_admin" ON daily_logs
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "daily_logs_delete_admin" ON daily_logs
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 3. machine_hours (child of daily_logs)
-- ============================================
DROP POLICY IF EXISTS "machine_hours_update_department" ON machine_hours;
DROP POLICY IF EXISTS "machine_hours_delete_admin" ON machine_hours;
CREATE POLICY "machine_hours_update_admin" ON machine_hours
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "machine_hours_delete_admin" ON machine_hours
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 4. fuel_logs (child of daily_logs)
-- ============================================
DROP POLICY IF EXISTS "fuel_logs_update_department" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_delete_admin" ON fuel_logs;
CREATE POLICY "fuel_logs_update_admin" ON fuel_logs
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "fuel_logs_delete_admin" ON fuel_logs
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 5. production_logs (child of daily_logs)
-- ============================================
DROP POLICY IF EXISTS "production_logs_update_department" ON production_logs;
DROP POLICY IF EXISTS "production_logs_delete_admin" ON production_logs;
CREATE POLICY "production_logs_update_admin" ON production_logs
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "production_logs_delete_admin" ON production_logs
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 6. machine_operations
-- Fixes broken own-record clause (was comparing employees.id to auth.uid())
-- ============================================
DROP POLICY IF EXISTS "machine_operations_update_creator_or_supervisor" ON machine_operations;
CREATE POLICY "machine_operations_update_admin" ON machine_operations
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "machine_operations_delete_admin" ON machine_operations
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 7. hourly_loads (partitioned — operator retains UPDATE for shift data entry)
-- ============================================
DROP POLICY IF EXISTS "hourly_loads_update_access" ON hourly_loads;
DROP POLICY IF EXISTS "hourly_loads_update_department" ON hourly_loads;
CREATE POLICY "hourly_loads_update_department" ON hourly_loads
  FOR UPDATE TO authenticated
  USING (public.has_department_access(department_id));
CREATE POLICY "hourly_loads_update_admin" ON hourly_loads
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 8. operational_delays
-- ============================================
DROP POLICY IF EXISTS "operational_delays_update_department" ON operational_delays;
CREATE POLICY "operational_delays_update_admin" ON operational_delays
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 9. engineering_notes
-- ============================================
DROP POLICY IF EXISTS "engineering_notes_update_department" ON engineering_notes;
CREATE POLICY "engineering_notes_update_admin" ON engineering_notes
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 10. shift_status
-- ============================================
DROP POLICY IF EXISTS "shift_status_update_access" ON shift_status;
CREATE POLICY "shift_status_update_admin" ON shift_status
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 11. excavator_activity (operator retains UPDATE for shift progress)
-- ============================================
DROP POLICY IF EXISTS "excavator_activity_update_department" ON excavator_activity;
CREATE POLICY "excavator_activity_update_department" ON excavator_activity
  FOR UPDATE TO authenticated
  USING (public.has_department_access(department_id));
CREATE POLICY "excavator_activity_update_admin" ON excavator_activity
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "excavator_dumper_assignments_update_admin" ON excavator_dumper_assignments;
CREATE POLICY "excavator_dumper_assignments_update_admin"
  ON excavator_dumper_assignments FOR UPDATE
  TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "excavator_dumper_assignments_delete_admin" ON excavator_dumper_assignments;
CREATE POLICY "excavator_dumper_assignments_delete_admin"
  ON excavator_dumper_assignments FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- 13. dozer_rolls
-- ============================================
DROP POLICY IF EXISTS "dozer_rolls_update_department" ON dozer_rolls;
CREATE POLICY "dozer_rolls_update_admin" ON dozer_rolls
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 14. breakdowns (operator retains UPDATE for status transitions via server action)
-- ============================================
DROP POLICY IF EXISTS "breakdowns_update_department" ON breakdowns;
DROP POLICY IF EXISTS "breakdowns_delete_admin" ON breakdowns;
CREATE POLICY "breakdowns_update_admin" ON breakdowns
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "breakdowns_delete_admin" ON breakdowns
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 15. safety_incidents (reporter retains own-record edit)
-- ============================================
DROP POLICY IF EXISTS "safety_incidents_update_creator_or_supervisor" ON safety_incidents;
CREATE POLICY "safety_incidents_update_reporter" ON safety_incidents
  FOR UPDATE TO authenticated
  USING (
    reported_by = (SELECT id FROM employees WHERE auth_id = auth.uid())
  );
CREATE POLICY "safety_incidents_update_admin" ON safety_incidents
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 16. drill_operations
-- ============================================
DROP POLICY IF EXISTS "drill_operations_update_department" ON drill_operations;
DROP POLICY IF EXISTS "drill_operations_delete_department" ON drill_operations;
CREATE POLICY "drill_operations_update_admin" ON drill_operations
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "drill_operations_delete_admin" ON drill_operations
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 17. documents (creator retains own-record update; delete is admin-only)
-- ============================================
DROP POLICY IF EXISTS "documents_update_own" ON documents;
DROP POLICY IF EXISTS "documents_delete_admin" ON documents;
CREATE POLICY "documents_update_own" ON documents
  FOR UPDATE TO authenticated
  USING (
    created_by = (SELECT id FROM employees WHERE auth_id = auth.uid())
  );
CREATE POLICY "documents_update_admin" ON documents
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "documents_delete_admin" ON documents
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Document versions inherit from documents
CREATE POLICY "document_versions_update_admin" ON document_versions
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 18. machine_configurations
-- ============================================
DROP POLICY IF EXISTS "machine_configurations_update_access" ON machine_configurations;
CREATE POLICY "machine_configurations_update_admin" ON machine_configurations
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 19. operators / sites / mine_blocks
-- ============================================
DROP POLICY IF EXISTS "operators_update_admin_supervisor" ON operators;
CREATE POLICY "operators_update_admin" ON operators
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "sites_update_admin_supervisor" ON sites;
CREATE POLICY "sites_update_admin" ON sites
  FOR UPDATE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "mine_blocks_delete_admin_supervisor" ON mine_blocks;
CREATE POLICY "mine_blocks_delete_admin" ON mine_blocks
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 20. Reference tables (already admin-only, just normalizing names)
-- ============================================
DROP POLICY IF EXISTS "delay_categories_update_admin" ON delay_categories;
DROP POLICY IF EXISTS "delay_categories_delete_admin" ON delay_categories;
CREATE POLICY "delay_categories_update_admin" ON delay_categories
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "delay_categories_delete_admin" ON delay_categories
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "report_templates_update_admin" ON report_templates;
DROP POLICY IF EXISTS "report_templates_delete_admin" ON report_templates;
CREATE POLICY "report_templates_update_admin" ON report_templates
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "report_templates_delete_admin" ON report_templates
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "safety_severities_update_admin" ON safety_severities;
DROP POLICY IF EXISTS "safety_severities_delete_admin" ON safety_severities;
CREATE POLICY "safety_severities_update_admin" ON safety_severities
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "safety_severities_delete_admin" ON safety_severities
  FOR DELETE TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "safety_incident_categories_update_admin" ON safety_incident_categories;
DROP POLICY IF EXISTS "safety_incident_categories_delete_admin" ON safety_incident_categories;
CREATE POLICY "safety_incident_categories_update_admin" ON safety_incident_categories
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "safety_incident_categories_delete_admin" ON safety_incident_categories
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 21. Generated reports
-- ============================================
CREATE POLICY "generated_reports_update_admin" ON generated_reports
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "generated_reports_delete_admin" ON generated_reports
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 22. Access Control tables
-- personnel / visitors / badges / fleet / equipment
-- Change from 'access_control' role to 'admin' only for UPDATE/DELETE
-- ============================================
DROP POLICY IF EXISTS "Allow access control update personnel" ON personnel;
DROP POLICY IF EXISTS "Allow access control update visitors" ON visitors;
DROP POLICY IF EXISTS "Allow access control delete visitors" ON visitors;
DROP POLICY IF EXISTS "Allow access control update badges" ON badges;
DROP POLICY IF EXISTS "Allow access control delete badges" ON badges;
DROP POLICY IF EXISTS "Allow access control update fleet" ON fleet;
DROP POLICY IF EXISTS "Allow access control delete fleet" ON fleet;
DROP POLICY IF EXISTS "Allow access control update equipment" ON equipment;
DROP POLICY IF EXISTS "Allow access control delete equipment" ON equipment;

CREATE POLICY "personnel_update_admin" ON personnel
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "personnel_delete_admin" ON personnel
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "visitors_update_admin" ON visitors
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "visitors_delete_admin" ON visitors
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "badges_update_admin" ON badges
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "badges_delete_admin" ON badges
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "fleet_update_admin" ON fleet
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "fleet_delete_admin" ON fleet
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "equipment_update_admin" ON equipment
  FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "equipment_delete_admin" ON equipment
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 23. access_logs (delete already admin-only)
-- ============================================
-- Already has "Allow admin delete access_logs" from 040_access_control_production_fixes.sql

-- ============================================
-- 24. employees (self-update OR admin)
-- ============================================
DROP POLICY IF EXISTS "employees_update_self_or_admin" ON employees;
CREATE POLICY "employees_update_self_or_admin" ON employees
  FOR UPDATE TO authenticated
  USING (
    auth_id = auth.uid() OR public.is_admin()
  );

-- ============================================
-- 25. webhook_endpoints — strip supervisor UPDATE, make admin-only
-- ============================================
DROP POLICY IF EXISTS "supervisors_update_department_webhooks" ON webhook_endpoints;
DROP POLICY IF EXISTS "admins_full_access_webhook_endpoints" ON webhook_endpoints;
CREATE POLICY "webhook_endpoints_admin_all" ON webhook_endpoints
  FOR ALL TO authenticated
  USING (public.is_admin());

-- ============================================
-- 26. audit_logs — add admin-only DELETE for audit cleanup
-- ============================================
CREATE POLICY "audit_logs_delete_admin" ON audit_logs
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================
-- 27. Materialized view permissions (select only — no changes needed)
-- ============================================
