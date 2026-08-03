-- Index & performance optimizations (GIN, BRIN, partial, composite, partitioned, vector)
-- Note: Only tables that exist in the database are referenced here.

-- ═══════════════════════════════════════════════════════════════════════════════
-- GIN Indexes – Full-text search & JSONB
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_employees_accessible_departments_gin
  ON public.employees USING gin (accessible_departments);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_metadata_gin
  ON public.memory_embeddings USING gin (metadata);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BRIN Indexes – Large sequential tables (time-series)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_hourly_loads_load_date_brin
  ON public.hourly_loads USING brin (log_date);

CREATE INDEX IF NOT EXISTS idx_daily_logs_log_date_brin
  ON public.daily_logs USING brin (log_date);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_brin
  ON public.audit_logs USING brin (created_at);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_created_at_brin
  ON public.memory_embeddings USING brin (created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Denormalized department_id B-tree Indexes
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_machine_hours_department_id
  ON public.machine_hours (department_id);

CREATE INDEX IF NOT EXISTS idx_fuel_logs_department_id
  ON public.fuel_logs (department_id);

CREATE INDEX IF NOT EXISTS idx_production_logs_department_id
  ON public.production_logs (department_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Composite Indexes – Multi-column lookups
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_access_logs_department_action
  ON public.access_logs (department_id, action);

CREATE INDEX IF NOT EXISTS idx_alerts_department_created
  ON public.alerts (department_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_logs_shift_date
  ON public.daily_logs (shift, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_shift_notes_department_date
  ON public.shift_notes (department_id, shift_date DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Partitioned Table Indexes – Key-based lookups on parent tables
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_hourly_loads_date
  ON public.hourly_loads (log_date DESC);

CREATE INDEX IF NOT EXISTS idx_production_logs_daily_log
  ON public.production_logs (daily_log_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Materialized View Unique Indexes
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_shift_compliance_weekly_unique
  ON public.mv_shift_compliance_weekly (department_id, compliance_week);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Vector Indexes – pgvector support
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_embeddings_vector_hnsw
  ON public.embeddings USING hnsw (embedding vector_cosine_ops);
