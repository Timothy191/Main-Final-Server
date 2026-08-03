-- ============================================
-- Vector Index Optimization — pgvectorscale DiskANN + HNSW tuning
-- ============================================
-- This migration improves vector search performance by:
--   1. Tuning the existing HNSW index for higher recall at query time
--   2. Conditionally adding pgvectorscale StreamingDiskANN when available
--   3. Adding filtered indexes for selective memory type queries
--   4. Improving the hybrid search function with better scoring
--
-- pgvectorscale (timescale/pgvectorscale) is optional. If the extension
-- is not available (e.g. managed Supabase), the HNSW index is still used.
-- ============================================

-- ============================================
-- 1. Drop and recreate HNSW index with optimized parameters
-- ============================================
-- The original index used m=16, ef_construction=64.
-- Increasing these improves recall at the cost of slower index build.
-- For production with frequent queries, higher ef_search at query time
-- is managed by the caller. Here we optimize for build quality.

DROP INDEX IF EXISTS idx_memory_embeddings_hnsw;

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_hnsw
  ON memory_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 24, ef_construction = 128);

COMMENT ON INDEX idx_memory_embeddings_hnsw IS
  'HNSW index for ANN cosine similarity. m=24 provides better recall than default m=16 at moderate memory cost.';

-- ============================================
-- 2. Add filtered indexes for common query patterns
-- ============================================

-- Partial index for episodic memory queries (the most frequent type)
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_hnsw_episodic
  ON memory_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 24, ef_construction = 128)
  WHERE memory_type = 'episodic';

COMMENT ON INDEX idx_memory_embeddings_hnsw_episodic IS
  'Filtered HNSW for episodic memory — covers ~80% of vector queries.';

-- Partial index for semantic memory
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_hnsw_semantic
  ON memory_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 24, ef_construction = 128)
  WHERE memory_type = 'semantic';

-- ============================================
-- 3. Conditionally add pgvectorscale DiskANN index
-- ============================================
-- StreamingDiskANN provides better latency/recall tradeoffs than HNSW
-- at scale (10M+ vectors). Only created if vectorscale extension is available.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'vectorscale'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS vectorscale;

    -- StreamingDiskANN index — better than HNSW for large-scale ANN
    CREATE INDEX IF NOT EXISTS idx_memory_embeddings_diskann
      ON memory_embeddings
      USING diskann (embedding vector_cosine_ops)
      WITH (num_neighbors = 64, search_list_size = 200, max_retained_num = 200);

    COMMENT ON INDEX idx_memory_embeddings_diskann IS
      'StreamingDiskANN index. Used when pgvectorscale is available. Outperforms HNSW at scale.';
  END IF;
END $$;

-- ============================================
-- 4. Improve hybrid search function with dynamic ef_search
-- ============================================

CREATE OR REPLACE FUNCTION search_memories_hybrid(
  query_embedding VECTOR(1536),
  query_text TEXT,
  p_user_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_memory_type TEXT DEFAULT NULL,
  match_count INT DEFAULT 10,
  semantic_weight FLOAT DEFAULT 0.6,
  keyword_weight FLOAT DEFAULT 0.2,
  temporal_weight FLOAT DEFAULT 0.2
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  content TEXT,
  metadata JSONB,
  memory_type TEXT,
  created_at TIMESTAMPTZ,
  semantic_score FLOAT,
  keyword_score FLOAT,
  temporal_score FLOAT,
  combined_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET hnsw.ef_search = 200  -- dynamic ef_search for better recall on this query
AS $$
DECLARE
  lambda FLOAT := 0.05;
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.session_id,
    m.content,
    m.metadata,
    m.memory_type,
    m.created_at,
    (1 - (m.embedding <=> query_embedding))::FLOAT AS semantic_score,
    COALESCE(
      ts_rank(
        to_tsvector('english', m.content),
        plainto_tsquery('english', query_text)
      ),
      0
    )::FLOAT AS keyword_score,
    EXP(-lambda * EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 3600)::FLOAT AS temporal_score,
    (
      semantic_weight * (1 - (m.embedding <=> query_embedding))::FLOAT +
      keyword_weight * COALESCE(
        ts_rank(
          to_tsvector('english', m.content),
          plainto_tsquery('english', query_text)
        ),
        0
      )::FLOAT +
      temporal_weight * EXP(-lambda * EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 3600)::FLOAT
    )::FLOAT AS combined_score
  FROM memory_embeddings m
  WHERE m.user_id = p_user_id
    AND (p_session_id IS NULL OR m.session_id = p_session_id)
    AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION search_memories_semantic(
  query_embedding VECTOR(1536),
  p_user_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_memory_type TEXT DEFAULT NULL,
  match_count INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  content TEXT,
  metadata JSONB,
  memory_type TEXT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET hnsw.ef_search = 200
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.session_id,
    m.content,
    m.metadata,
    m.memory_type,
    m.created_at,
    (1 - (m.embedding <=> query_embedding))::FLOAT AS similarity
  FROM memory_embeddings m
  WHERE m.user_id = p_user_id
    AND (p_session_id IS NULL OR m.session_id = p_session_id)
    AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
    AND (1 - (m.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- 5. Embedding size validation constraint
-- ============================================

ALTER TABLE memory_embeddings DROP CONSTRAINT IF EXISTS valid_embedding_dim;
ALTER TABLE memory_embeddings
  ADD CONSTRAINT valid_embedding_dim
  CHECK (vector_dims(embedding) = 1536);
