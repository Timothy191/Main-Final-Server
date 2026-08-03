-- Migration 039: Add operator and device_id columns to access_logs
-- These fields capture which gate reader / operator processed each scan event.

ALTER TABLE access_logs
  ADD COLUMN IF NOT EXISTS operator text,
  ADD COLUMN IF NOT EXISTS device_id text;

-- Backfill existing rows with a sentinel value so they're identifiable as pre-migration
UPDATE access_logs
  SET operator = 'System', device_id = 'LEGACY'
  WHERE operator IS NULL;

-- Index for device-based queries (e.g. "all events from gate reader X")
CREATE INDEX IF NOT EXISTS idx_access_logs_device_id ON access_logs(device_id);
