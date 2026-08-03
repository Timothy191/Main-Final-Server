-- ============================================
-- AI Usage Logs — Per-request token cost tracking
-- ============================================
-- Tracks every AI chat request: tokens consumed, provider used, estimated cost.
-- Enables per-user, per-session, and per-model spend visibility.
--
-- Used by: apps/portal/lib/ai/cost-tracker.ts
-- ============================================

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(12,6) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes for fast aggregation queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created
  ON ai_usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_session
  ON ai_usage_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model
  ON ai_usage_logs(model, created_at DESC);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_select_own"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

CREATE POLICY "usage_insert_service"
  ON ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Service role inserts; RLS on read

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE TRIGGER update_ai_usage_logs_updated_at
  BEFORE UPDATE ON ai_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper: daily spend per user
-- ============================================
CREATE OR REPLACE FUNCTION get_user_daily_spend(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(12,6)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(estimated_cost_usd), 0)
  FROM ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at::DATE = p_date;
$$;
