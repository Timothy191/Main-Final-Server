-- ============================================
-- Migration: 047_machines_site_id
-- Description: Add site_id FK to machines table so each machine can be
--              assigned to a site. Tighten RLS on machines and sites to
--              admin-only for INSERT/UPDATE/DELETE (fleet is now managed
--              exclusively from the Admin panel).
-- ============================================

-- 1. Add site_id column to machines
ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_machines_site ON machines(site_id);

-- ============================================
-- 2. Tighten machines RLS to admin-only
-- ============================================

-- Drop existing insert/update/delete policies
DROP POLICY IF EXISTS "machines_insert_admin_supervisor" ON machines;
DROP POLICY IF EXISTS "machines_update_admin_supervisor" ON machines;
DROP POLICY IF EXISTS "machines_insert_admin" ON machines;
DROP POLICY IF EXISTS "machines_update_admin" ON machines;
DROP POLICY IF EXISTS "machines_delete_admin" ON machines;

-- Admin-only insert
CREATE POLICY "machines_insert_admin"
  ON machines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND e.role = 'admin'
    )
  );

-- Admin-only update
CREATE POLICY "machines_update_admin"
  ON machines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND e.role = 'admin'
    )
  );

-- Admin-only delete
CREATE POLICY "machines_delete_admin"
  ON machines FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND e.role = 'admin'
    )
  );

-- ============================================
-- 3. Tighten sites RLS to admin-only
-- ============================================

DROP POLICY IF EXISTS "sites_insert_admin_supervisor" ON sites;
DROP POLICY IF EXISTS "sites_update_admin_supervisor" ON sites;
DROP POLICY IF EXISTS "sites_insert_admin" ON sites;
DROP POLICY IF EXISTS "sites_update_admin" ON sites;
DROP POLICY IF EXISTS "sites_delete_admin" ON sites;

-- Admin-only insert
CREATE POLICY "sites_insert_admin"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND e.role = 'admin'
    )
  );

-- Admin-only update
CREATE POLICY "sites_update_admin"
  ON sites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND e.role = 'admin'
    )
  );

-- Admin-only delete
CREATE POLICY "sites_delete_admin"
  ON sites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND e.role = 'admin'
    )
  );
