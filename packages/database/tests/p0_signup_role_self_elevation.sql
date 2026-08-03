-- ============================================
-- P0 Security: sign-up admin self-elevation via raw_user_meta_data.role
-- ============================================
--
-- Bug: the public.handle_new_user() trigger (defined in
-- packages/database/migrations/001_initial.sql) reads
--   COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
-- when inserting the new row into public.employees. A new user who
-- signs up via `supabase.auth.signUp({ options: { data: { role: 'admin' } } })`
-- therefore lands in public.employees with role = 'admin' on their very
-- first request — full admin, no invitation required.
--
-- Expected behavior: the trigger MUST ignore client-supplied roles and
-- always assign a non-privileged default. Privilege elevation must be
-- performed only by an existing admin (or by a controlled bootstrap path
-- like packages/database/migrations/052_seed_admin_user.sql).
--
-- This test reproduces the exploit path: insert directly into
-- auth.users with raw_user_meta_data set to {'role': 'admin'}, let the
-- AFTER INSERT trigger fire, then assert that the resulting employees
-- row does NOT have role = 'admin'. The whole test runs inside a
-- single transaction that rolls back, leaving the database untouched.
--
-- Run with:
--   PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres \
--     -d postgres -v ON_ERROR_STOP=1 \
--     -f packages/database/tests/p0_signup_role_self_elevation.sql
--
-- Requires: local Supabase running on :54322 (pnpm supabase:dev).
-- All assertions are at the bottom; the script aborts on the first
-- failure (psql exits non-zero) so a red CI run is unambiguous.

BEGIN;

-- ---------- arrange: a department so we can test the legitimate case too ----------
-- (Not strictly required for the exploit path, but exercises the trigger
-- end-to-end the same way the seed migration does.)

-- ---------- act 1: attacker signs up passing role = 'admin' in metadata ----------
-- We bypass supabase.auth.signUp() and insert directly into auth.users
-- with raw_user_meta_data set the same way the client would. The
-- AFTER INSERT trigger on_auth_user_created fires public.handle_new_user(),
-- which is the function under test.
DO $$
DECLARE
  attacker_auth_id UUID := gen_random_uuid();
  attacker_role    TEXT;
  attacker_name    TEXT;
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    attacker_auth_id,
    'authenticated',
    'authenticated',
    'attacker+self-elevate@example.test',
    crypt('whatever', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('role', 'admin', 'full_name', 'Mallory'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  SELECT e.role, e.full_name
    INTO attacker_role, attacker_name
    FROM public.employees e
   WHERE e.auth_id = attacker_auth_id;

  IF attacker_role IS NULL THEN
    RAISE EXCEPTION 'FAIL: trigger did not create employees row for new auth user';
  END IF;

  IF attacker_role = 'admin' THEN
    RAISE EXCEPTION
      'P0 EXPLOIT CONFIRMED: signup with raw_user_meta_data.role = ''admin'' '
      'resulted in employees.role = ''admin'' (full_name=%, auth_id=%). '
      'handle_new_user() is trusting client-supplied raw_user_meta_data. '
      'This is the P0 self-elevation bug.',
      attacker_name, attacker_auth_id;
  END IF;

  -- Stash for the final report row.
  RAISE NOTICE 'PASS attempt 1: attacker-supplied role=admin was rejected; '
               'employees.role=% (expected non-admin default)', attacker_role;
END
$$;

-- ---------- act 2: legitimate signup with no role in metadata ----------
-- Sanity check that the trigger still creates an employee row for a
-- normal user. This is the path that MUST keep working after the fix.
DO $$
DECLARE
  normal_auth_id UUID := gen_random_uuid();
  normal_role    TEXT;
  normal_name    TEXT;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    normal_auth_id, 'authenticated', 'authenticated',
    'normal-user@example.test',
    crypt('whatever', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Normal Person"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  SELECT e.role, e.full_name
    INTO normal_role, normal_name
    FROM public.employees e
   WHERE e.auth_id = normal_auth_id;

  IF normal_role IS NULL THEN
    RAISE EXCEPTION 'FAIL: trigger did not create employees row for normal signup';
  END IF;

  IF normal_role NOT IN ('operator', 'viewer') THEN
    RAISE EXCEPTION
      'FAIL: normal signup got unexpected role % (expected operator or viewer default)',
      normal_role;
  END IF;

  RAISE NOTICE 'PASS attempt 2: normal signup created role=%, full_name=%, expected behavior preserved',
               normal_role, normal_name;
END
$$;

-- ---------- act 3: an attacker tries every known privileged role ----------
-- A complete fix should reject admin, supervisor, access_control, trainer, relief.
-- After the fix, the resulting role must be a non-privileged default for ALL of these.
DO $$
DECLARE
  priv_roles TEXT[] := ARRAY['admin', 'supervisor', 'access_control', 'trainer', 'relief'];
  priv_role TEXT;
  probe_id  UUID;
  got_role  TEXT;
BEGIN
  FOREACH priv_role IN ARRAY priv_roles LOOP
    probe_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      probe_id, 'authenticated', 'authenticated',
      format('probe-%s@example.test', priv_role),
      crypt('whatever', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', priv_role),
      now(), now(), '', '', '', ''
    );

    SELECT e.role INTO got_role
      FROM public.employees e
     WHERE e.auth_id = probe_id;

    IF got_role = priv_role THEN
      RAISE EXCEPTION
        'P0 EXPLOIT CONFIRMED: signup with raw_user_meta_data.role = ''%'' '
        'resulted in employees.role = ''%'' — privileged role passed through.',
        priv_role, priv_role;
    END IF;
  END LOOP;

  RAISE NOTICE 'PASS attempt 3: all privileged role probes (%, %, %, %, %) were rejected',
               priv_roles[1], priv_roles[2], priv_roles[3], priv_roles[4], priv_roles[5];
END
$$;

ROLLBACK;
-- ROLLBACK (not COMMIT) so the probe rows never land in the dev DB.

-- ============================================
-- Once the fix is in place (handle_new_user() ignores NEW.raw_user_meta_data->>'role'
-- and always assigns a non-privileged default), this script will reach the
-- ROLLBACK line and exit 0. Until then, the first attacker signup above
-- aborts the transaction with the "P0 EXPLOIT CONFIRMED" exception.
-- ============================================
