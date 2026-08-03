-- ============================================================================
-- Full Index Coverage Test
-- ----------------------------------------------------------------------------
-- Validates that ALL expected indexes exist after migrations 071 & 072.
-- Covers:
--   1. GIN indexes (array lookups for RLS)
--   2. BRIN indexes (time-series range scans on partitioned tables)
--   3. B-tree indexes on denormalized FK columns (department_id on child tables)
--   4. Critical RLS performance indexes (migration 041)
--   5. Dashboard composite indexes (migration 021 / 044)
--   6. Missing FK column indexes (migration 060)
--   7. Partition table indexes (migration 020 / 068)
--   8. Materialized view unique indexes
--   9. Vector / HNSW indexes (migration 030 / 068)
--  10. Access control dashboard indexes (migration 044)
--  11. All FK columns have covering indexes (advisory check)
--  12. Migration 072 FK column indexes (created_by, updated_by, department_id)
--
-- Run with:
--   psql -h localhost -p 54322 -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f packages/database/tests/index_full_coverage.sql
-- ============================================================================

\echo '[INDEX COVERAGE] Full index coverage test for migrations 071 & 072...'

-- Track results
CREATE TEMP TABLE index_test_results (
  test_name TEXT PRIMARY KEY,
  passed BOOLEAN NOT NULL,
  detail TEXT
);

-- ============================================================================
-- CATEGORY 1: GIN Indexes
-- ============================================================================

-- 1a. GIN index on employees.accessible_departments (migration 071)
INSERT INTO index_test_results (test_name, passed, detail)
SELECT
  'gin_employees_accessible_departments',
  EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_class ci ON ci.oid = i.indexrelid
    JOIN pg_class ct ON ct.oid = i.indrelid
    JOIN pg_am a ON a.oid = ci.relam
    WHERE ct.relname = 'employees'
      AND a.amname = 'gin'
      AND i.indisvalid
  ),
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_class ci ON ci.oid = i.indexrelid
    JOIN pg_class ct ON ct.oid = i.indrelid
    JOIN pg_am a ON a.oid = ci.relam
    WHERE ct.relname = 'employees' AND a.amname = 'gin' AND i.indisvalid
  ) THEN 'GIN index on employees exists' ELSE 'MISSING: GIN index on employees' END;

-- 1b. GIN index on memory_embeddings metadata (migration 068)
INSERT INTO index_test_results (test_name, passed, detail)
SELECT
  'gin_memory_embeddings_metadata',
  EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_class ci ON ci.oid = i.indexrelid
    JOIN pg_class ct ON ct.oid = i.indrelid
    JOIN pg_am a ON a.oid = ci.relam
    WHERE ct.relname LIKE 'memory_embeddings%'
      AND a.amname = 'gin'
      AND i.indisvalid
  ),
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_class ci ON ci.oid = i.indexrelid
    JOIN pg_class ct ON ct.oid = i.indrelid
    JOIN pg_am a ON a.oid = ci.relam
    WHERE ct.relname LIKE 'memory_embeddings%' AND a.amname = 'gin' AND i.indisvalid
  ) THEN 'GIN index on memory_embeddings metadata exists' ELSE 'MISSING: GIN on memory_embeddings metadata' END;

-- 1c. Full-text search GIN index on memory_embeddings content (migration 068)
INSERT INTO index_test_results (test_name, passed, detail)
SELECT
  'fts_gin_memory_embeddings',
  EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_class ci ON ci.oid = i.indexrelid
    JOIN pg_class ct ON ct.oid = i.indrelid
    JOIN pg_am a ON a.oid = ci.relam
    WHERE ct.relname LIKE 'memory_embeddings%'
      AND a.amname = 'gin'
      AND i.indexprs IS NOT NULL  -- Expression index (to_tsvector)
      AND i.indisvalid
  ),
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_class ci ON ci.oid = i.indexrelid
    JOIN pg_class ct ON ct.oid = i.indrelid
    JOIN pg_am a ON a.oid = ci.relam
    WHERE ct.relname LIKE 'memory_embeddings%'
      AND a.amname = 'gin'
      AND i.indexprs IS NOT NULL
      AND i.indisvalid
  ) THEN 'FTS GIN index on memory_embeddings content exists' ELSE 'MISSING: FTS GIN on memory_embeddings content' END;

-- ============================================================================
-- CATEGORY 2: BRIN Indexes (migration 071)
-- ============================================================================

