-- ============================================================================
-- P0 Security Regression Test
-- ----------------------------------------------------------------------------
-- Vulnerability: employees.accessible_departments self-update privilege
-- escalation (2026-06-02 morning audit, P0 #3).
--
-- Root cause hypothesis (REPRODUCER — RED phase):
--   The RLS policy `employees_update_self_or_admin` on public.employees has
--   only a USING clause:
--
--     CREATE POLICY "employees_update_self_or_admin"
--       ON employees FOR UPDATE TO authenticated
--       USING ( auth_id = auth.uid() OR public.is_admin() );
--     -- NO WITH CHECK clause.
--
--   In Postgres RLS, omitting WITH CHECK on a FOR UPDATE policy means the
--   NEW row is not validated against any policy — only the OLD row is
--   required to satisfy USING. A non-admin row owner can therefore
--   UPDATE their own row's `accessible_departments` to include ANY
--   department UUID, including departments they should not have access to
--   (e.g. control-room, access-control). That column is the source of
--   truth read by middleware.ts to gate department-restricted routes.
--
-- This test:
--   1. Records baseline state of the policy (asserts WITH CHECK is empty).
--   2. Provisions a non-admin operator test user.
--   3. As that user (auth.uid = operator.auth_id), runs:
--        UPDATE employees
--        SET accessible_departments = ARRAY[<forbidden-dept-uuid>]
--        WHERE id = <operator-row-id>;
--   4. Asserts the exploit EITHER failed (0 rows updated) OR the new value
--      is filtered to the original set. The test PASSES only if the policy
--      refuses to grant extra departments.
--
-- Run with:
--   PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f packages/database/tests/accessible_departments_priv_esc.sql
--
-- The harness should set ON_ERROR_STOP=1; the test will exit non-zero on RED.
-- ============================================================================

\echo '[P0] employees.accessible_departments self-update privilege escalation'
\echo '[P0] Phase 1: confirm policy is USING-only (no WITH CHECK)...'

-- polwithcheck = NULL is the structural fingerprint of the bug. If a future
-- fix adds WITH CHECK, this assertion will pass and the exploit step will
-- (correctly) be blocked — turning the test green.
DO $$
DECLARE
  v_withcheck_text text;
  v_using_text text;
BEGIN
  SELECT
    pg_get_expr(polwithcheck, polrelid),
    pg_get_expr(polqual, polrelid)
  INTO v_withcheck_text, v_using_text
  FROM pg_policy
  WHERE polrelid = 'public.employees'::regclass
    AND polname = 'employees_update_self_or_admin';

  IF v_using_text IS NULL THEN
    RAISE EXCEPTION
      'SETUP: policy employees_update_self_or_admin is missing entirely — '
      'cannot reproduce the audit scenario. Re-apply migrations 001 + 043.';
  END IF;

  IF v_withcheck_text IS NOT NULL THEN
    RAISE NOTICE
      'POLICY ALREADY HARDENED — WITH CHECK = % — exploit should fail. '
      'This test will still run the exploit to confirm denial.',
      v_withcheck_text;
  ELSE
    RAISE NOTICE
      'POLICY VULNERABLE — WITH CHECK is NULL on employees_update_self_or_admin. '
      'Exploit expected to succeed (RED phase).';
  END IF;
END
$$;

\echo '[P0] Phase 2: provision isolated operator + forbidden department...'

BEGIN;

-- Savepoint so we can roll back any artifacts from the test itself.
SAVEPOINT test_setup;

-- Use deterministic UUIDs so the test is idempotent and re-runnable.
-- Note: must NOT collide with the seed admin user (f8ae1f39-...).
--   operator auth.users.id: 11111111-1111-1111-1111-111111111111
--   operator employees.id:  22222222-2222-2222-2222-222222222222
--   home dept (drilling):   33333333-3333-3333-3333-333333333333
--   forbidden dept:         44444444-4444-4444-4444-444444444444
-- Cleanup any prior run of this test.
DELETE FROM public.employees WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;
DELETE FROM auth.users     WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
DELETE FROM public.departments WHERE id IN (
  '33333333-3333-3333-3333-333333333333'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid
);

-- Create the auth user that will play the role of a logged-in operator.
INSERT INTO auth.users (id, email)
VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'p0-test-operator@plantcor.os');

-- Create two departments: one the operator legitimately belongs to, one they
-- do NOT belong to (the privilege-escalation target).
INSERT INTO public.departments (id, name, display_name, icon, color)
VALUES
  ('33333333-3333-3333-3333-333333333333'::uuid, 'p0-drilling',   'P0 Drilling',  'drill',   '#000'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'p0-control',    'P0 Control',  'gauge',   '#000');

-- Create the operator's employee row. The role is 'operator' (NOT admin),
-- department is the legitimate drilling dept, and accessible_departments is
-- empty. The exploit should not be able to add the forbidden dept to it.
INSERT INTO public.employees (id, auth_id, department_id, full_name, role, accessible_departments)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'P0 Test Operator',
  'operator',
  '{}'::uuid[]
);

RELEASE SAVEPOINT test_setup;

\echo '[P0] Phase 3: simulate logged-in operator and attempt the exploit...'

-- Simulate the PostgREST request as the operator. This sets the GUCs that
-- auth.uid() reads, and switches the role to `authenticated` so RLS kicks in.
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
SET LOCAL "request.jwt.claims"    = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
SELECT set_config('role', 'authenticated', true);

-- The exploit. The operator updates their own row, attempting to add the
-- forbidden department to accessible_departments. In a properly-hardened
-- policy this update would either be rejected outright (RLS denies because
-- no policy WITH CHECK matches) or the column write would be a no-op.
UPDATE public.employees
   SET accessible_departments = ARRAY['44444444-4444-4444-4444-444444444444']::uuid[]
 WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;

\echo '[P0] Phase 4: assert the result...'

-- Read back the row AS the operator (still authenticated, still their
-- sub claim) and assert the forbidden department was NOT added. If the
-- update succeeded and the column now contains the forbidden UUID, the
-- privilege escalation works and the test FAILS (returns non-zero on
-- ON_ERROR_STOP=1, raising this exception).
DO $$
DECLARE
  v_accessible uuid[];
  v_violation  boolean;
BEGIN
  SELECT accessible_departments
    INTO v_accessible
    FROM public.employees
   WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;

  v_violation := ('44444444-4444-4444-4444-444444444444'::uuid = ANY(v_accessible));

  IF v_violation THEN
    RAISE EXCEPTION
      'P0 VULNERABILITY CONFIRMED (RED): operator was able to set '
      'accessible_departments to include forbidden dept % from %. '
      'Policy employees_update_self_or_admin has USING but no WITH CHECK. '
      'This is a privilege escalation: middleware.ts reads accessible_departments '
      'to gate /control-room, /access-control, /admin routes.',
      '44444444-4444-4444-4444-444444444444',
      '11111111-1111-1111-1111-111111111111';
  ELSE
    RAISE NOTICE
      'P0 NOT REPRODUCED: accessible_departments = % — operator could not '
      'escalate. Policy is hardened or update was filtered.', v_accessible;
  END IF;
END
$$;

ROLLBACK;

\echo '[P0] Cleanup: removed test artifacts via ROLLBACK.'
\echo '[P0] DONE.'
