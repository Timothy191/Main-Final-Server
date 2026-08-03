-- ============================================
-- Embedding Provider Migration — OpenAI → Ollama (nomic-embed-text)
-- ============================================
-- Migrates the memory_embeddings table from OpenAI text-embedding-3-small
-- (1536 dimensions) to Ollama nomic-embed-text:latest (768 dimensions).
-- ============================================

-- ============================================
-- 1. Update vector dimension from 1536 to 768
-- ============================================

ALTER TABLE memory_embeddings
  ALTER COLUMN embedding TYPE VECTOR(768);

-- ============================================
-- 2. Update dimension validation constraint
-- ============================================

ALTER TABLE memory_embeddings DROP CONSTRAINT IF EXISTS valid_embedding_dim;
ALTER TABLE memory_embeddings
  ADD CONSTRAINT valid_embedding_dim
  CHECK (vector_dims(embedding) = 768);

-- ============================================
-- 3. Update stored procedure signatures
-- ============================================

CREATE OR REPLACE FUNCTION search_memories_hybrid(
  query_embedding VECTOR(768),
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
SET hnsw.ef_search = 200
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
  query_embedding VECTOR(768),
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
-- 4. Update column comment
-- ============================================

COMMENT ON COLUMN memory_embeddings.embedding IS 'Ollama nomic-embed-text 768-dimension vector';
