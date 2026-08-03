-- 060_add_missing_fk_indexes.sql
-- Add missing indexes on foreign key columns identified by the index coverage script.

-- Access Logs table
CREATE INDEX IF NOT EXISTS idx_access_logs_badge_id ON access_logs (badge_id);

-- Badges table
CREATE INDEX IF NOT EXISTS idx_badges_personnel_id ON badges (personnel_id);
CREATE INDEX IF NOT EXISTS idx_badges_visitor_id ON badges (visitor_id);

-- Breakdowns table
CREATE INDEX IF NOT EXISTS idx_breakdowns_completed_by ON breakdowns (completed_by);

-- Daily Logs partitioned parent table (creates index on all partitions automatically)
CREATE INDEX IF NOT EXISTS idx_daily_logs_updated_by ON daily_logs (updated_by);

-- Excavator Activity table
CREATE INDEX IF NOT EXISTS idx_excavator_activity_block_mined_id ON excavator_activity (block_mined_id);

-- Fuel Logs table
CREATE INDEX IF NOT EXISTS idx_fuel_logs_updated_by ON fuel_logs (updated_by);

-- Generated Reports table
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_by ON generated_reports (generated_by);

-- Hourly Loads partitioned parent table (creates index on all partitions automatically)
CREATE INDEX IF NOT EXISTS idx_hourly_loads_updated_by ON hourly_loads (updated_by);

-- Machine Configurations table
CREATE INDEX IF NOT EXISTS idx_machine_configurations_updated_by ON machine_configurations (updated_by);

-- Machine Hours table
CREATE INDEX IF NOT EXISTS idx_machine_hours_updated_by ON machine_hours (updated_by);

-- Production Logs table
CREATE INDEX IF NOT EXISTS idx_production_logs_updated_by ON production_logs (updated_by);

-- Safety Incidents table
CREATE INDEX IF NOT EXISTS idx_safety_incidents_reviewed_by ON safety_incidents (reviewed_by);

-- Shift Status table
CREATE INDEX IF NOT EXISTS idx_shift_status_approved_by ON shift_status (approved_by);
CREATE INDEX IF NOT EXISTS idx_shift_status_closed_by ON shift_status (closed_by);

-- Visitors table
CREATE INDEX IF NOT EXISTS idx_visitors_host_id ON visitors (host_id);
