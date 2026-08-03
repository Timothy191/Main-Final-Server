-- ============================================
-- Automated Audit Logging System
-- ============================================

-- 1. Create a generic audit trigger function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
  v_department_id UUID := NULL;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_old_data := to_jsonb(OLD);
  ELSIF (TG_OP = 'INSERT') THEN
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Attempt to extract department_id from the record
  BEGIN
    IF (TG_OP = 'DELETE') THEN
      v_department_id := OLD.department_id;
    ELSE
      v_department_id := NEW.department_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_department_id := NULL;
  END;

  INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    performed_by,
    department_id,
    created_at
  )
  VALUES (
    LOWER(TG_OP),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_data,
    v_new_data,
    (SELECT id FROM employees WHERE auth_id = auth.uid() LIMIT 1),
    v_department_id,
    NOW()
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply audit trigger to core tables
-- Departments
DROP TRIGGER IF EXISTS audit_departments ON departments;
CREATE TRIGGER audit_departments
  AFTER INSERT OR UPDATE OR DELETE ON departments
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Employees
DROP TRIGGER IF EXISTS audit_employees ON employees;
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON employees
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Machines
DROP TRIGGER IF EXISTS audit_machines ON machines;
CREATE TRIGGER audit_machines
  AFTER INSERT OR UPDATE OR DELETE ON machines
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Operators
DROP TRIGGER IF EXISTS audit_operators ON operators;
CREATE TRIGGER audit_operators
  AFTER INSERT OR UPDATE OR DELETE ON operators
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Sites
DROP TRIGGER IF EXISTS audit_sites ON sites;
CREATE TRIGGER audit_sites
  AFTER INSERT OR UPDATE OR DELETE ON sites
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Daily Logs
DROP TRIGGER IF EXISTS audit_daily_logs ON daily_logs;
CREATE TRIGGER audit_daily_logs
  AFTER INSERT OR UPDATE OR DELETE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Shift Notes
-- DROP TRIGGER IF EXISTS audit_shift_notes ON shift_notes;
-- CREATE TRIGGER audit_shift_notes
--   AFTER INSERT OR UPDATE OR DELETE ON shift_notes
--   FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Excavator Activity
DROP TRIGGER IF EXISTS audit_excavator_activity ON excavator_activity;
CREATE TRIGGER audit_excavator_activity
  AFTER INSERT OR UPDATE OR DELETE ON excavator_activity
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Dozer Rolls
DROP TRIGGER IF EXISTS audit_dozer_rolls ON dozer_rolls;
CREATE TRIGGER audit_dozer_rolls
  AFTER INSERT OR UPDATE OR DELETE ON dozer_rolls
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();
