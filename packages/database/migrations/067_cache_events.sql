-- ============================================
-- AMCA Brain: Cache Observability Tables
-- ============================================

-- Table for raw cache events ingested from Redis Streams
CREATE TABLE IF NOT EXISTS cache_events (
  id BIGSERIAL PRIMARY KEY,
  event VARCHAR(20) NOT NULL, -- 'hit', 'miss', 'invalidate'
  source VARCHAR(20),        -- 'l1', 'l2', 'edge'
  latency_ms FLOAT,
  details JSONB,             -- tags, keys, reasons
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for detected anomalies by the ci-observer
CREATE TABLE IF NOT EXISTS cache_anomalies (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,    -- 'storm', 'thrashing'
  severity VARCHAR(10) NOT NULL, -- 'low', 'medium', 'high'
  details JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analysis
CREATE INDEX IF NOT EXISTS idx_cache_events_timestamp ON cache_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_cache_events_event ON cache_events(event);
CREATE INDEX IF NOT EXISTS idx_cache_anomalies_timestamp ON cache_anomalies(timestamp);

-- Enable RLS (Internal only, but good practice)
ALTER TABLE cache_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_anomalies ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE cache_events IS 'Raw observability data from the distributed cache mesh.';
COMMENT ON TABLE cache_anomalies IS 'Anomalies detected by the CI Observer brain.';
