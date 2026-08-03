-- ============================================
-- Drill Operations Delays Refinement
-- Expands generic delays into specific granular categories
-- ============================================

-- First, add the new granular delay columns (all in minutes)
ALTER TABLE drill_operations
  -- Production / Operational Delays
  ADD COLUMN IF NOT EXISTS delay_blasting NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delay_no_operator NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delay_natural NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delay_lunch_breaks NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delay_safety_talks NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delay_tramming NUMERIC(10,2) DEFAULT 0, -- Tracks / Moving
  ADD COLUMN IF NOT EXISTS delay_non_prod_other NUMERIC(10,2) DEFAULT 0, -- General Non-production
  
  -- Engineering / Maintenance Delays
  ADD COLUMN IF NOT EXISTS delay_get NUMERIC(10,2) DEFAULT 0, -- Ground Engaging Tools
  ADD COLUMN IF NOT EXISTS delay_maintenance NUMERIC(10,2) DEFAULT 0, -- Scheduled Maintenance
  ADD COLUMN IF NOT EXISTS delay_mech_breakdown NUMERIC(10,2) DEFAULT 0, -- Mechanical Breakdown
  ADD COLUMN IF NOT EXISTS delay_elec_breakdown NUMERIC(10,2) DEFAULT 0; -- Electrical Breakdown

-- Migrate any existing generic data into a specific column so we don't lose it
UPDATE drill_operations SET 
  delay_non_prod_other = COALESCE(production_delays, 0) + COALESCE(non_productional_delays, 0),
  delay_mech_breakdown = COALESCE(engineering_delays, 0);

-- Drop the old generic columns
ALTER TABLE drill_operations
  DROP COLUMN IF EXISTS production_delays,
  DROP COLUMN IF EXISTS non_productional_delays,
  DROP COLUMN IF EXISTS engineering_delays;
