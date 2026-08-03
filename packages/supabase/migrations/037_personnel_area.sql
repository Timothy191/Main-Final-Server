-- Migration 037: Add area column to personnel table
-- Stores the physical site area / work zone for each employee (e.g. "Open Pit", "Processing Plant")

ALTER TABLE personnel
  ADD COLUMN IF NOT EXISTS area text;
