-- ============================================
-- Migration: 068_schema_performance_optimizations
-- Description: Convert audit_logs and memory_embeddings to partitioned tables,
--              and add safety check constraints to hourly_loads.
-- ============================================

-- ============================================
-- PART 1: Constraints on hourly_loads
-- ============================================
ALTER TABLE hourly_loads ADD CONSTRAINT hour_non_negative
  CHECK (
    hour_01 >= 0 AND hour_02 >= 0 AND hour_03 >= 0 AND hour_04 >= 0 AND
    hour_05 >= 0 AND hour_06 >= 0 AND hour_07 >= 0 AND hour_08 >= 0 AND
    hour_09 >= 0 AND hour_10 >= 0 AND hour_11 >= 0 AND hour_12 >= 0
  );

-- ============================================
-- PART 2: Partition audit_logs by created_at
-- ============================================
ALTER TABLE audit_logs RENAME TO audit_logs_legacy;
ALTER TABLE audit_logs_legacy DISABLE ROW LEVEL SECURITY;

CREATE TABLE audit_logs (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES employees(id),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_department"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid()
        AND (
          e.role = 'admin'
          OR audit_logs.department_id = e.department_id
          OR audit_logs.department_id = ANY(e.accessible_departments)
        )
    )
  );

CREATE POLICY "audit_logs_insert_authenticated"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_audit_logs_department ON audit_logs(department_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Create 2025-2027 monthly partitions for audit_logs
DO $$
DECLARE
  yr  INT;
  mo  INT;
  partition_start TIMESTAMP WITH TIME ZONE;
  partition_end   TIMESTAMP WITH TIME ZONE;
  partition_name  TEXT;
BEGIN
  FOR yr IN 2025..2027 LOOP
    FOR mo IN 1..12 LOOP
      partition_start := make_timestamptz(yr, mo, 1, 0, 0, 0, 'UTC');
      partition_end   := partition_start + INTERVAL '1 month';
      partition_name  := format('audit_logs_%s_%s', yr, lpad(mo::text, 2, '0'));

      IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name AND n.nspname = 'public'
      ) THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
          partition_name, partition_start, partition_end
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Migrate data
INSERT INTO audit_logs (
  id, action, table_name, record_id, old_data, new_data,
  performed_by, department_id, ip_address, user_agent, created_at
)
SELECT
  id, action, table_name, record_id, old_data, new_data,
  performed_by, department_id, ip_address, user_agent, created_at
FROM audit_logs_legacy;

DROP TABLE audit_logs_legacy;

-- ============================================
-- PART 3: Partition memory_embeddings by created_at
-- ============================================
ALTER TABLE memory_embeddings RENAME TO memory_embeddings_legacy;
ALTER TABLE memory_embeddings_legacy DISABLE ROW LEVEL SECURITY;

CREATE TABLE memory_embeddings (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  memory_type memory_type NOT NULL DEFAULT 'episodic'::memory_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memory_select_own"
  ON memory_embeddings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

CREATE POLICY "memory_insert_own"
  ON memory_embeddings FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

CREATE POLICY "memory_update_own"
  ON memory_embeddings FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

CREATE POLICY "memory_delete_own"
  ON memory_embeddings FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employees e
      WHERE e.auth_id = auth.uid() AND e.role = 'admin'
    )
  );

-- Indexes for partitions
CREATE INDEX idx_memory_embeddings_hnsw
  ON memory_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_memory_embeddings_session ON memory_embeddings(session_id);
CREATE INDEX idx_memory_embeddings_user ON memory_embeddings(user_id);
CREATE INDEX idx_memory_embeddings_type ON memory_embeddings(memory_type);
CREATE INDEX idx_memory_embeddings_created_at ON memory_embeddings(created_at DESC);
CREATE INDEX idx_memory_embeddings_user_session_type ON memory_embeddings(user_id, session_id, memory_type, created_at DESC);
CREATE INDEX idx_memory_embeddings_metadata ON memory_embeddings USING GIN (metadata);
CREATE INDEX idx_memory_embeddings_fts ON memory_embeddings USING GIN (to_tsvector('english', content));

-- Create 2025-2027 monthly partitions for memory_embeddings
DO $$
DECLARE
  yr  INT;
  mo  INT;
  partition_start TIMESTAMP WITH TIME ZONE;
  partition_end   TIMESTAMP WITH TIME ZONE;
  partition_name  TEXT;
BEGIN
  FOR yr IN 2025..2027 LOOP
    FOR mo IN 1..12 LOOP
      partition_start := make_timestamptz(yr, mo, 1, 0, 0, 0, 'UTC');
      partition_end   := partition_start + INTERVAL '1 month';
      partition_name  := format('memory_embeddings_%s_%s', yr, lpad(mo::text, 2, '0'));

      IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = partition_name AND n.nspname = 'public'
      ) THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF memory_embeddings FOR VALUES FROM (%L) TO (%L)',
          partition_name, partition_start, partition_end
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Migrate data
INSERT INTO memory_embeddings (
  id, session_id, user_id, content, embedding, metadata, memory_type, created_at, updated_at
)
SELECT
  id, session_id, user_id, content, embedding, metadata, memory_type, created_at, updated_at
FROM memory_embeddings_legacy;

DROP TABLE memory_embeddings_legacy;

CREATE TRIGGER update_memory_embeddings_updated_at
  BEFORE UPDATE ON memory_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 4: Auto-partition and Archiving functions update
-- ============================================
CREATE OR REPLACE FUNCTION public.create_next_month_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_month_start DATE := date_trunc('month', NOW() + INTERVAL '1 month')::DATE;
  next_month_end   DATE := (next_month_start + INTERVAL '1 month')::DATE;
  yr               TEXT := to_char(next_month_start, 'YYYY');
  mo               TEXT := to_char(next_month_start, 'MM');
  hl_partition     TEXT := format('hourly_loads_%s_%s', yr, mo);
  dl_partition     TEXT := format('daily_logs_%s_%s', yr, mo);
  al_partition     TEXT := format('audit_logs_%s_%s', yr, mo);
  me_partition     TEXT := format('memory_embeddings_%s_%s', yr, mo);
BEGIN
  -- hourly_loads
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = hl_partition) THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF hourly_loads FOR VALUES FROM (%L) TO (%L)', hl_partition, next_month_start, next_month_end);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %s CHECK (load_date >= %L AND load_date < %L)', hl_partition, hl_partition || '_check_load_date', next_month_start, next_month_end);
  END IF;

  -- daily_logs
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = dl_partition) THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF daily_logs FOR VALUES FROM (%L) TO (%L)', dl_partition, next_month_start, next_month_end);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %s CHECK (log_date >= %L AND log_date < %L)', dl_partition, dl_partition || '_check_log_date', next_month_start, next_month_end);
  END IF;

  -- audit_logs
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = al_partition) THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)', al_partition, next_month_start, next_month_end);
  END IF;

  -- memory_embeddings
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = me_partition) THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF memory_embeddings FOR VALUES FROM (%L) TO (%L)', me_partition, next_month_start, next_month_end);
  END IF;
END;
$$;
