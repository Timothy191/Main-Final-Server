-- ============================================
-- Migration 081: Complete Control Room Integration
-- ============================================

-- 1. Modbus Connections Table
CREATE TABLE IF NOT EXISTS modbus_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL UNIQUE,
  host TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 502,
  unit_id INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_connected TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Modbus Telemetry Table
CREATE TABLE IF NOT EXISTS modbus_telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL REFERENCES modbus_connections(equipment_id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registers JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Alarm Events Table
CREATE TABLE IF NOT EXISTS alarm_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL REFERENCES modbus_connections(equipment_id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'warning')),
  message TEXT NOT NULL,
  value NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Alarm Escalation Policy Table
CREATE TABLE IF NOT EXISTS alarm_escalation_policy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  severity TEXT NOT NULL UNIQUE CHECK (severity IN ('critical', 'high', 'warning')),
  delay_seconds INTEGER NOT NULL DEFAULT 60,
  notification_channels TEXT[] NOT NULL DEFAULT '{"dashboard"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Generated Reports Table
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  metrics JSONB NOT NULL,
  signed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  signature_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Operator Logs Table
CREATE TABLE IF NOT EXISTS operator_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE modbus_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE modbus_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm_escalation_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Modbus Connections
CREATE POLICY "modbus_connections_select" ON modbus_connections FOR SELECT TO authenticated USING (has_department_access(department_id));
CREATE POLICY "modbus_connections_insert" ON modbus_connections FOR INSERT TO authenticated WITH CHECK (has_department_access(department_id));
CREATE POLICY "modbus_connections_update" ON modbus_connections FOR UPDATE TO authenticated USING (has_department_access(department_id));
CREATE POLICY "modbus_connections_delete" ON modbus_connections FOR DELETE TO authenticated USING (has_department_access(department_id));

-- RLS Policies for Modbus Telemetry
CREATE POLICY "modbus_telemetry_select" ON modbus_telemetry FOR SELECT TO authenticated USING (has_department_access(department_id));
CREATE POLICY "modbus_telemetry_insert" ON modbus_telemetry FOR INSERT TO authenticated WITH CHECK (has_department_access(department_id));
CREATE POLICY "modbus_telemetry_update" ON modbus_telemetry FOR UPDATE TO authenticated USING (has_department_access(department_id));
CREATE POLICY "modbus_telemetry_delete" ON modbus_telemetry FOR DELETE TO authenticated USING (has_department_access(department_id));

-- RLS Policies for Alarm Events
CREATE POLICY "alarm_events_select" ON alarm_events FOR SELECT TO authenticated USING (has_department_access(department_id));
CREATE POLICY "alarm_events_insert" ON alarm_events FOR INSERT TO authenticated WITH CHECK (has_department_access(department_id));
CREATE POLICY "alarm_events_update" ON alarm_events FOR UPDATE TO authenticated USING (has_department_access(department_id));
CREATE POLICY "alarm_events_delete" ON alarm_events FOR DELETE TO authenticated USING (has_department_access(department_id));

-- RLS Policies for Alarm Escalation Policy
CREATE POLICY "alarm_escalation_policy_select" ON alarm_escalation_policy FOR SELECT TO authenticated USING (has_department_access(department_id));
CREATE POLICY "alarm_escalation_policy_insert" ON alarm_escalation_policy FOR INSERT TO authenticated WITH CHECK (has_department_access(department_id));
CREATE POLICY "alarm_escalation_policy_update" ON alarm_escalation_policy FOR UPDATE TO authenticated USING (has_department_access(department_id));
CREATE POLICY "alarm_escalation_policy_delete" ON alarm_escalation_policy FOR DELETE TO authenticated USING (has_department_access(department_id));

-- RLS Policies for Generated Reports
CREATE POLICY "generated_reports_select" ON generated_reports FOR SELECT TO authenticated USING (has_department_access(department_id));
CREATE POLICY "generated_reports_insert" ON generated_reports FOR INSERT TO authenticated WITH CHECK (has_department_access(department_id));
CREATE POLICY "generated_reports_update" ON generated_reports FOR UPDATE TO authenticated USING (has_department_access(department_id));
CREATE POLICY "generated_reports_delete" ON generated_reports FOR DELETE TO authenticated USING (has_department_access(department_id));

-- RLS Policies for Operator Logs
CREATE POLICY "operator_logs_select" ON operator_logs FOR SELECT TO authenticated USING (has_department_access(department_id));
CREATE POLICY "operator_logs_insert" ON operator_logs FOR INSERT TO authenticated WITH CHECK (has_department_access(department_id));
CREATE POLICY "operator_logs_update" ON operator_logs FOR UPDATE TO authenticated USING (has_department_access(department_id));
CREATE POLICY "operator_logs_delete" ON operator_logs FOR DELETE TO authenticated USING (has_department_access(department_id));

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS update_modbus_connections_updated_at ON modbus_connections;
DROP TRIGGER IF EXISTS update_alarm_events_updated_at ON alarm_events;
DROP TRIGGER IF EXISTS update_alarm_escalation_policy_updated_at ON alarm_escalation_policy;
DROP TRIGGER IF EXISTS update_generated_reports_updated_at ON generated_reports;
DROP TRIGGER IF EXISTS update_operator_logs_updated_at ON operator_logs;

-- Create triggers to auto-update updated_at columns
CREATE TRIGGER update_modbus_connections_updated_at BEFORE UPDATE ON modbus_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alarm_events_updated_at BEFORE UPDATE ON alarm_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alarm_escalation_policy_updated_at BEFORE UPDATE ON alarm_escalation_policy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_reports_updated_at BEFORE UPDATE ON generated_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operator_logs_updated_at BEFORE UPDATE ON operator_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
