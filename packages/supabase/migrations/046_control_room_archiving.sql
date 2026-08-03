-- ============================================
-- Migration: 046_control_room_archiving
-- Description: Archive tables and monthly archival function for all
--              Control Room operational tables. Only archives rows that
--              are (a) older than the start of the current month AND
--              (b) belong to a shift marked 'closed' in shift_status.
--              Mirrors the drill_operations pattern from migration 027.
-- ============================================

-- ============================================
-- 1. machine_operations_archive
-- ============================================
CREATE TABLE IF NOT EXISTS machine_operations_archive (
  LIKE machine_operations INCLUDING ALL
);

ALTER TABLE machine_operations_archive
  DROP CONSTRAINT IF EXISTS machine_operations_machine_id_shift_date_shift_type_start_time_key;

ALTER TABLE machine_operations_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "machine_operations_archive_select" ON machine_operations_archive;
CREATE POLICY "machine_operations_archive_select"
  ON machine_operations_archive FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- ============================================
-- 2. excavator_activity_archive
-- ============================================
CREATE TABLE IF NOT EXISTS excavator_activity_archive (
  LIKE excavator_activity INCLUDING ALL
);

ALTER TABLE excavator_activity_archive
  DROP CONSTRAINT IF EXISTS excavator_activity_machine_id_activity_date_shift_type_key;

ALTER TABLE excavator_activity_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "excavator_activity_archive_select" ON excavator_activity_archive;
CREATE POLICY "excavator_activity_archive_select"
  ON excavator_activity_archive FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- ============================================
-- 3. excavator_dumper_assignments_archive
--    (no department_id — access controlled via join to archived activity)
-- ============================================
CREATE TABLE IF NOT EXISTS excavator_dumper_assignments_archive (
  LIKE excavator_dumper_assignments INCLUDING ALL
);

ALTER TABLE excavator_dumper_assignments_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "excavator_dumper_assignments_archive_select" ON excavator_dumper_assignments_archive;
CREATE POLICY "excavator_dumper_assignments_archive_select"
  ON excavator_dumper_assignments_archive FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM excavator_activity_archive ea
      WHERE ea.id = excavator_dumper_assignments_archive.excavator_activity_id
        AND public.has_department_access(ea.department_id)
    )
  );

-- ============================================
-- 4. operational_delays_archive
-- ============================================
CREATE TABLE IF NOT EXISTS operational_delays_archive (
  LIKE operational_delays INCLUDING ALL
);

ALTER TABLE operational_delays_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "operational_delays_archive_select" ON operational_delays_archive;
CREATE POLICY "operational_delays_archive_select"
  ON operational_delays_archive FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- ============================================
-- 5. dozer_rolls_archive
-- ============================================
CREATE TABLE IF NOT EXISTS dozer_rolls_archive (
  LIKE dozer_rolls INCLUDING ALL
);

ALTER TABLE dozer_rolls_archive
  DROP CONSTRAINT IF EXISTS dozer_rolls_machine_id_roll_date_shift_type_key;

ALTER TABLE dozer_rolls_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dozer_rolls_archive_select" ON dozer_rolls_archive;
CREATE POLICY "dozer_rolls_archive_select"
  ON dozer_rolls_archive FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- ============================================
-- 6. engineering_notes_archive
-- ============================================
CREATE TABLE IF NOT EXISTS engineering_notes_archive (
  LIKE engineering_notes INCLUDING ALL
);

ALTER TABLE engineering_notes_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "engineering_notes_archive_select" ON engineering_notes_archive;
CREATE POLICY "engineering_notes_archive_select"
  ON engineering_notes_archive FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id));

-- ============================================
-- 7. Archival function
--    Conditions: date < start of current month AND shift is closed
-- ============================================
CREATE OR REPLACE FUNCTION archive_monthly_control_room_shifts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cutoff DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  -- machine_operations
  WITH moved AS (
    DELETE FROM machine_operations mo
    WHERE mo.shift_date < cutoff
      AND EXISTS (
        SELECT 1 FROM shift_status ss
        WHERE ss.department_id = mo.department_id
          AND ss.shift_date     = mo.shift_date
          AND ss.shift_type     = mo.shift_type
          AND ss.status         = 'closed'
      )
    RETURNING *
  )
  INSERT INTO machine_operations_archive SELECT * FROM moved;

  -- excavator_activity + cascade its dumper_assignments
  WITH moved_activity AS (
    DELETE FROM excavator_activity ea
    WHERE ea.activity_date < cutoff
      AND EXISTS (
        SELECT 1 FROM shift_status ss
        WHERE ss.department_id = ea.department_id
          AND ss.shift_date     = ea.activity_date
          AND ss.shift_type     = ea.shift_type
          AND ss.status         = 'closed'
      )
    RETURNING *
  ),
  inserted_activity AS (
    INSERT INTO excavator_activity_archive SELECT * FROM moved_activity
    RETURNING id
  ),
  moved_assignments AS (
    DELETE FROM excavator_dumper_assignments eda
    WHERE eda.excavator_activity_id IN (SELECT id FROM inserted_activity)
    RETURNING *
  )
  INSERT INTO excavator_dumper_assignments_archive SELECT * FROM moved_assignments;

  -- operational_delays
  WITH moved AS (
    DELETE FROM operational_delays od
    WHERE od.delay_date < cutoff
      AND EXISTS (
        SELECT 1 FROM shift_status ss
        WHERE ss.department_id = od.department_id
          AND ss.shift_date     = od.delay_date
          AND ss.shift_type     = od.shift_type
          AND ss.status         = 'closed'
      )
    RETURNING *
  )
  INSERT INTO operational_delays_archive SELECT * FROM moved;

  -- dozer_rolls
  WITH moved AS (
    DELETE FROM dozer_rolls dr
    WHERE dr.roll_date < cutoff
      AND EXISTS (
        SELECT 1 FROM shift_status ss
        WHERE ss.department_id = dr.department_id
          AND ss.shift_date     = dr.roll_date
          AND ss.shift_type     = dr.shift_type
          AND ss.status         = 'closed'
      )
    RETURNING *
  )
  INSERT INTO dozer_rolls_archive SELECT * FROM moved;

  -- engineering_notes
  WITH moved AS (
    DELETE FROM engineering_notes en
    WHERE en.note_date < cutoff
      AND EXISTS (
        SELECT 1 FROM shift_status ss
        WHERE ss.department_id = en.department_id
          AND ss.shift_date     = en.note_date
          AND ss.shift_type     = en.shift_type
          AND ss.status         = 'closed'
      )
    RETURNING *
  )
  INSERT INTO engineering_notes_archive SELECT * FROM moved;

  RAISE NOTICE 'archive_monthly_control_room_shifts: completed for cutoff %', cutoff;
END;
$$;

GRANT EXECUTE ON FUNCTION archive_monthly_control_room_shifts() TO authenticated;

-- ============================================
-- 8. pg_cron schedule
--    Run on the 2nd of each month at 00:01 (day after partition creation)
-- ============================================
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'archive-control-room-shifts';

SELECT cron.schedule(
  'archive-control-room-shifts',
  '1 0 2 * *',
  'SELECT archive_monthly_control_room_shifts()'
);
