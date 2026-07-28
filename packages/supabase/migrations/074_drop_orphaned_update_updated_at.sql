-- ============================================================================
-- Migration 074: Drop orphaned update_updated_at_column
--
-- After migrations 072-073, two function entries remain for
-- update_updated_at_column(). The hardened one (SECURITY DEFINER,
-- search_path=public) is referenced by all triggers. The original
-- (no SECURITY DEFINER, no search_path) is orphaned — no trigger
-- references it. This migration drops the orphan.
-- ============================================================================

DO $$
DECLARE
  v_orphan_oid OID;
BEGIN
  SELECT p.oid INTO v_orphan_oid
  FROM pg_proc p
  WHERE p.proname = 'update_updated_at_column'
    AND p.pronargs = 0
    AND p.prosecdef = false;

  IF v_orphan_oid IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgfoid = v_orphan_oid)
  THEN
    EXECUTE format('DROP FUNCTION public.update_updated_at_column()');
  END IF;
END;
$$;
