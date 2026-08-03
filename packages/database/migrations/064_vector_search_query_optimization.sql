-- ============================================
-- Migration: 064_vector_search_query_optimization
-- Description: Add query-specific ef_search parameters for vector search
--              and implement hybrid search result caching.
--
--              Benefits:
--              1. Adaptive ef_search based on query complexity
--              2. Result caching for common vector search queries
--              3. Performance monitoring for search operations
-- ============================================

-- ============================================
-- PART 1: Enhanced vector search functions with adaptive ef_search
-- ============================================

-- Drop existing functions to recreate with optimizations
DROP FUNCTION IF EXISTS public.search_memories_hybrid(
  query_embedding VECTOR(1536),
  query_text TEXT,
  p_user_id UUID,
  p_session_id TEXT,
  p_memory_type TEXT,
  match_count INT,
  semantic_weight FLOAT,
  keyword_weight FLOAT,
  temporal_weight FLOAT
);

DROP FUNCTION IF EXISTS public.search_memories_semantic(
  query_embedding VECTOR(1536),
  p_user_id UUID,
  p_session_id TEXT,
  p_memory_type TEXT,
  match_count INT,
  similarity_threshold FLOAT
);

-- Enhanced hybrid search with adaptive ef_search
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
  ef_search INT DEFAULT NULL  -- New: allow caller to specify ef_search
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
  adaptive_ef_search INT;
BEGIN
  -- Adaptive ef_search: higher for complex queries, lower for simple ones
  IF ef_search IS NOT NULL THEN
    adaptive_ef_search := ef_search;
  ELSE
    -- Base on match_count and complexity
    IF match_count > 20 THEN
      adaptive_ef_search := 300;  -- More results, need higher recall
    ELSIF match_count > 10 THEN
      adaptive_ef_search := 200;  -- Default (existing behavior)
    ELSE
      adaptive_ef_search := 150;  -- Fewer results, can use lower ef_search for speed
    END IF;
  END IF;
  
  -- Set the adaptive ef_search for this query
  SET LOCAL hnsw.ef_search = adaptive_ef_search;
  
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

