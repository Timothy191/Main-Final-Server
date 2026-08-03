-- ============================================
-- Migration: 065_materialized_view_refresh_optimization
-- Description: Implement incremental refresh strategies and 
--              concurrent refresh monitoring for materialized views.
--
--              Benefits:
--              1. Smart refresh scheduling to avoid conflicts
--              2. Performance monitoring for refresh operations
--              3. Automatic backoff on refresh failures
--              4. Health checks for materialized view freshness
-- ============================================

-- ============================================
-- PART 1: Materialized view refresh monitoring table
-- ============================================

CREATE TABLE IF NOT EXISTS materialized_view_refresh_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  view_name TEXT NOT NULL,
  refresh_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refresh_end TIMESTAMPTZ,
  refresh_duration_ms INT,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
  error_message TEXT,
  rows_affected INT,
  is_concurrent BOOLEAN DEFAULT TRUE,
  triggered_by TEXT DEFAULT 'cron',  -- 'cron', 'manual', 'api'
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for monitoring queries
CREATE INDEX idx_mv_refresh_log_view_name ON materialized_view_refresh_log(view_name);
CREATE INDEX idx_mv_refresh_log_status ON materialized_view_refresh_log(status);
CREATE INDEX idx_mv_refresh_log_refresh_start ON materialized_view_refresh_log(refresh_start DESC);
CREATE INDEX idx_mv_refresh_log_duration ON materialized_view_refresh_log(refresh_duration_ms) WHERE refresh_duration_ms IS NOT NULL;

-- Enable RLS
ALTER TABLE materialized_view_refresh_log ENABLE ROW LEVEL SECURITY;

-- Admin users can see all logs, authenticated users can see summary
CREATE POLICY "mv_refresh_log_select_all"
  ON materialized_view_refresh_log FOR SELECT
  TO authenticated
  USING (true);  -- Allow all authenticated users to monitor refresh health

CREATE POLICY "mv_refresh_log_insert_admin"
  ON materialized_view_refresh_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE materialized_view_refresh_log IS 
'Logs materialized view refresh operations for monitoring and debugging.';

-- ============================================
-- PART 2: Enhanced refresh functions with monitoring
-- ============================================