DO $$
DECLARE
  brin_tests TEXT[][] := ARRAY[
    ['brin_hourly_loads_load_date', 'hourly_loads', 'idx_hourly_loads_load_date_brin'],
    ['brin_daily_logs_log_date', 'daily_logs', 'idx_daily_logs_log_date_brin'],
    ['brin_audit_logs_created_at', 'audit_logs', 'idx_audit_logs_created_at_brin'],
    ['brin_memory_embeddings_created_at', 'memory_embeddings', 'idx_memory_embeddings_created_at_brin']
  ];
  t TEXT[];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH t SLICE 1 IN ARRAY brin_tests
  LOOP
    idx_name := t[3];
    SELECT EXISTS (
      SELECT 1 FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
      JOIN pg_am a ON a.oid = c.relam
      WHERE c.relname = idx_name AND a.amname = 'brin' AND i.indisvalid
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      t[1],
      exists_p,
      CASE WHEN exists_p THEN format('BRIN index %s on %s EXISTS', idx_name, t[2])
           ELSE format('MISSING: BRIN index %s on %s', idx_name, t[2]) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- CATEGORY 3: Denormalized department_id B-tree Indexes (migration 071)
-- ============================================================================

DO $$
DECLARE
  dept_idx_tests TEXT[][] := ARRAY[
    ['btree_machine_hours_department_id', 'machine_hours', 'idx_machine_hours_department_id'],
    ['btree_fuel_logs_department_id', 'fuel_logs', 'idx_fuel_logs_department_id'],
    ['btree_production_logs_department_id', 'production_logs', 'idx_production_logs_department_id']
  ];
  t TEXT[];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH t SLICE 1 IN ARRAY dept_idx_tests
  LOOP
    idx_name := t[3];
    SELECT EXISTS (
      SELECT 1 FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
      WHERE c.relname = idx_name AND i.indisvalid
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      t[1],
      exists_p,
      CASE WHEN exists_p THEN format('B-tree index %s on %s EXISTS', idx_name, t[2])
           ELSE format('MISSING: B-tree index %s on %s', idx_name, t[2]) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- CATEGORY 4: Critical RLS Performance Indexes (migration 041)
-- ============================================================================

DO $$
DECLARE
  rls_idx_tests TEXT[][] := ARRAY[
    ['rls_employees_auth_id', 'idx_employees_auth_id'],
    ['rls_departments_name', 'idx_departments_name'],
    ['rls_employees_department_id', 'idx_employees_department_id']
  ];
  t TEXT[];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH t SLICE 1 IN ARRAY rls_idx_tests
  LOOP
    idx_name := t[2];
    SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = idx_name AND relkind IN ('i', 'I')
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      t[1],
      exists_p,
      CASE WHEN exists_p THEN format('RLS performance index %s EXISTS', idx_name)
           ELSE format('MISSING: RLS performance index %s', idx_name) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- CATEGORY 5: Dashboard Composite Indexes (migration 021)
-- ============================================================================

DO $$
DECLARE
  comp_idx_tests TEXT[] := ARRAY[
    'idx_machine_hours_machine_log',
    'idx_machine_hours_log_machine',
    'idx_fuel_logs_machine_log',
    'idx_fuel_logs_log_machine',
    'idx_daily_logs_dept_date_shift',
    'idx_hourly_loads_dept_date_shift',
    'idx_breakdowns_dept_status',
    'idx_breakdowns_dept_date_in',
    'idx_safety_incidents_dept_date_status',
    'idx_machines_dept_active',
    'idx_audit_logs_user_created',
    'idx_audit_logs_table_created',
    'idx_ai_memory_user_type'
  ];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH idx_name IN ARRAY comp_idx_tests
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = idx_name AND relkind IN ('i', 'I')
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      format('composite_%s', idx_name),
      exists_p,
      CASE WHEN exists_p THEN format('Dashboard composite index %s EXISTS', idx_name)
           ELSE format('MISSING: Dashboard composite index %s', idx_name) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- CATEGORY 6: Missing FK Column Indexes (migration 060)
-- ============================================================================

DO $$
DECLARE
  fk_idx_tests TEXT[] := ARRAY[
    'idx_access_logs_badge_id',
    'idx_badges_personnel_id',
    'idx_badges_visitor_id',
    'idx_breakdowns_completed_by',
    'idx_daily_logs_updated_by',
    'idx_excavator_activity_block_mined_id',
    'idx_fuel_logs_updated_by',
    'idx_generated_reports_generated_by',
    'idx_hourly_loads_updated_by',
    'idx_machine_configurations_updated_by',
    'idx_machine_hours_updated_by',
    'idx_production_logs_updated_by',
    'idx_safety_incidents_reviewed_by',
    'idx_shift_status_approved_by',
    'idx_shift_status_closed_by',
    'idx_visitors_host_id'
  ];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH idx_name IN ARRAY fk_idx_tests
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = idx_name AND relkind IN ('i', 'I')
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      format('fk_%s', idx_name),
      exists_p,
      CASE WHEN exists_p THEN format('FK column index %s EXISTS', idx_name)
           ELSE format('MISSING: FK column index %s', idx_name) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- CATEGORY 7: Partition Table Indexes (migration 020 / 068)
-- ============================================================================

DO $$
DECLARE
  part_idx_tests TEXT[] := ARRAY[
    'idx_hourly_loads_department_date',
    'idx_hourly_loads_machine_date',
    'idx_hourly_loads_shift_type',
    'idx_hourly_loads_dept_date_shift',
    'idx_daily_logs_department_date',
    'idx_daily_logs_shift',
    'idx_daily_logs_sync_status'
  ];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH idx_name IN ARRAY part_idx_tests
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = idx_name AND relkind IN ('i', 'I')
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      format('partition_%s', idx_name),
      exists_p,
      CASE WHEN exists_p THEN format('Partition index %s EXISTS', idx_name)
           ELSE format('MISSING: Partition index %s', idx_name) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- CATEGORY 8: Materialized View Unique Indexes
-- ============================================================================

DO $$
DECLARE
  mv_uidx_tests TEXT[] := ARRAY[
    'uidx_dept_production_summary_dept',
    'uidx_machine_utilization_weekly_machine',
    'uidx_safety_incident_monthly'
  ];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH idx_name IN ARRAY mv_uidx_tests
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = idx_name AND relkind IN ('i', 'I')
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      format('mv_%s', idx_name),
      exists_p,
      CASE WHEN exists_p THEN format('Materialized view unique index %s EXISTS', idx_name)
           ELSE format('MISSING: Materialized view unique index %s', idx_name) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- CATEGORY 9: Vector / HNSW Indexes (migration 030 / 068)
-- ============================================================================

DO $$
DECLARE
  vec_idx_tests TEXT[] := ARRAY[
    'idx_memory_embeddings_hnsw',
    'idx_memory_embeddings_hnsw_episodic',
    'idx_memory_embeddings_hnsw_semantic'
  ];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH idx_name IN ARRAY vec_idx_tests
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = idx_name AND relkind IN ('i', 'I')
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      format('vector_%s', idx_name),
      exists_p,
      CASE WHEN exists_p THEN format('Vector index %s EXISTS', idx_name)
           ELSE format('MISSING: Vector index %s (may be optional DiskANN)', idx_name) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- CATEGORY 10: Access Control Dashboard Indexes (migration 044)
-- ============================================================================

DO $$
DECLARE
  ac_idx_tests TEXT[] := ARRAY[
    'idx_badges_department_id',
    'idx_badges_is_active',
    'idx_badges_expires_at',
    'idx_badges_fleet_id',
    'idx_badges_equipment_id',
    'idx_badges_qr_code',
    'idx_access_logs_scanned_at',
    'idx_access_logs_gate'
  ];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH idx_name IN ARRAY ac_idx_tests
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = idx_name AND relkind IN ('i', 'I')
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      format('access_control_%s', idx_name),
      exists_p,
      CASE WHEN exists_p THEN format('Access control index %s EXISTS', idx_name)
           ELSE format('MISSING: Access control index %s', idx_name) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- CATEGORY 11: All FK Columns Have Covering Indexes (advisory check)
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
  missing_fk INT := 0;
BEGIN
  FOR rec IN
    SELECT DISTINCT
      referencing_tbl.relname AS ref_name,
      referencing_attr.attname AS fk_col,
      referencing_attr.attnum AS fk_attnum,
      referencing_tbl.oid AS ref_oid
    FROM pg_constraint c
    JOIN pg_class referencing_tbl ON referencing_tbl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = referencing_tbl.relnamespace
    JOIN pg_attribute referencing_attr
      ON referencing_attr.attrelid = c.conrelid
      AND referencing_attr.attnum = c.conkey[1]
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND NOT EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = referencing_tbl.oid)
    ORDER BY ref_name, fk_col
  LOOP
    IF NOT EXISTS (
      WITH search_tables AS (
        SELECT rec.ref_oid AS tbl
        UNION
        SELECT inhrelid FROM pg_inherits WHERE inhparent = rec.ref_oid
        UNION
        SELECT inhparent FROM pg_inherits WHERE inhrelid = rec.ref_oid
      )
      SELECT 1
      FROM search_tables st
      JOIN pg_index i ON i.indrelid = st.tbl
      JOIN pg_class ic ON ic.oid = i.indexrelid
      WHERE ic.relname NOT LIKE 'pg_%'
        AND i.indisvalid
        AND rec.fk_attnum = ANY(i.indkey)
      LIMIT 1
    ) THEN
      RAISE WARNING 'Advisory: No index on TABLE % COLUMN % (FK reference)', rec.ref_name, rec.fk_col;
      missing_fk := missing_fk + 1;
    END IF;
  END LOOP;

  INSERT INTO index_test_results (test_name, passed, detail)
  VALUES (
    'fk_all_columns_covered',
    TRUE,
    CASE WHEN missing_fk = 0 THEN 'All FK columns have covering indexes'
         ELSE format('Advisory: %s FK columns lack covering indexes', missing_fk) END
  );
END $$;

-- ============================================================================
-- CATEGORY 12: Migration 072 FK Column Indexes (created_by, updated_by, dept_id)
-- ============================================================================

DO $$
DECLARE
  fk072_tests TEXT[] := ARRAY[
    'idx_access_logs_department_id',
    'idx_personnel_department_id',
    'idx_breakdowns_created_by',
    'idx_daily_logs_created_by',
    'idx_daily_logs_legacy_created_by',
    'idx_document_versions_created_by',
    'idx_drill_operations_created_by',
    'idx_fuel_logs_created_by',
    'idx_hourly_loads_created_by',
    'idx_hourly_loads_legacy_created_by',
    'idx_machine_configurations_created_by',
    'idx_machine_hours_created_by',
    'idx_machine_operations_created_by',
    'idx_production_logs_created_by',
    'idx_daily_logs_legacy_updated_by',
    'idx_drill_operations_updated_by',
    'idx_hourly_loads_legacy_updated_by',
    'idx_production_logs_daily_log_id'
  ];
  idx_name TEXT;
  exists_p BOOLEAN;
BEGIN
  FOREACH idx_name IN ARRAY fk072_tests
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = idx_name AND relkind IN ('i', 'I')
    ) INTO exists_p;

    INSERT INTO index_test_results (test_name, passed, detail)
    VALUES (
      format('m072_%s', idx_name),
      exists_p,
      CASE WHEN exists_p THEN format('FK index %s EXISTS (migration 072)', idx_name)
           ELSE format('MISSING: FK index %s (migration 072)', idx_name) END
    );
  END LOOP;
