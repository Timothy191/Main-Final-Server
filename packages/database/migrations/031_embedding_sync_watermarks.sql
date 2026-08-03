-- ============================================
-- Embedding Sync Watermarks — Tracking table for pgai-style auto-vectorization
-- ============================================
-- This table stores the last-processed row ID per source table,
-- enabling incremental embedding sync without re-processing old data.
--
-- Used by: apps/portal/lib/ai/embedding-sync.ts
-- ============================================

CREATE TABLE IF NOT EXISTS sync_watermarks (
  table_name TEXT PRIMARY KEY,
  last_processed_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: only the application service role can read/write watermarks
ALTER TABLE sync_watermarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_watermarks_service_only"
  ON sync_watermarks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_sync_watermarks_updated_at
  BEFORE UPDATE ON sync_watermarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE sync_watermarks IS
  'Tracks last-processed row IDs for incremental embedding sync (pgai-style).';
