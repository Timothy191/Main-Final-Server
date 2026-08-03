-- ============================================================
-- Arch-Mk2 local development seed
-- ============================================================
-- Loaded by `supabase db reset` (referenced in config.toml [db.seed].sql_paths)
-- AFTER migrations run. This file is idempotent and safe to re-run.
--
-- IMPORTANT: do NOT seed `employees` here. employees.auth_id has a FK to
-- auth.users, which is created by the handle_new_user() trigger on signup.
-- Seed only operational tables that reference `departments` (already seeded
-- by migration 005_seed_data.sql).
-- ============================================================

-- ---- Sample daily logs (one per core department) ----
DO $$
DECLARE
  v_drilling   uuid;
  v_production uuid;
  v_safety     uuid;
BEGIN
  SELECT id INTO v_drilling   FROM departments WHERE name = 'drilling';
  SELECT id INTO v_production FROM departments WHERE name = 'production';
  SELECT id INTO v_safety     FROM departments WHERE name = 'safety';

  IF v_drilling IS NOT NULL THEN
    INSERT INTO daily_logs (id, department_id, log_date, shift, created_at, notes, sync_status)
    SELECT gen_random_uuid(), v_drilling, current_date, 'day', now(),
           'Seed: routine drilling shift — bit depth telemetry nominal.', 'synced'
    WHERE NOT EXISTS (
      SELECT 1 FROM daily_logs WHERE department_id = v_drilling AND log_date = current_date AND shift = 'day'
    );
  END IF;

  IF v_production IS NOT NULL THEN
    INSERT INTO daily_logs (id, department_id, log_date, shift, created_at, notes, sync_status)
    SELECT gen_random_uuid(), v_production, current_date, 'day', now(),
           'Seed: production shift — coal tonnage on target.', 'synced'
    WHERE NOT EXISTS (
      SELECT 1 FROM daily_logs WHERE department_id = v_production AND log_date = current_date AND shift = 'day'
    );
  END IF;

  IF v_safety IS NOT NULL THEN
    INSERT INTO daily_logs (id, department_id, log_date, shift, created_at, notes, sync_status)
    SELECT gen_random_uuid(), v_safety, current_date, 'night', now(),
           'Seed: safety patrol — no incidents reported.', 'synced'
    WHERE NOT EXISTS (
      SELECT 1 FROM daily_logs WHERE department_id = v_safety AND log_date = current_date AND shift = 'night'
    );
  END IF;
END $$;

-- ---- Sample breakdown record ----
DO $$
DECLARE
  v_eng uuid;
BEGIN
  SELECT id INTO v_eng FROM departments WHERE name = 'engineering';
  IF v_eng IS NOT NULL THEN
    INSERT INTO breakdowns (id, department_id, fleet_id, machine_type, date_in, reason, status, missing_book_in, created_at, updated_at, sync_status)
    SELECT gen_random_uuid(), v_eng, 'FLT-SEED', 'Excavator', current_date,
           'Seed: scheduled hydraulic inspection.', 'active', false, now(), now(), 'synced'
    WHERE NOT EXISTS (
      SELECT 1 FROM breakdowns WHERE department_id = v_eng AND reason LIKE 'Seed:%' AND date_in = current_date
    );
  END IF;
END $$;
