-- ============================================
-- Migration: 033_access_logs_weekly_archival
-- Description: Add alcohol_tested column, create weekly archival
--              infrastructure for access_logs, schedule pg_cron job.
-- ============================================

-- 1. Add alcohol_tested column to access_logs
ALTER TABLE access_logs
  ADD COLUMN IF NOT EXISTS alcohol_tested text NOT NULL DEFAULT 'Approved'
  CHECK (alcohol_tested IN ('Approved', 'Failed', 'Not Tested'));

-- ============================================
-- 2. Weekly Archive Table
-- ============================================
CREATE TABLE IF NOT EXISTS access_logs_archive (
  LIKE access_logs INCLUDING ALL
);

-- Add week identifier column for easy retrieval
ALTER TABLE access_logs_archive
  ADD COLUMN IF NOT EXISTS archived_week_start date NOT NULL DEFAULT '1970-01-05';

-- ============================================
-- 3. Archival Function
-- Moves logs from previous ISO weeks into the archive
-- ============================================
CREATE OR REPLACE FUNCTION archive_weekly_access_logs()
RETURNS void AS $$
DECLARE
  week_boundary timestamptz;
  week_start date;
BEGIN
  -- Start of the previous ISO week (Monday 00:00)
  week_boundary := date_trunc('week', CURRENT_DATE - interval '7 days');
  week_start := week_boundary::date;

  -- Move rows older than the week boundary into archive
  WITH moved_rows AS (
    DELETE FROM access_logs
    WHERE scanned_at < week_boundary
    RETURNING *
  )
  INSERT INTO access_logs_archive
  SELECT *, week_start FROM moved_rows;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. RLS on Archive Table
-- ============================================
ALTER TABLE access_logs_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_logs_archive_select"
  ON access_logs_archive FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR e.role = 'access_control'
          OR e.department_id = access_logs_archive.department_id
        )
    )
  );

-- ============================================
-- 5. Indexes on Archive Table
-- ============================================
CREATE INDEX IF NOT EXISTS idx_access_logs_archive_week_start
  ON access_logs_archive(archived_week_start);
CREATE INDEX IF NOT EXISTS idx_access_logs_archive_scanned_at
  ON access_logs_archive(scanned_at DESC);

-- ============================================
-- 6. Schedule pg_cron Job (Sunday 00:00)
-- ============================================
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'archive-weekly-access-logs';

SELECT cron.schedule(
  'archive-weekly-access-logs',
  '0 0 * * 0',
  'SELECT public.archive_weekly_access_logs()'
);