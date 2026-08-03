-- Webhook Triggers for Key Events
-- Automatically sends webhook notifications when important events occur

-- Function to queue webhook delivery
CREATE OR REPLACE FUNCTION queue_webhook_delivery()
RETURNS TRIGGER AS $$
DECLARE
  event_type TEXT;
  payload JSONB;
  webhook RECORD;
  dept_id UUID;
BEGIN
  -- Determine event type and department ID based on table and operation
  IF TG_TABLE_NAME = 'daily_logs' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'daily_log.created';
    ELSIF TG_OP = 'UPDATE' THEN
      event_type := 'daily_log.updated';
    ELSE
      RETURN NEW;
    END IF;
    dept_id := NEW.department_id;
    payload := jsonb_build_object(
      'id', NEW.id,
      'department_id', NEW.department_id,
      'log_date', NEW.log_date,
      'shift', NEW.shift,
      'notes', NEW.notes,
      'created_at', NEW.created_at
    );
  ELSIF TG_TABLE_NAME = 'breakdowns' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'breakdown.created';
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        event_type := 'breakdown.completed';
      ELSE
        event_type := 'breakdown.updated';
      END IF;
    ELSE
      RETURN NEW;
    END IF;
    dept_id := NEW.department_id;
    payload := jsonb_build_object(
      'id', NEW.id,
      'department_id', NEW.department_id,
      'fleet_id', NEW.fleet_id,
      'machine_type', NEW.machine_type,
      'date_in', NEW.date_in,
      'time_in', NEW.time_in,
      'date_out', NEW.date_out,
      'time_out', NEW.time_out,
      'reason', NEW.reason,
      'status', NEW.status,
      'created_at', NEW.created_at
    );
  ELSIF TG_TABLE_NAME = 'safety_incidents' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'safety_incident.created';
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        event_type := 'safety_incident.resolved';
      ELSE
        event_type := 'safety_incident.updated';
      END IF;
    ELSE
      RETURN NEW;
    END IF;
    dept_id := NEW.department_id;
    payload := jsonb_build_object(
      'id', NEW.id,
      'department_id', NEW.department_id,
      'incident_date', NEW.incident_date,
      'shift_type', NEW.shift_type,
      'incident_type', NEW.incident_type,
      'description', NEW.description,
      'location', NEW.location,
      'injured_parties', NEW.injured_parties,
      'status', NEW.status,
      'created_at', NEW.created_at
    );
  ELSIF TG_TABLE_NAME = 'production_logs' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'production_log.created';
    ELSIF TG_OP = 'UPDATE' THEN
      event_type := 'production_log.updated';
    ELSE
      RETURN NEW;
    END IF;
    -- Resolve department_id by looking up referenced daily_logs record
    SELECT department_id INTO dept_id FROM daily_logs WHERE id = NEW.daily_log_id;
    payload := jsonb_build_object(
      'id', NEW.id,
      'daily_log_id', NEW.daily_log_id,
      'coal_tonnes', NEW.coal_tonnes,
      'waste_tonnes', NEW.waste_tonnes,
      'created_at', NEW.created_at
    );
  ELSIF TG_TABLE_NAME = 'operational_delays' THEN
    IF TG_OP = 'INSERT' THEN
      event_type := 'operational_delay.created';
    ELSIF TG_OP = 'UPDATE' THEN
      event_type := 'operational_delay.updated';
    ELSE
      RETURN NEW;
    END IF;
    dept_id := NEW.department_id;
    payload := jsonb_build_object(
      'id', NEW.id,
      'department_id', NEW.department_id,
      'delay_date', NEW.delay_date,
      'shift_type', NEW.shift_type,
      'delay_type', NEW.delay_type,
      'delay_minutes', NEW.delay_minutes,
      'description', NEW.description,
      'status', NEW.status,
      'created_at', NEW.created_at
    );
  ELSE
    RETURN NEW;
  END IF;

  -- Queue webhook deliveries for all active endpoints matching the event type
  FOR webhook IN 
    SELECT id, url, secret
    FROM webhook_endpoints
    WHERE deleted_at IS NULL
      AND active = true
      AND event_type = ANY(event_types)
      AND (department_id IS NULL OR department_id = dept_id)
  LOOP
    INSERT INTO webhook_delivery_logs (
      webhook_endpoint_id,
      event_type,
      payload,
      response_status,
      response_body,
      delivered_at,
      retry_count,
      success,
      error_message
    ) VALUES (
      webhook.id,
      event_type,
      payload,
      NULL,
      NULL,
      NULL,
      0,
      false,
      'Queued for delivery'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for daily_logs
CREATE TRIGGER daily_logs_webhook_insert
  AFTER INSERT ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

CREATE TRIGGER daily_logs_webhook_update
  AFTER UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

-- Create triggers for breakdowns
CREATE TRIGGER breakdowns_webhook_insert
  AFTER INSERT ON breakdowns
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

CREATE TRIGGER breakdowns_webhook_update
  AFTER UPDATE ON breakdowns
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

-- Create triggers for safety_incidents
CREATE TRIGGER safety_incidents_webhook_insert
  AFTER INSERT ON safety_incidents
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

CREATE TRIGGER safety_incidents_webhook_update
  AFTER UPDATE ON safety_incidents
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

-- Create triggers for production_logs
CREATE TRIGGER production_logs_webhook_insert
  AFTER INSERT ON production_logs
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

CREATE TRIGGER production_logs_webhook_update
  AFTER UPDATE ON production_logs
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

-- Create triggers for operational_delays
CREATE TRIGGER operational_delays_webhook_insert
  AFTER INSERT ON operational_delays
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

CREATE TRIGGER operational_delays_webhook_update
  AFTER UPDATE ON operational_delays
  FOR EACH ROW
  EXECUTE FUNCTION queue_webhook_delivery();

-- Comments for documentation
COMMENT ON FUNCTION queue_webhook_delivery() IS 'Queues webhook deliveries for key events across the system';
COMMENT ON TRIGGER daily_logs_webhook_insert ON daily_logs IS 'Triggers webhook delivery when daily log is created';
COMMENT ON TRIGGER daily_logs_webhook_update ON daily_logs IS 'Triggers webhook delivery when daily log is updated';
COMMENT ON TRIGGER breakdowns_webhook_insert ON breakdowns IS 'Triggers webhook delivery when breakdown is created';
COMMENT ON TRIGGER breakdowns_webhook_update ON breakdowns IS 'Triggers webhook delivery when breakdown is updated';
COMMENT ON TRIGGER safety_incidents_webhook_insert ON safety_incidents IS 'Triggers webhook delivery when safety incident is created';
COMMENT ON TRIGGER safety_incidents_webhook_update ON safety_incidents IS 'Triggers webhook delivery when safety incident is updated';
