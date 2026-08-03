-- ============================================
-- Backfill auth.identities for email/password users
-- ============================================
-- AGENT-TRACE: GoTrue rejects password login when auth.identities has no
-- email provider row (invalid_credentials). Editing 052 does not re-run on
-- DBs that already applied it — this additive migration backfills all envs.
-- Idempotent: NOT EXISTS / ON CONFLICT guards.
-- Mirror of packages/supabase/migrations/067_backfill_auth_email_identities.sql

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT u.id, u.email
    FROM auth.users u
    WHERE u.email IS NOT NULL
      AND TRIM(u.email) <> ''
      AND NOT EXISTS (
        SELECT 1
        FROM auth.identities i
        WHERE i.user_id = u.id
          AND i.provider = 'email'
      )
  LOOP
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      r.id,
      r.id,
      jsonb_build_object(
        'sub', r.id::text,
        'email', r.email,
        'email_verified', true
      ),
      'email',
      r.id::text,
      now(),
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