END $$;

-- ============================================================================
-- RESULTS
-- ============================================================================

\echo ''
\echo '========================================'
\echo ' INDEX COVERAGE TEST RESULTS'
\echo '========================================'

SELECT
  CASE WHEN passed THEN '  V' ELSE '  X' END AS status,
  test_name,
  detail
FROM index_test_results
ORDER BY test_name;

\echo ''

DO $$
DECLARE
  total INT;
  passed_count INT;
  failed_count INT;
  expected_total INT := 82;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE passed), COUNT(*) FILTER (WHERE NOT passed)
  INTO total, passed_count, failed_count
  FROM index_test_results;

  RAISE NOTICE '----------------------------------------------';
  RAISE NOTICE '  Expected: %', expected_total;
  RAISE NOTICE '  Total:    %', total;
  RAISE NOTICE '  Passed:   %', passed_count;
  RAISE NOTICE '  Failed:   %', failed_count;

  IF failed_count > 0 THEN
    RAISE EXCEPTION 'INDEX COVERAGE TEST FAILED: % of % indexes missing', failed_count, total;
  ELSE
    RAISE NOTICE '  STATUS: V ALL % INDEXES PRESENT', total;
  END IF;
  RAISE NOTICE '----------------------------------------------';
END $$;

-- Drop temp table
DROP TABLE index_test_results;
