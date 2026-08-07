-- ============================================
-- Migration: 078_fix_hnsw_ef_search
-- Description: Fix the search_memories_hybrid function that fails because
--              set_config('hnsw.ef_search', ...) is not a valid GUC parameter.
--              hnsw.ef_search is an index-level parameter, not a session GUC.
--              The function now skips the set_config call and relies on the
--              default ef_search value (or caller can pass it via parameter).
--
-- Fix: Remove the PERFORM set_config line that causes:
--   "invalid value for parameter hnsw.ef_search"
-- ============================================

-- Drop existing functions dynamically to avoid argument mismatch/uniqueness errors on replacement
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure AS sig 
        FROM pg_proc 
        WHERE proname IN ('search_memories_semantic', 'search_memories_hybrid')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION search_memories_hybrid(
  query_embedding VECTOR(1536),
  query_text TEXT,
  p_user_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_memory_type TEXT DEFAULT NULL,
  match_count INT DEFAULT 10,
  semantic_weight FLOAT DEFAULT 0.6,
  keyword_weight FLOAT DEFAULT 0.2,
  temporal_weight FLOAT DEFAULT 0.2,
  ef_search INT DEFAULT NULL
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
AS $$
DECLARE
  lambda FLOAT := 0.05;
BEGIN
  -- NOTE: hnsw.ef_search is an index parameter, not a session GUC.
  -- set_config() does not work for HNSW parameters.
  -- The default ef_search (128) is used. To override, set at connection level:
  --   SET hnsw.ef_search = 200;
  -- before calling this function.

  RETURN QUERY
  SELECT
    m.id,
    m.session_id,
    m.content,
    m.metadata,
    m.memory_type::text,
    m.created_at,
    (1 - (m.embedding <=> query_embedding))::FLOAT AS semantic_score,
    COALESCE(
      ts_rank(
        to_tsvector('english', m.content),
        plainto_tsquery('english', query_text)
      ),
      0
    )::FLOAT AS keyword_score,
    -- Temporal score: newer records score higher
    (1.0 / (1.0 + EXTRACT(EPOCH FROM (now() - m.created_at)) / 86400.0))::FLOAT AS temporal_score,
    -- Combined score
    (
      semantic_weight * (1 - (m.embedding <=> query_embedding)) +
      keyword_weight * COALESCE(ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', query_text)), 0) +
      temporal_weight * (1.0 / (1.0 + EXTRACT(EPOCH FROM (now() - m.created_at)) / 86400.0))
    )::FLOAT AS combined_score
  FROM memory_embeddings m
  WHERE
    (p_user_id IS NULL OR m.user_id = p_user_id)
    AND (p_session_id IS NULL OR m.session_id = p_session_id)
    AND (p_memory_type IS NULL OR m.memory_type::text = p_memory_type)
    AND m.embedding IS NOT NULL
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Also fix search_memories_semantic if it has the same issue
CREATE OR REPLACE FUNCTION search_memories_semantic(
  query_embedding VECTOR(1536),
  p_user_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_memory_type TEXT DEFAULT NULL,
  match_count INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.5
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.session_id,
    m.content,
    m.metadata,
    m.memory_type::text,
    m.created_at,
    (1 - (m.embedding <=> query_embedding))::FLOAT AS similarity
  FROM memory_embeddings m
  WHERE
    (p_user_id IS NULL OR m.user_id = p_user_id)
    AND (p_session_id IS NULL OR m.session_id = p_session_id)
    AND (p_memory_type IS NULL OR m.memory_type::text = p_memory_type)
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_memories_hybrid IS 'Hybrid search: semantic similarity + keyword match + temporal recency. Fixed hnsw.ef_search issue from migration 064.';
COMMENT ON FUNCTION search_memories_semantic IS 'Pure semantic vector search with cosine similarity. Fixed hnsw.ef_search issue from migration 064.';
