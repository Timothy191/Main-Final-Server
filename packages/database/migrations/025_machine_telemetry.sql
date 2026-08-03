-- ============================================
-- Machine Telemetry System
-- Tracks drill rig telemetry with monthly archival
-- ============================================

-- Current month telemetry (active data)
CREATE TABLE IF NOT EXISTS machine_telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Telemetry timestamp (when data was recorded)
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Month tracking for easy filtering and archival
  year_month TEXT NOT NULL GENERATED ALWAYS AS (
    CAST(EXTRACT(YEAR FROM recorded_at AT TIME ZONE 'UTC') AS TEXT) || '-' ||
    CASE WHEN EXTRACT(MONTH FROM recorded_at AT TIME ZONE 'UTC') < 10 THEN '0' ELSE '' END ||
    CAST(EXTRACT(MONTH FROM recorded_at AT TIME ZONE 'UTC') AS TEXT)
  ) STORED,
  
  -- Machine metrics
  engine_rpm NUMERIC(10,2),
  engine_temp NUMERIC(10,2),
  hydraulic_pressure NUMERIC(10,2),
  hydraulic_temp NUMERIC(10,2),
  bit_depth NUMERIC(10,2),
  hole_depth NUMERIC(10,2),
  weight_on_bit NUMERIC(10,2),
  rotation_torque NUMERIC(10,2),
  penetration_rate NUMERIC(10,2),
  
  -- Drill string data
  standpipe_pressure NUMERIC(10,2),
  mud_flow_rate NUMERIC(10,2),
  
  -- Environmental
  ambient_temp NUMERIC(10,2),
  vibration_level NUMERIC(10,2),
  
  -- Operational status
  operating_hours NUMERIC(10,2),
  fuel_level NUMERIC(5,2),
  
  -- Alerts/warnings
  alert_count INTEGER DEFAULT 0,
  alert_codes TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes for common queries
  CONSTRAINT idx_unique_machine_timestamp UNIQUE(machine_id, recorded_at)
);

-- Archive table (stores completed months)
CREATE TABLE IF NOT EXISTS machine_telemetry_archive (
  id UUID PRIMARY KEY,
  machine_id UUID NOT NULL,
  department_id UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  year_month TEXT NOT NULL,
  
  -- All telemetry fields
  engine_rpm NUMERIC(10,2),
  engine_temp NUMERIC(10,2),
  hydraulic_pressure NUMERIC(10,2),
  hydraulic_temp NUMERIC(10,2),
  bit_depth NUMERIC(10,2),
  hole_depth NUMERIC(10,2),
  weight_on_bit NUMERIC(10,2),
  rotation_torque NUMERIC(10,2),
  penetration_rate NUMERIC(10,2),
  standpipe_pressure NUMERIC(10,2),
  mud_flow_rate NUMERIC(10,2),
  ambient_temp NUMERIC(10,2),
  vibration_level NUMERIC(10,2),
  operating_hours NUMERIC(10,2),
  fuel_level NUMERIC(5,2),
  alert_count INTEGER DEFAULT 0,
  alert_codes TEXT[],
  created_at TIMESTAMPTZ NOT NULL,
  
  -- Archive metadata
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  record_count INTEGER NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_machine_date ON machine_telemetry(machine_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_year_month ON machine_telemetry(year_month);
CREATE INDEX IF NOT EXISTS idx_telemetry_department ON machine_telemetry(department_id);

CREATE INDEX IF NOT EXISTS idx_telemetry_archive_machine ON machine_telemetry_archive(machine_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_archive_month ON machine_telemetry_archive(year_month);
CREATE INDEX IF NOT EXISTS idx_telemetry_archive_archived ON machine_telemetry_archive(archived_at);

-- Enable RLS
ALTER TABLE machine_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_telemetry_archive ENABLE ROW LEVEL SECURITY;

-- Select policy for active telemetry
CREATE POLICY "telemetry_select_department"
  ON machine_telemetry FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = machine_telemetry.department_id
          OR machine_telemetry.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- Insert policy
CREATE POLICY "telemetry_insert_department"
  ON machine_telemetry FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = machine_telemetry.department_id
          OR machine_telemetry.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- Select policy for archive
CREATE POLICY "telemetry_archive_select_department"
  ON machine_telemetry_archive FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.department_id = machine_telemetry_archive.department_id
          OR machine_telemetry_archive.department_id = ANY(e.accessible_departments)
        )
    )
  );

-- ============================================
-- Monthly Archival Function
-- Archives previous month's data and clears from active table
-- ============================================

