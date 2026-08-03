-- ============================================
-- Migration: 019_sync_metadata
-- Description: Adds sync status columns, idempotency keys, and our C-Native dashboard aggregator function.
-- ============================================

-- 1. Alter daily_logs to add sync metadata
ALTER TABLE daily_logs 
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS idempotency_key UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Alter breakdowns to add sync metadata
ALTER TABLE breakdowns 
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS idempotency_key UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Alter safety_incidents to add sync metadata
ALTER TABLE safety_incidents 
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS idempotency_key UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Create our monolithized JSONB department dashboard RPC function
CREATE OR REPLACE FUNCTION get_monolithized_department_dashboard_payload(dept_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'department_id', dept_id,
    'daily_logs', (
      SELECT COALESCE(jsonb_agg(log_row), '[]'::jsonb)
      FROM (
        SELECT id, log_date, shift, notes, sync_status, idempotency_key, last_synced_at
        FROM daily_logs
        WHERE department_id = dept_id
        ORDER BY log_date DESC, shift DESC
        LIMIT 10
      ) log_row
    ),
    'breakdowns', (
      SELECT COALESCE(jsonb_agg(bd_row), '[]'::jsonb)
      FROM (
        SELECT id, fleet_id, machine_type, date_in, date_out, reason, status, sync_status, idempotency_key, last_synced_at
        FROM breakdowns
        WHERE department_id = dept_id AND deleted_at IS NULL
        ORDER BY date_in DESC
        LIMIT 10
      ) bd_row
    ),
    'safety_incidents', (
      SELECT COALESCE(jsonb_agg(inc_row), '[]'::jsonb)
      FROM (
        SELECT id, incident_date, shift_type, incident_type, description, status, sync_status, idempotency_key, last_synced_at
        FROM safety_incidents
        WHERE department_id = dept_id
        ORDER BY incident_date DESC
        LIMIT 10
      ) inc_row
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute rights to authenticated users
GRANT EXECUTE ON FUNCTION get_monolithized_department_dashboard_payload(UUID) TO authenticated;
