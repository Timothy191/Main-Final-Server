-- ============================================
-- Migration: 066_fix_health_check_functions
-- Description: Fix ambiguous column references in health check functions
-- ============================================

-- Drop and recreate the health check functions with proper column naming to avoid ambiguity
DROP FUNCTION IF EXISTS public.check_mv_freshness(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_mv_refresh_stats(TEXT, INT);

-- Recreate the health check function with unique column names to avoid ambiguity
CREATE OR REPLACE FUNCTION public.check_mv_freshness(p_view_name TEXT, p_max_age_minutes INT DEFAULT 30)
RETURNS TABLE(
  mv_name TEXT,
  is_fresh BOOLEAN,
  last_refresh TIMESTAMPTZ,
  age_minutes INT,
  refresh_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_refresh TIMESTAMPTZ;
  v_age_mins INT;
  v_fresh BOOLEAN;
  v_status TEXT;
BEGIN
  -- Get the last successful refresh time
  SELECT MAX(refresh_end) INTO v_last_refresh
  FROM materialized_view_refresh_log
  WHERE view_name = p_view_name
    AND status = 'completed';
  
  IF v_last_refresh IS NULL THEN
    v_fresh := FALSE;
    v_status := 'never_refreshed';
  ELSE
    v_age_mins := EXTRACT(EPOCH FROM (NOW() - v_last_refresh))::INT / 60;
    v_fresh := v_age_mins <= p_max_age_minutes;
    
    IF v_fresh THEN
      v_status := 'fresh';
    ELSE
      v_status := 'stale';
    END IF;
  END IF;
  
  RETURN QUERY
  SELECT 
    p_view_name::TEXT AS mv_name,
    v_fresh AS is_fresh,
    v_last_refresh AS last_refresh,
    COALESCE(v_age_mins, 0)::INT AS age_minutes,
    v_status AS refresh_status;
END;
$$;

-- Recreate the refresh stats function with unique column names
CREATE OR REPLACE FUNCTION public.get_mv_refresh_stats(p_view_name TEXT DEFAULT NULL, p_days INT DEFAULT 7)
RETURNS TABLE(
  mv_name TEXT,
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
    l.view_name AS mv_name,
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

COMMENT ON FUNCTION public.check_mv_freshness IS 'Checks if a materialized view data is fresh within specified time window.';
COMMENT ON FUNCTION public.get_mv_refresh_stats IS 'Returns refresh statistics for materialized views over specified time period.';
