-- ============================================
-- Add machine_name to breakdowns
-- ============================================

ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS machine_name TEXT;

-- Backfill existing rows with fleet_id as fallback
UPDATE breakdowns SET machine_name = fleet_id WHERE machine_name IS NULL;