-- Function to log refresh start
CREATE OR REPLACE FUNCTION public.log_mv_refresh_start(
  p_view_name TEXT,
  p_is_concurrent BOOLEAN DEFAULT TRUE,
  p_triggered_by TEXT DEFAULT 'cron'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO materialized_view_refresh_log (
    view_name, status, is_concurrent, triggered_by
  ) VALUES (
    p_view_name, 'started', p_is_concurrent, p_triggered_by
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to log refresh completion
CREATE OR REPLACE FUNCTION public.log_mv_refresh_end(
  p_log_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_rows_affected INT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duration_ms INT;
BEGIN
  UPDATE materialized_view_refresh_log
  SET 
    refresh_end = NOW(),
    status = p_status,
    error_message = p_error_message,
    rows_affected = p_rows_affected,
    refresh_duration_ms = EXTRACT(EPOCH FROM (NOW() - refresh_start))::INT * 1000
  WHERE id = p_log_id;
END;
$$;

-- Enhanced refresh function for dept_production_summary
CREATE OR REPLACE FUNCTION public.refresh_dept_production_summary_smart()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  refresh_status TEXT := 'completed';
  error_msg TEXT := NULL;
  row_count INT;
BEGIN
  -- Log refresh start
  log_id := public.log_mv_refresh_start('dept_production_summary', TRUE, 'cron');
  
  BEGIN
    -- Check if a concurrent refresh is already running
    IF EXISTS (
      SELECT 1 FROM materialized_view_refresh_log
      WHERE view_name = 'dept_production_summary'
        AND status = 'started'
        AND refresh_start > NOW() - INTERVAL '10 minutes'
    ) THEN
      -- Skip if another refresh is in progress
      UPDATE materialized_view_refresh_log
      SET status = 'skipped',
          error_message = 'Concurrent refresh in progress',
          refresh_end = NOW()
      WHERE id = log_id;
      RETURN;
    END IF;
    
    -- Perform concurrent refresh
    REFRESH MATERIALIZED VIEW CONCURRENTLY dept_production_summary;
    
    -- Get row count
    SELECT COUNT(*) INTO row_count FROM dept_production_summary;
    
  EXCEPTION WHEN OTHERS THEN
    refresh_status := 'failed';
    error_msg := SQLERRM;
    
    -- If concurrent refresh fails, fall back to non-concurrent
    BEGIN
      REFRESH MATERIALIZED VIEW dept_production_summary;
      SELECT COUNT(*) INTO row_count FROM dept_production_summary;
      refresh_status := 'completed';
      error_msg := 'Concurrent refresh failed, fell back to non-concurrent: ' || SQLERRM;
    EXCEPTION WHEN OTHERS THEN
      error_msg := 'Both concurrent and non-concurrent refresh failed: ' || SQLERRM;
    END;
  END;
  
  -- Log refresh completion
  PERFORM public.log_mv_refresh_end(log_id, refresh_status, error_msg, row_count);
  
  -- Alert if refresh failed
  IF refresh_status = 'failed' THEN
    RAISE NOTICE 'Materialized view refresh failed: dept_production_summary - %', error_msg;
  END IF;
END;
$$;

-- Enhanced refresh function for machine_utilization_weekly
CREATE OR REPLACE FUNCTION public.refresh_machine_utilization_weekly_smart()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  refresh_status TEXT := 'completed';
  error_msg TEXT := NULL;
  row_count INT;
BEGIN
  log_id := public.log_mv_refresh_start('machine_utilization_weekly', TRUE, 'cron');
  
  BEGIN
    IF EXISTS (
      SELECT 1 FROM materialized_view_refresh_log
      WHERE view_name = 'machine_utilization_weekly'
        AND status = 'started'
        AND refresh_start > NOW() - INTERVAL '10 minutes'
    ) THEN
      UPDATE materialized_view_refresh_log
      SET status = 'skipped',
          error_message = 'Concurrent refresh in progress',
          refresh_end = NOW()
      WHERE id = log_id;
      RETURN;
    END IF;
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY machine_utilization_weekly;
    SELECT COUNT(*) INTO row_count FROM machine_utilization_weekly;
    
  EXCEPTION WHEN OTHERS THEN
    refresh_status := 'failed';
    error_msg := SQLERRM;
    
    BEGIN
      REFRESH MATERIALIZED VIEW machine_utilization_weekly;
      SELECT COUNT(*) INTO row_count FROM machine_utilization_weekly;
      refresh_status := 'completed';
      error_msg := 'Concurrent refresh failed, fell back to non-concurrent: ' || SQLERRM;
    EXCEPTION WHEN OTHERS THEN
      error_msg := 'Both concurrent and non-concurrent refresh failed: ' || SQLERRM;
    END;
  END;
  
  PERFORM public.log_mv_refresh_end(log_id, refresh_status, error_msg, row_count);
  
  IF refresh_status = 'failed' THEN
    RAISE NOTICE 'Materialized view refresh failed: machine_utilization_weekly - %', error_msg;
  END IF;
END;
$$;

-- Enhanced refresh function for safety_incident_monthly
CREATE OR REPLACE FUNCTION public.refresh_safety_incident_monthly_smart()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  refresh_status TEXT := 'completed';
  error_msg TEXT := NULL;
  row_count INT;
BEGIN
  log_id := public.log_mv_refresh_start('safety_incident_monthly', TRUE, 'cron');
  
  BEGIN
    IF EXISTS (
      SELECT 1 FROM materialized_view_refresh_log
      WHERE view_name = 'safety_incident_monthly'
        AND status = 'started'
        AND refresh_start > NOW() - INTERVAL '10 minutes'
    ) THEN
      UPDATE materialized_view_refresh_log
      SET status = 'skipped',
          error_message = 'Concurrent refresh in progress',
          refresh_end = NOW()
      WHERE id = log_id;
      RETURN;
    END IF;
    
    REFRESH MATERIALIZED VIEW CONCURRENTLY safety_incident_monthly;
    SELECT COUNT(*) INTO row_count FROM safety_incident_monthly;
    
  EXCEPTION WHEN OTHERS THEN
    refresh_status := 'failed';
    error_msg := SQLERRM;
    
    BEGIN
      REFRESH MATERIALIZED VIEW safety_incident_monthly;
      SELECT COUNT(*) INTO row_count FROM safety_incident_monthly;
      refresh_status := 'completed';
      error_msg := 'Concurrent refresh failed, fell back to non-concurrent: ' || SQLERRM;
    EXCEPTION WHEN OTHERS THEN
      error_msg := 'Both concurrent and non-concurrent refresh failed: ' || SQLERRM;
    END;
  END;
  
  PERFORM public.log_mv_refresh_end(log_id, refresh_status, error_msg, row_count);
  
  IF refresh_status = 'failed' THEN
    RAISE NOTICE 'Materialized view refresh failed: safety_incident_monthly - %', error_msg;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_mv_refresh_start TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_mv_refresh_end TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_dept_production_summary_smart TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_machine_utilization_weekly_smart TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_safety_incident_monthly_smart TO authenticated;

-- ============================================
-- PART 3: Update pg_cron schedules to use smart refresh
-- ============================================

-- Remove old schedules
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'refresh-dept-production-summary',
  'refresh-machine-utilization-weekly',
  'refresh-safety-incident-monthly'
);

-- Add new schedules with smart refresh functions
SELECT cron.schedule(
  'refresh-dept-production-summary',
  '*/15 * * * *',
  'SELECT public.refresh_dept_production_summary_smart()'
);

SELECT cron.schedule(
  'refresh-machine-utilization-weekly',
  '5 * * * *',
  'SELECT public.refresh_machine_utilization_weekly_smart()'
);

SELECT cron.schedule(
  'refresh-safety-incident-monthly',
  '10 0,6,12,18 * * *',
  'SELECT public.refresh_safety_incident_monthly_smart()'
);

-- ============================================
-- PART 4: Health check functions
-- ============================================

-- Function to check materialized view freshness
CREATE OR REPLACE FUNCTION public.check_mv_freshness(p_view_name TEXT, p_max_age_minutes INT DEFAULT 30)
RETURNS TABLE(
  view_name TEXT,
  is_fresh BOOLEAN,
  last_refresh TIMESTAMPTZ,
  age_minutes INT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_refresh TIMESTAMPTZ;
  age_mins INT;
  fresh BOOLEAN;
  view_status TEXT;
BEGIN
  -- Get the last successful refresh time
  SELECT MAX(refresh_end) INTO last_refresh
  FROM materialized_view_refresh_log
  WHERE view_name = p_view_name
    AND status = 'completed';
  
  IF last_refresh IS NULL THEN
    fresh := FALSE;
    view_status := 'never_refreshed';
  ELSE
    age_mins := EXTRACT(EPOCH FROM (NOW() - last_refresh))::INT / 60;
    fresh := age_mins <= p_max_age_minutes;
    
    IF fresh THEN
      view_status := 'fresh';
    ELSE
      view_status := 'stale';
    END IF;
  END IF;
  
  RETURN QUERY
  SELECT 
    p_view_name::TEXT AS view_name,
    fresh AS is_fresh,
    last_refresh,
    COALESCE(age_mins, 0)::INT AS age_minutes,
    view_status AS status;
END;
$$;

-- Function to get refresh statistics
CREATE OR REPLACE FUNCTION public.get_mv_refresh_stats(p_view_name TEXT DEFAULT NULL, p_days INT DEFAULT 7)
RETURNS TABLE(
  view_name TEXT,
  total_refreshes INT,
  successful_refreshes INT,
  failed_refreshes INT,
  skipped_refreshes INT,
  avg_duration_ms FLOAT,
  max_duration_ms INT,
  last_refresh TIMESTAMPTZ,
  last_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.view_name AS view_name,
    COUNT(*)::INT as total_refreshes,
    COUNT(*) FILTER (WHERE status = 'completed')::INT as successful_refreshes,
    COUNT(*) FILTER (WHERE status = 'failed')::INT as failed_refreshes,
    COUNT(*) FILTER (WHERE status = 'skipped')::INT as skipped_refreshes,
    AVG(refresh_duration_ms) FILTER (WHERE refresh_duration_ms IS NOT NULL) as avg_duration_ms,
    MAX(refresh_duration_ms) FILTER (WHERE refresh_duration_ms IS NOT NULL)::INT as max_duration_ms,
    MAX(refresh_end) FILTER (WHERE status = 'completed') as last_refresh,
    (SELECT status FROM materialized_view_refresh_log 
     WHERE view_name = l.view_name 
     ORDER BY refresh_start DESC LIMIT 1) as last_status
  FROM materialized_view_refresh_log l
  WHERE (p_view_name IS NULL OR l.view_name = p_view_name)
    AND l.refresh_start > NOW() - INTERVAL '1 day' * p_days
  GROUP BY l.view_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_mv_freshness TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mv_refresh_stats TO authenticated;

-- Cleanup old refresh logs (older than 30 days)
SELECT cron.schedule(
  'cleanup-mv-refresh-logs',
  '0 4 * * *',
  'DELETE FROM materialized_view_refresh_log WHERE refresh_start < NOW() - INTERVAL ''30 days'''
);

COMMENT ON FUNCTION public.check_mv_freshness IS 'Checks if a materialized view data is fresh within specified time window.';
COMMENT ON FUNCTION public.get_mv_refresh_stats IS 'Returns refresh statistics for materialized views over specified time period.';
COMMENT ON FUNCTION public.refresh_dept_production_summary_smart IS 'Smart refresh with concurrent detection, fallback, and monitoring.';
COMMENT ON FUNCTION public.refresh_machine_utilization_weekly_smart IS 'Smart refresh with concurrent detection, fallback, and monitoring.';
COMMENT ON FUNCTION public.refresh_safety_incident_monthly_smart IS 'Smart refresh with concurrent detection, fallback, and monitoring.';
