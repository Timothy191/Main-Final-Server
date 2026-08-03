-- Migration 028: Access Control & QR System
-- Ports the QR-System models (Employees, Visitors, GateLogs) into the portal.

-- 1. Personnel (Maps to QR-System 'Employee' model)
CREATE TABLE personnel (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emp_code text UNIQUE NOT NULL,
    first_name text NOT NULL,
    surname text NOT NULL,
    id_number text UNIQUE NOT NULL,
    job_title text,
    department_id uuid REFERENCES departments(id),
    induction_expiry timestamptz,
    medical_expiry timestamptz,
    status text DEFAULT 'Active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Visitors
CREATE TABLE visitors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    company text,
    purpose text,
    host_id uuid REFERENCES personnel(id),
    check_in_time timestamptz DEFAULT now(),
    check_out_time timestamptz,
    status text DEFAULT 'Checked In', -- 'Checked In', 'Checked Out', 'Expired'
    created_at timestamptz DEFAULT now()
);

-- 3. Badges (Manages the QR_Code assignments globally)
CREATE TABLE badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code text UNIQUE NOT NULL,
    entity_type text NOT NULL CHECK (entity_type IN ('personnel', 'visitor', 'vehicle')),
    personnel_id uuid REFERENCES personnel(id),
    visitor_id uuid REFERENCES visitors(id),
    is_active boolean DEFAULT true,
    issued_at timestamptz DEFAULT now(),
    revoked_at timestamptz
);

-- 4. Access Logs (Maps to QR-System 'GateLog')
CREATE TABLE access_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id uuid REFERENCES badges(id),
    access_type text NOT NULL,
    direction text NOT NULL CHECK (direction IN ('IN', 'OUT')),
    gate_location text NOT NULL,
    access_granted boolean DEFAULT true,
    denial_reason text,
    scanned_at timestamptz DEFAULT now(),
    department_id uuid REFERENCES departments(id)
);

-- Add indexes for fast lookup during scanning
CREATE INDEX idx_badges_qr_code ON badges(qr_code);
CREATE INDEX idx_access_logs_scanned_at ON access_logs(scanned_at DESC);
CREATE INDEX idx_access_logs_gate ON access_logs(gate_location);

-- Setup Row Level Security (RLS)
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Base Policies - restrict to access-control role only
CREATE POLICY "Allow access control read personnel" ON personnel FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'access_control')
);
CREATE POLICY "Allow admin read personnel" ON personnel FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Allow access control read visitors" ON visitors FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
);
CREATE POLICY "Allow access control read badges" ON badges FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
);
CREATE POLICY "Allow access control read access_logs" ON access_logs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
);

-- Insert policies for Access Control personnel only
CREATE POLICY "Allow access control insert logs" ON access_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
);
CREATE POLICY "Allow access control insert visitors" ON visitors FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM employees WHERE auth_id = auth.uid() AND role IN ('access_control', 'admin'))
);
