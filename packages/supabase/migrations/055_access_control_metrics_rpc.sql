-- ==========================================================
-- Migration 055: Consolidate access-control count queries
-- Replaces 22 separate head-count queries with one JSONB RPC.
-- ==========================================================

CREATE OR REPLACE FUNCTION get_access_control_metrics_jsonb(p_department_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS day_start,
      CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS now_utc,
      (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + interval '7 days' AS in_7_days
  ),
  badge_counts AS (
    SELECT
      COUNT(*) FILTER (WHERE is_active = true) AS total_active,
      COUNT(*) FILTER (WHERE is_active = true AND expires_at > p.in_7_days) AS active,
      COUNT(*) FILTER (WHERE is_active = true AND expires_at <= p.in_7_days AND expires_at > p.now_utc) AS expiring_soon,
      COUNT(*) FILTER (WHERE is_active = true AND expires_at < p.now_utc) AS expired,
      COUNT(*) FILTER (WHERE is_active = false) AS revoked,
      COUNT(*) FILTER (WHERE is_active = true AND entity_type = 'personnel') AS active_personnel,
      COUNT(*) FILTER (WHERE is_active = true AND entity_type = 'personnel' AND expires_at <= p.in_7_days AND expires_at > p.now_utc) AS expiring_personnel,
      COUNT(*) FILTER (WHERE is_active = true AND entity_type = 'personnel' AND expires_at < p.now_utc) AS expired_personnel,
      COUNT(*) FILTER (WHERE is_active = true AND entity_type = 'vehicle') AS active_fleet,
      COUNT(*) FILTER (WHERE is_active = true AND entity_type = 'vehicle' AND expires_at <= p.in_7_days AND expires_at > p.now_utc) AS expiring_fleet,
      COUNT(*) FILTER (WHERE is_active = true AND entity_type = 'vehicle' AND expires_at < p.now_utc) AS expired_fleet,
      COUNT(*) FILTER (WHERE is_active = true AND entity_type = 'equipment') AS active_equipment,
      COUNT(*) FILTER (WHERE is_active = true AND entity_type = 'equipment' AND expires_at <= p.in_7_days AND expires_at > p.now_utc) AS expiring_equipment,
      COUNT(*) FILTER (WHERE is_active = true AND entity_type = 'equipment' AND expires_at < p.now_utc) AS expired_equipment
    FROM badges, params p
    WHERE badges.department_id = p_department_id
  ),
  access_counts AS (
    SELECT
      COUNT(*) FILTER (WHERE access_granted = false) AS denied_today,
      COUNT(*) AS access_events_today
    FROM access_logs, params p
    WHERE access_logs.department_id = p_department_id
      AND access_logs.scanned_at >= p.day_start
  ),
  entity_counts AS (
    SELECT
      (SELECT COUNT(*) FROM personnel WHERE department_id = p_department_id) AS total_personnel,
      (SELECT COUNT(*) FROM fleet WHERE department_id = p_department_id) AS total_fleet,
      (SELECT COUNT(*) FROM equipment WHERE department_id = p_department_id) AS total_equipment
  )
  SELECT jsonb_build_object(
    'metrics', jsonb_build_object(
      'active_qr_codes', bc.total_active,
      'expiring_soon', bc.expiring_soon,
      'denied_today', ac.denied_today,
      'access_events_today', ac.access_events_today,
      'expired_assigned', bc.expired,
      'total_entities', ec.total_personnel
    ),
    'entity_badge_status', jsonb_build_object(
      'employees', jsonb_build_object(
        'total', ec.total_personnel,
        'active', bc.active_personnel,
        'expiring', bc.expiring_personnel,
        'expired', bc.expired_personnel
      ),
      'vehicles', jsonb_build_object(
        'total', ec.total_fleet,
        'active', bc.active_fleet,
        'expiring', bc.expiring_fleet,
        'expired', bc.expired_fleet
      ),
      'equipment', jsonb_build_object(
        'total', ec.total_equipment,
        'active', bc.active_equipment,
        'expiring', bc.expiring_equipment,
        'expired', bc.expired_equipment
      )
    ),
    'badge_status_distribution', jsonb_build_object(
      'active', bc.active,
      'expiring_soon', bc.expiring_soon,
      'expired', bc.expired,
      'revoked', bc.revoked
    )
  )
  FROM badge_counts bc, access_counts ac, entity_counts ec;
$$;

COMMENT ON FUNCTION get_access_control_metrics_jsonb(uuid) IS 'Returns all access-control dashboard counts as a single JSONB object, respecting caller RLS.';
