-- Migration 048: Add report_exempt flag to machines
-- When true, the machine is excluded from shift-completeness checks.
-- Only admins can set this flag (enforced in the server action layer).

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS report_exempt BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN machines.report_exempt IS
  'Admin-only: when true this machine is excluded from shift-completeness enforcement';