-- Enhanced semantic search with adaptive ef_search
CREATE OR REPLACE FUNCTION search_memories_semantic(
  query_embedding VECTOR(1536),
  p_user_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_memory_type TEXT DEFAULT NULL,
  match_count INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.7,
  ef_search INT DEFAULT NULL  -- New: allow caller to specify ef_search
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
DECLARE
  adaptive_ef_search INT;
BEGIN
  -- Adaptive ef_search based on query parameters
  IF ef_search IS NOT NULL THEN
    adaptive_ef_search := ef_search;
  ELSE
    -- Higher threshold needs more thorough search
    IF similarity_threshold > 0.8 THEN
      adaptive_ef_search := 250;
    ELSIF match_count > 20 THEN
      adaptive_ef_search := 300;
    ELSE
      adaptive_ef_search := 200;
    END IF;
  END IF;
  
  -- Set the adaptive ef_search for this query
  SET LOCAL hnsw.ef_search = adaptive_ef_search;
  
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
-- PART 2: Hybrid search result caching
-- ============================================

-- Create cache table for vector search results
CREATE TABLE IF NOT EXISTS vector_search_cache (
  cache_key VARCHAR(64) PRIMARY KEY,  -- SHA-256 hash of query parameters
  query_params JSONB NOT NULL,         -- Store original query parameters for debugging
  result_data JSONB NOT NULL,          -- Cached search results
  memory_type TEXT,                    -- Optional: filter by memory type
  user_id UUID NOT NULL,               -- User isolation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count INT DEFAULT 1,          -- Track cache popularity
  ttl_seconds INT DEFAULT 3600         -- Time-to-live in seconds (default 1 hour)
);

-- Create indexes for cache management
CREATE INDEX idx_vector_search_cache_user_id ON vector_search_cache(user_id);
CREATE INDEX idx_vector_search_cache_memory_type ON vector_search_cache(memory_type) WHERE memory_type IS NOT NULL;
CREATE INDEX idx_vector_search_cache_created_at ON vector_search_cache(created_at);
CREATE INDEX idx_vector_search_cache_ttl ON vector_search_cache(created_at, ttl_seconds);

-- Enable RLS on cache table
ALTER TABLE vector_search_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own cache entries
CREATE POLICY "vector_search_cache_select_own"
  ON vector_search_cache FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vector_search_cache_insert_own"
  ON vector_search_cache FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vector_search_cache_update_own"
  ON vector_search_cache FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to generate cache key from query parameters
CREATE OR REPLACE FUNCTION public.generate_vector_search_cache_key(
  p_user_id UUID,
  p_memory_type TEXT,
  p_match_count INT,
  p_similarity_threshold FLOAT
)
RETURNS VARCHAR(64)
LANGUAGE sql
STABLE
AS $$
  SELECT encode(digest(
    p_user_id::TEXT || 
    COALESCE(p_memory_type, '') || 
    p_match_count::TEXT || 
    COALESCE(p_similarity_threshold::TEXT, '0.7')
  , 'sha256'), 'hex')
$$;

-- Function to get cached search results
CREATE OR REPLACE FUNCTION public.get_cached_vector_search(
  p_cache_key VARCHAR(64),
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT result_data
  FROM vector_search_cache
  WHERE cache_key = p_cache_key
    AND user_id = p_user_id
    AND created_at + (ttl_seconds || ' seconds')::INTERVAL > NOW()
  LIMIT 1;
$$;

-- Function to cache search results
CREATE OR REPLACE FUNCTION public.cache_vector_search_results(
  p_cache_key VARCHAR(64),
  p_query_params JSONB,
  p_result_data JSONB,
  p_user_id UUID,
  p_memory_type TEXT DEFAULT NULL,
  p_ttl_seconds INT DEFAULT 3600
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update access count and timestamp if cache entry exists
  UPDATE vector_search_cache
  SET 
    result_data = p_result_data,
    last_accessed_at = NOW(),
    access_count = access_count + 1,
    ttl_seconds = p_ttl_seconds
  WHERE cache_key = p_cache_key AND user_id = p_user_id;
  
  -- Insert new cache entry if it doesn't exist
  INSERT INTO vector_search_cache (
    cache_key, query_params, result_data, user_id, memory_type, ttl_seconds
  )
  SELECT 
    p_cache_key, p_query_params, p_result_data, p_user_id, p_memory_type, p_ttl_seconds
  WHERE NOT EXISTS (
    SELECT 1 FROM vector_search_cache 
    WHERE cache_key = p_cache_key AND user_id = p_user_id
  );
END;
$$;

-- Function to clean up expired cache entries (run via pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_vector_search_cache()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM vector_search_cache
  WHERE created_at + (ttl_seconds || ' seconds')::INTERVAL < NOW()
    OR access_count < 2 AND created_at < NOW() - INTERVAL '7 days';  -- Remove unpopular old entries
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_vector_search_cache_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cached_vector_search(VARCHAR(64), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cache_vector_search_results TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_vector_search_cache() TO authenticated;

-- Schedule cache cleanup every 6 hours
SELECT cron.schedule(
  'cleanup-vector-search-cache',
  '0 */6 * * *',
  'SELECT public.cleanup_vector_search_cache()'
);

COMMENT ON TABLE vector_search_cache IS 'Cache for vector search results to improve performance of repeated queries.';
COMMENT ON FUNCTION public.search_memories_hybrid IS 'Enhanced hybrid search with adaptive ef_search based on query complexity.';
COMMENT ON FUNCTION public.search_memories_semantic IS 'Enhanced semantic search with adaptive ef_search based on query parameters.';

-- ============================================
-- PART 3: Performance monitoring for vector searches
-- ============================================

-- Create table to track vector search performance
CREATE TABLE IF NOT EXISTS vector_search_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  search_type TEXT NOT NULL,  -- 'hybrid' or 'semantic'
  match_count INT NOT NULL,
  ef_search INT NOT NULL,
  result_count INT NOT NULL,
  execution_time_ms FLOAT NOT NULL,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance monitoring
CREATE INDEX idx_vector_search_performance_user_id ON vector_search_performance(user_id);
CREATE INDEX idx_vector_search_performance_search_type ON vector_search_performance(search_type);
CREATE INDEX idx_vector_search_performance_created_at ON vector_search_performance(created_at);

-- Enable RLS
ALTER TABLE vector_search_performance ENABLE ROW LEVEL SECURITY;

-- Users can only see their own performance data
CREATE POLICY "vector_search_performance_select_own"
  ON vector_search_performance FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vector_search_performance_insert_own"
  ON vector_search_performance FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to record search performance
CREATE OR REPLACE FUNCTION public.record_vector_search_performance(
  p_user_id UUID,
  p_search_type TEXT,
  p_match_count INT,
  p_ef_search INT,
  p_result_count INT,
  p_execution_time_ms FLOAT,
  p_cache_hit BOOLEAN DEFAULT FALSE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO vector_search_performance (
    user_id, search_type, match_count, ef_search, result_count, execution_time_ms, cache_hit
  ) VALUES (
    p_user_id, p_search_type, p_match_count, p_ef_search, p_result_count, p_execution_time_ms, p_cache_hit
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_vector_search_performance TO authenticated;

COMMENT ON TABLE vector_search_performance IS 'Performance monitoring table for vector search operations.';
COMMENT ON FUNCTION public.record_vector_search_performance IS 'Records performance metrics for vector search operations.';

-- Cleanup old performance data (older than 30 days)
SELECT cron.schedule(
  'cleanup-vector-search-performance',
  '0 3 * * *',
  'DELETE FROM vector_search_performance WHERE created_at < NOW() - INTERVAL ''30 days'''
);
