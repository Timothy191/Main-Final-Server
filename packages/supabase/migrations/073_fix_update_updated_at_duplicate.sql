-- ============================================================================
-- Migration 073: (superseded by 074)
--
-- Originally attempted ALTER FUNCTION to pin search_path on the original
-- function, but with two entries of the same signature the ALTER is
-- ambiguous. The orphan cleanup moved to migration 074 which uses
-- OID-targeted dynamic SQL.
--
-- This file is kept as a no-op to preserve migration numbering.
-- ============================================================================

SELECT 1; -- no-op
