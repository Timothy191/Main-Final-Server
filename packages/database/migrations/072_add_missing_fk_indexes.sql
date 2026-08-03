-- Add covering indexes for 18 FK columns that lack them
-- Detected by: tests/index_full_coverage.sql (fk_all_columns_covered advisory check)
--
-- Pattern: Most missing indexes are on created_by → employees/users and
-- department_id → departments columns. These are critical for JOIN performance.

-- ═══════════════════════════════════════════════════════════════════════════════
-- department_id → departments FK indexes
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_access_logs_department_id
  ON public.access_logs (department_id);

CREATE INDEX IF NOT EXISTS idx_personnel_department_id
  ON public.personnel (department_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- created_by → employees/users FK indexes
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_breakdowns_created_by
  ON public.breakdowns (created_by);

CREATE INDEX IF NOT EXISTS idx_daily_logs_created_by
  ON public.daily_logs (created_by);

CREATE INDEX IF NOT EXISTS idx_daily_logs_legacy_created_by
  ON public.daily_logs_legacy (created_by);

CREATE INDEX IF NOT EXISTS idx_document_versions_created_by
  ON public.document_versions (created_by);

CREATE INDEX IF NOT EXISTS idx_drill_operations_created_by
  ON public.drill_operations (created_by);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_created_by
  ON public.fuel_logs (created_by);

CREATE INDEX IF NOT EXISTS idx_hourly_loads_created_by
  ON public.hourly_loads (created_by);

CREATE INDEX IF NOT EXISTS idx_hourly_loads_legacy_created_by
  ON public.hourly_loads_legacy (created_by);

CREATE INDEX IF NOT EXISTS idx_machine_configurations_created_by
  ON public.machine_configurations (created_by);

CREATE INDEX IF NOT EXISTS idx_machine_hours_created_by
  ON public.machine_hours (created_by);

CREATE INDEX IF NOT EXISTS idx_machine_operations_created_by
  ON public.machine_operations (created_by);

CREATE INDEX IF NOT EXISTS idx_production_logs_created_by
  ON public.production_logs (created_by);

-- ═══════════════════════════════════════════════════════════════════════════════
-- updated_by → employees/users FK indexes
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_daily_logs_legacy_updated_by
  ON public.daily_logs_legacy (updated_by);

CREATE INDEX IF NOT EXISTS idx_drill_operations_updated_by
  ON public.drill_operations (updated_by);

CREATE INDEX IF NOT EXISTS idx_hourly_loads_legacy_updated_by
  ON public.hourly_loads_legacy (updated_by);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Other FK indexes
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_production_logs_daily_log_id
  ON public.production_logs (daily_log_id);
