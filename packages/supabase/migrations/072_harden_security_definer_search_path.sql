-- ============================================================================
-- Migration 072: Harden SECURITY DEFINER functions with pinned search_path
--
-- Root cause: Several SECURITY DEFINER functions were created without
-- `SET search_path = public`, leaving them vulnerable to search-path
-- hijacking (CVE-class: an attacker who can create objects in a schema
-- that appears earlier in search_path could shadow public functions).
--
-- This migration recreates each affected function with the search_path
-- explicitly pinned. The function bodies are unchanged.
--
-- Affected functions:
--   1. process_audit_log()          — migration 011
--   2. update_updated_at_column()   — migration 020
--   3. archive_telemetry_month()    — migration 025
--   4. get_telemetry_summary()      — migration 025
--   5. notify_telemetry_webhook()   — migration 053
--   6. validate_dozer_roll_date()   — migration 054
-- ============================================================================

-- 1. process_audit_log() — generic audit trigger
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    action, table_name, record_id, old_data, new_data,
    performed_by, department_id, created_at
  )
  VALUES (
    LOWER(TG_OP), TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_data, v_new_data,
    (SELECT id FROM employees WHERE auth_id = auth.uid() LIMIT 1),
    v_department_id, NOW()
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.process_audit_log() IS
  'Audit trigger: logs INSERT/UPDATE/DELETE to audit_logs. Hardened (migration 072): pinned search_path.';


-- 2. update_updated_at_column() — auto-updates updated_at on row modification
-- Note: Cannot DROP this function (triggers depend on it). CREATE OR REPLACE
-- creates a new entry with SECURITY DEFINER + search_path; the orphaned
-- original is cleaned up by migration 074.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS
  'Trigger: sets updated_at = NOW() before UPDATE. Hardened (migration 072): added SECURITY DEFINER + pinned search_path.';


-- 3. archive_telemetry_month() — monthly telemetry archival
CREATE OR REPLACE FUNCTION public.archive_telemetry_month(
  p_year_month TEXT DEFAULT NULL
) RETURNS TABLE (
  archived_count INTEGER,
  machines_archived INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_month TEXT;
BEGIN
  IF p_year_month IS NULL THEN
    v_target_month := TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM');
  ELSE
    v_target_month := p_year_month;
  END IF;

  INSERT INTO machine_telemetry_archive (
    id, machine_id, department_id, recorded_at, year_month,
    engine_rpm, engine_temp, hydraulic_pressure, hydraulic_temp,
    bit_depth, hole_depth, weight_on_bit, rotation_torque, penetration_rate,
    standpipe_pressure, mud_flow_rate, ambient_temp, vibration_level,
    operating_hours, fuel_level, alert_count, alert_codes, created_at,
    record_count
  )
  SELECT
    machine_id, department_id, MIN(recorded_at), year_month,
    AVG(engine_rpm), AVG(engine_temp), AVG(hydraulic_pressure), AVG(hydraulic_temp),
    MAX(bit_depth), MAX(hole_depth), AVG(weight_on_bit), AVG(rotation_torque),
    AVG(penetration_rate), AVG(standpipe_pressure), AVG(mud_flow_rate),
    AVG(ambient_temp), MAX(vibration_level), MAX(operating_hours),
    AVG(fuel_level), SUM(alert_count),
    array_agg(DISTINCT unnested_alerts),
    MIN(created_at), COUNT(*)
  FROM machine_telemetry, UNNEST(COALESCE(alert_codes, ARRAY[]::TEXT[])) as unnested_alerts
  WHERE year_month = v_target_month
  GROUP BY machine_id, department_id, year_month;

  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER,
    COUNT(DISTINCT machine_id)::INTEGER
  FROM machine_telemetry
  WHERE year_month = v_target_month;

  DELETE FROM machine_telemetry
  WHERE year_month = v_target_month;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.archive_telemetry_month(TEXT) IS
  'Archives previous month telemetry to machine_telemetry_archive. Hardened (migration 072): pinned search_path.';


-- 4. get_telemetry_summary() — telemetry aggregate viewer
CREATE OR REPLACE FUNCTION public.get_telemetry_summary(
  p_department_id UUID,
  p_machine_id UUID DEFAULT NULL,
  p_granularity TEXT DEFAULT 'day'
) RETURNS TABLE (
  period TEXT,
  machine_id UUID,
  machine_name TEXT,
  avg_engine_rpm NUMERIC,
  avg_engine_temp NUMERIC,
  avg_hydraulic_pressure NUMERIC,
  max_bit_depth NUMERIC,
  max_hole_depth NUMERIC,
  avg_penetration_rate NUMERIC,
  total_alerts INTEGER,
  record_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_granularity = 'hour' THEN
    RETURN QUERY
    SELECT
      TO_CHAR(t.recorded_at, 'YYYY-MM-DD HH24:00') as period,
      t.machine_id, m.name as machine_name,
      AVG(t.engine_rpm)::NUMERIC, AVG(t.engine_temp)::NUMERIC,
      AVG(t.hydraulic_pressure)::NUMERIC,
      MAX(t.bit_depth)::NUMERIC, MAX(t.hole_depth)::NUMERIC,
      AVG(t.penetration_rate)::NUMERIC,
      SUM(t.alert_count)::INTEGER, COUNT(*)::BIGINT
    FROM machine_telemetry t
    JOIN machines m ON m.id = t.machine_id
    WHERE t.department_id = p_department_id
      AND (p_machine_id IS NULL OR t.machine_id = p_machine_id)
      AND t.year_month = TO_CHAR(NOW(), 'YYYY-MM')
    GROUP BY TO_CHAR(t.recorded_at, 'YYYY-MM-DD HH24:00'), t.machine_id, m.name
    ORDER BY period DESC;
  ELSE
    RETURN QUERY
    SELECT
      TO_CHAR(t.recorded_at, 'YYYY-MM-DD') as period,
      t.machine_id, m.name as machine_name,
      AVG(t.engine_rpm)::NUMERIC, AVG(t.engine_temp)::NUMERIC,
      AVG(t.hydraulic_pressure)::NUMERIC,
      MAX(t.bit_depth)::NUMERIC, MAX(t.hole_depth)::NUMERIC,
      AVG(t.penetration_rate)::NUMERIC,
      SUM(t.alert_count)::INTEGER, COUNT(*)::BIGINT
    FROM machine_telemetry t
    JOIN machines m ON m.id = t.machine_id
    WHERE t.department_id = p_department_id
      AND (p_machine_id IS NULL OR t.machine_id = p_machine_id)
      AND t.year_month = TO_CHAR(NOW(), 'YYYY-MM')
    GROUP BY TO_CHAR(t.recorded_at, 'YYYY-MM-DD'), t.machine_id, m.name
    ORDER BY period DESC;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_telemetry_summary(UUID, UUID, TEXT) IS
  'Returns daily/hourly telemetry aggregates. Hardened (migration 072): pinned search_path.';


-- 5. notify_telemetry_webhook() — pg_net webhook dispatch
CREATE OR REPLACE FUNCTION public.notify_telemetry_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_payload JSONB;
BEGIN
  SELECT url INTO v_url
  FROM webhook_endpoints
  WHERE active = true
    AND 'telemetry.created' = ANY(event_types)
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_url IS NOT NULL THEN
    v_payload := jsonb_build_object(
      'table', 'machine_telemetry',
      'record', jsonb_build_object(
        'machine_id', NEW.machine_id,
        'engine_rpm', NEW.engine_rpm,
        'engine_temp', NEW.engine_temp,
        'hydraulic_pressure', NEW.hydraulic_pressure,
        'vibration_level', NEW.vibration_level,
        'fuel_level', NEW.fuel_level,
        'bit_depth', NEW.bit_depth
      )
    );

    PERFORM net.http_post(
      url := v_url,
      body := v_payload::text,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_telemetry_webhook() IS
  'Webhook trigger: dispatches telemetry inserts via pg_net. Hardened (migration 072): pinned search_path.';


-- 6. validate_dozer_roll_date() — operational date enforcement
CREATE OR REPLACE FUNCTION public.validate_dozer_roll_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_server_date DATE;
BEGIN
  v_server_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Johannesburg')::DATE;

  IF NEW.roll_date != v_server_date THEN
    RAISE EXCEPTION 'Invalid roll date (%): does not match server operational date (%)', NEW.roll_date, v_server_date;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_dozer_roll_date() IS
  'Validates dozer roll date matches Africa/Johannesburg operational date. Hardened (migration 072): pinned search_path.';
