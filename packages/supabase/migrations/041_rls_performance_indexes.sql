-- ============================================
-- Migration: 041_rls_performance_indexes
-- Description: Add critical missing indexes to fix extreme slowness in
--              the Arch-Mk2 portal caused by RLS policy full table scans.
--
-- Root cause: The RLS function has_department_access() runs
--   SELECT 1 FROM employees WHERE auth_id = auth.uid()
-- for EVERY ROW of every table query. Without an index on employees(auth_id),
-- this forces a sequential scan of the employees table on every row access.
-- Additionally, the middleware resolves department slugs by name on every
-- request via departments(name), which also lacked an index.
-- ============================================

-- ============================================
-- 1. employees(auth_id) — stops full table scan inside RLS policy
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employees_auth_id ON employees(auth_id);

-- ============================================
-- 2. departments(name) — middleware slug lookup on every request
-- ============================================
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- ============================================
-- 3. employees(department_id) — department-scoped employee queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
