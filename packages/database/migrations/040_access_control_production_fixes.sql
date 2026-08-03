-- Migration 040: Access Control production fixes
-- 1. Add expires_at column to badges (replaces issued_at + 1yr heuristic)
-- 2. Add RLS DELETE policy on access_logs for admin only (audit integrity)
-- 3. Add scanner_key column to access_logs for future API key tracking

-- ============================================
-- 1. Badge expiry column
-- ============================================
ALTER TABLE badges
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Backfill: set expires_at = issued_at + 1 year for all existing active badges
UPDATE badges
  SET expires_at = issued_at + interval '1 year'
  WHERE expires_at IS NULL
    AND issued_at IS NOT NULL
    AND is_active = true;

-- Index for expiry queries (dashboard KPI, auditing)
CREATE INDEX IF NOT EXISTS idx_badges_expires_at ON badges(expires_at)
  WHERE is_active = true;

-- ============================================
-- 2. RLS DELETE on access_logs — admin only
-- Logs should never be deleted by operators.
-- Only admins can delete, and only via explicit action.
-- ============================================
DROP POLICY IF EXISTS "Allow admin delete access_logs" ON access_logs;
CREATE POLICY "Allow admin delete access_logs" ON access_logs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = auth.uid()
        AND role = 'admin'
    )
  );

-- ============================================
-- 3. RLS DELETE on access_logs_archive — admin only
-- ============================================
DROP POLICY IF EXISTS "Allow admin delete access_logs_archive" ON access_logs_archive;
CREATE POLICY "Allow admin delete access_logs_archive" ON access_logs_archive
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE auth_id = auth.uid()
        AND role = 'admin'
    )
  );
