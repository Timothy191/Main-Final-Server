-- Migration 045: Add access_control role to employees role check constraint
-- The access_control role is used by the access-control department dashboard
-- and its RLS policies, but was never added to the employees_role_check constraint.

DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_role_check'
  ) THEN
    ALTER TABLE employees DROP CONSTRAINT employees_role_check;
  END IF;

  -- Add the expanded constraint including access_control
  ALTER TABLE employees ADD CONSTRAINT employees_role_check
    CHECK (role IN ('admin', 'supervisor', 'operator', 'maintenance', 'viewer', 'access_control'));
END
$$;
