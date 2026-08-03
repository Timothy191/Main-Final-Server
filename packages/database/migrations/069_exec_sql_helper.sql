-- ============================================
-- Migration: 069_exec_sql_helper
-- Description: Provide the public.exec_sql(sql) RPC used by the
--              ops/db-audit service for safe table-level read queries
--              and admin repair statements. Restricted to the service_role
--              (PostgREST sets the role to service_role for service-key
--              requests). SECURITY DEFINER so the caller does not need
--              table-level SELECT on every catalog table.
-- ============================================

-- Drop if present from any prior attempt (no-op when absent).
DROP FUNCTION IF EXISTS public.exec_sql(TEXT);

CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lower TEXT;
BEGIN
  -- Normalize: strip leading whitespace and comments so we can sniff the
  -- statement kind without surprises.
  v_lower := lower(regexp_replace(coalesce(sql, ''), E'^\\s*(--[^\\n]*\\n)*', ''));

  -- Reject obviously dangerous categories up front. The db-audit service
  -- already filters inputs to ALTER / CREATE POLICY / etc., but defense in
  -- depth costs us nothing here.
  IF v_lower LIKE 'drop %' OR v_lower LIKE 'truncate %' OR v_lower LIKE 'grant %' OR v_lower LIKE 'revoke %' THEN
    RAISE EXCEPTION 'exec_sql: statement category not permitted (%…)', left(v_lower, 16);
  END IF;

  -- For DDL, Supabase RPC won't return rows. We synthesize a single
  -- status row so the caller sees success. The caller treats an empty
  -- result set the same as success (e.g. ALTER TABLE).
  IF v_lower LIKE 'alter %'
     OR v_lower LIKE 'create %'
     OR v_lower LIKE 'comment %'
  THEN
    EXECUTE sql;
    RETURN NEXT jsonb_build_object('status', 'ok');
    RETURN;
  END IF;

  -- SELECT and other row-returning statements: hand back each row as
  -- a jsonb document so the client can treat the result uniformly.
  RETURN QUERY EXECUTE sql;
END;
$$;

COMMENT ON FUNCTION public.exec_sql(TEXT)
  IS 'Internal helper: execute ad-hoc SQL for ops/db-audit. Restricted to service_role. Returns SETOF JSONB; DDL yields a single status row.';

-- Lock down who can call this. anon and authenticated are explicitly
-- revoked; only service_role and database owner remain allowed.
REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;