CREATE OR REPLACE FUNCTION archive_telemetry_month(
  p_year_month TEXT DEFAULT NULL
) RETURNS TABLE (
  archived_count INTEGER,
  machines_archived INTEGER
) AS $$
DECLARE
  v_target_month TEXT;
BEGIN
  -- Default to previous month if not specified
  IF p_year_month IS NULL THEN
    v_target_month := TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM');
  ELSE
    v_target_month := p_year_month;
  END IF;
  
  -- Insert archive records with aggregated daily summaries
  INSERT INTO machine_telemetry_archive (
    id, machine_id, department_id, recorded_at, year_month,
    engine_rpm, engine_temp, hydraulic_pressure, hydraulic_temp,
    bit_depth, hole_depth, weight_on_bit, rotation_torque, penetration_rate,
    standpipe_pressure, mud_flow_rate, ambient_temp, vibration_level,
    operating_hours, fuel_level, alert_count, alert_codes, created_at,
    record_count
  )
  SELECT 
    gen_random_uuid(),
    machine_id,
    department_id,
    MAX(recorded_at),
    year_month,
    AVG(engine_rpm),
    AVG(engine_temp),
    AVG(hydraulic_pressure),
    AVG(hydraulic_temp),
    MAX(bit_depth),
    MAX(hole_depth),
    AVG(weight_on_bit),
    AVG(rotation_torque),
    AVG(penetration_rate),
    AVG(standpipe_pressure),
    AVG(mud_flow_rate),
    AVG(ambient_temp),
    MAX(vibration_level),
    MAX(operating_hours),
    AVG(fuel_level),
    SUM(alert_count),
    array_agg(DISTINCT unnested_alerts),
    MIN(created_at),
    COUNT(*)
  FROM machine_telemetry, UNNEST(COALESCE(alert_codes, ARRAY[]::TEXT[])) as unnested_alerts
  WHERE year_month = v_target_month
  GROUP BY machine_id, department_id, year_month;
  
  -- Return stats before deletion
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(DISTINCT machine_id)::INTEGER
  FROM machine_telemetry
  WHERE year_month = v_target_month;
  
  -- Delete archived records from active table
  DELETE FROM machine_telemetry
  WHERE year_month = v_target_month;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Get Telemetry Summary Function
-- Returns daily or hourly aggregates for the current month
-- ============================================

CREATE OR REPLACE FUNCTION get_telemetry_summary(
  p_department_id UUID,
  p_machine_id UUID DEFAULT NULL,
  p_granularity TEXT DEFAULT 'day' -- 'hour' or 'day'
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
) AS $$
BEGIN
  IF p_granularity = 'hour' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(t.recorded_at, 'YYYY-MM-DD HH24:00') as period,
      t.machine_id,
      m.name as machine_name,
      AVG(t.engine_rpm)::NUMERIC,
      AVG(t.engine_temp)::NUMERIC,
      AVG(t.hydraulic_pressure)::NUMERIC,
      MAX(t.bit_depth)::NUMERIC,
      MAX(t.hole_depth)::NUMERIC,
      AVG(t.penetration_rate)::NUMERIC,
      SUM(t.alert_count)::INTEGER,
      COUNT(*)::BIGINT
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
      t.machine_id,
      m.name as machine_name,
      AVG(t.engine_rpm)::NUMERIC,
      AVG(t.engine_temp)::NUMERIC,
      AVG(t.hydraulic_pressure)::NUMERIC,
      MAX(t.bit_depth)::NUMERIC,
      MAX(t.hole_depth)::NUMERIC,
      AVG(t.penetration_rate)::NUMERIC,
      SUM(t.alert_count)::INTEGER,
      COUNT(*)::BIGINT
    FROM machine_telemetry t
    JOIN machines m ON m.id = t.machine_id
    WHERE t.department_id = p_department_id
      AND (p_machine_id IS NULL OR t.machine_id = p_machine_id)
      AND t.year_month = TO_CHAR(NOW(), 'YYYY-MM')
    GROUP BY TO_CHAR(t.recorded_at, 'YYYY-MM-DD'), t.machine_id, m.name
    ORDER BY period DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Scheduled Archival Trigger (runs on month change)
-- ============================================

CREATE OR REPLACE FUNCTION check_and_archive_telemetry()
RETURNS TRIGGER AS $$
BEGIN
  -- Archive previous month data when new month starts
  IF (SELECT MAX(year_month) FROM machine_telemetry) < TO_CHAR(NOW(), 'YYYY-MM') THEN
    PERFORM archive_telemetry_month(
      TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE machine_telemetry;
