-- ==========================================================
-- Telemetry Webhook Integration (Option B)
-- Triggers a pg_net HTTP POST request to the configured Next.js
-- API endpoint on inserts into the machine_telemetry table.
-- ==========================================================

-- Ensure the pg_net extension is enabled for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the trigger function
CREATE OR REPLACE FUNCTION notify_telemetry_webhook()
RETURNS TRIGGER AS $$
DECLARE
  v_url TEXT;
  v_payload JSONB;
BEGIN
  -- Resolve the target URL from the webhook_endpoints table for 'telemetry.created' events
  SELECT url INTO v_url
  FROM webhook_endpoints
  WHERE active = true
    AND 'telemetry.created' = ANY(event_types)
    AND deleted_at IS NULL
  LIMIT 1;

  -- If an endpoint is registered and active, dispatch the HTTP request asynchronously
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on machine_telemetry table
DROP TRIGGER IF EXISTS machine_telemetry_webhook_insert ON machine_telemetry;
CREATE TRIGGER machine_telemetry_webhook_insert
  AFTER INSERT ON machine_telemetry
  FOR EACH ROW
  EXECUTE FUNCTION notify_telemetry_webhook();

-- Add documentation comment
COMMENT ON FUNCTION notify_telemetry_webhook() IS 'Dispatches real-time telemetry inserts to external SCADA listeners via pg_net';
