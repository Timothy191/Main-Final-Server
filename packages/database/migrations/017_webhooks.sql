-- Webhook System for Arch-Systems
-- Enables real-time event notifications to external systems via Svix

-- Webhook Endpoints Table
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  description TEXT,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  secret TEXT,
  svix_endpoint_id TEXT, -- Reference to Svix endpoint ID
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Webhook Delivery Logs Table
CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_department_id ON webhook_endpoints(department_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON webhook_endpoints(active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_event_types ON webhook_endpoints USING GIN(event_types);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_endpoint_id ON webhook_delivery_logs(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_event_type ON webhook_delivery_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_created_at ON webhook_delivery_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook_endpoints
-- Admins can do everything
CREATE POLICY "admins_full_access_webhook_endpoints"
  ON webhook_endpoints
  FOR ALL
  USING (auth.uid() IN (
    SELECT e.auth_id FROM employees e WHERE e.role = 'admin'
  ));

-- Supervisors can view webhooks for their department
CREATE POLICY "supervisors_view_department_webhooks"
  ON webhook_endpoints
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT e.auth_id 
      FROM employees e 
      WHERE e.role IN ('supervisor', 'admin')
      AND (
        e.department_id = webhook_endpoints.department_id
        OR webhook_endpoints.department_id = ANY(e.accessible_departments)
      )
    )
  );

-- Supervisors can create webhooks for their department
CREATE POLICY "supervisors_create_department_webhooks"
  ON webhook_endpoints
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT e.auth_id 
      FROM employees e 
      WHERE e.role IN ('supervisor', 'admin')
      AND (
        e.department_id = department_id
        OR department_id = ANY(e.accessible_departments)
      )
    )
  );

-- Supervisors can update webhooks for their department
CREATE POLICY "supervisors_update_department_webhooks"
  ON webhook_endpoints
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT e.auth_id 
      FROM employees e 
      WHERE e.role IN ('supervisor', 'admin')
      AND (
        e.department_id = webhook_endpoints.department_id
        OR webhook_endpoints.department_id = ANY(e.accessible_departments)
      )
    )
  );

-- RLS Policies for webhook_delivery_logs
-- Admins can view all logs
CREATE POLICY "admins_view_all_delivery_logs"
  ON webhook_delivery_logs
  FOR SELECT
  USING (auth.uid() IN (
    SELECT e.auth_id FROM employees e WHERE e.role = 'admin'
  ));

-- Supervisors can view logs for their department's webhooks
CREATE POLICY "supervisors_view_department_delivery_logs"
  ON webhook_delivery_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT e.auth_id 
      FROM employees e 
      WHERE e.role IN ('supervisor', 'admin')
      AND (
        e.department_id = (
          SELECT we.department_id 
          FROM webhook_endpoints we 
          WHERE we.id = webhook_delivery_logs.webhook_endpoint_id
        )
        OR (
          SELECT we.department_id 
          FROM webhook_endpoints we 
          WHERE we.id = webhook_delivery_logs.webhook_endpoint_id
        ) = ANY(e.accessible_departments)
      )
    )
  );

-- System can insert delivery logs (via triggers)
CREATE POLICY "system_insert_delivery_logs"
  ON webhook_delivery_logs
  FOR INSERT
  WITH CHECK (true);

-- Function to trigger webhook delivery
CREATE OR REPLACE FUNCTION trigger_webhook_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by triggers on key tables
  -- It will queue webhook deliveries to Svix
  -- Implementation will be added in the next migration
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add audit logging support
CREATE TRIGGER webhook_endpoints_audit
  AFTER INSERT OR UPDATE OR DELETE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER webhook_delivery_logs_audit
  AFTER INSERT OR UPDATE ON webhook_delivery_logs
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Add updated_at trigger
CREATE TRIGGER webhook_endpoints_updated_at
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE webhook_endpoints IS 'Stores webhook endpoint configurations for external integrations';
COMMENT ON TABLE webhook_delivery_logs IS 'Logs all webhook delivery attempts for monitoring and debugging';
COMMENT ON COLUMN webhook_endpoints.svix_endpoint_id IS 'Reference to the Svix endpoint ID for webhook management';
COMMENT ON COLUMN webhook_delivery_logs.retry_count IS 'Number of retry attempts for failed deliveries';
