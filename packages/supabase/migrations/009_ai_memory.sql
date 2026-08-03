-- ============================================
-- AI Memory System - Vector Store + Episodic/Semantic Memory
-- ============================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. Memory Embeddings Table
-- ============================================
CREATE TABLE IF NOT EXISTS memory_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  memory_type TEXT NOT NULL DEFAULT 'episodic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Validate memory_type
ALTER TABLE memory_embeddings
  ADD CONSTRAINT memory_type_check
  CHECK (memory_type IN ('episodic', 'semantic', 'procedural'));

-- ============================================
-- 2. Indexes for fast retrieval
-- ============================================

-- HNSW index for approximate nearest neighbor search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_hnsw
  ON memory_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- B-tree indexes for filtering
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_session
  ON memory_embeddings(session_id);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_user
  ON memory_embeddings(user_id);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_type
  ON memory_embeddings(memory_type);

CREATE INDEX IF NOT EXISTS idx_memory_embeddings_created_at
  ON memory_embeddings(created_at DESC);

-- Composite index for common query pattern: user's episodic memories by session
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_user_session_type
  ON memory_embeddings(user_id, session_id, memory_type, created_at DESC);

-- GIN index for metadata filtering
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_metadata
  ON memory_embeddings USING GIN (metadata);

-- Full-text search index for hybrid keyword + semantic retrieval
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_fts
  ON memory_embeddings
  USING GIN (to_tsvector('english', content));

-- ============================================
-- 3. Row Level Security
-- ============================================
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

-- ============================================
-- 4. Helper Functions
-- ============================================

-- Hybrid search: semantic similarity + keyword match + temporal recency
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
AS $$
DECLARE
  lambda FLOAT := 0.05; -- temporal decay constant (half-life ~13.9 hours)
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.session_id,
    m.content,
    m.metadata,
    m.memory_type,
    m.created_at,
    -- Semantic score: cosine similarity (1 - distance, normalized to [0,1])
    (1 - (m.embedding <=> query_embedding))::FLOAT AS semantic_score,
    -- Keyword score: normalized ts_rank
    COALESCE(
      ts_rank(
        to_tsvector('english', m.content),
        plainto_tsquery('english', query_text)
      ),
      0
    )::FLOAT AS keyword_score,
    -- Temporal score: exponential decay from now
    EXP(-lambda * EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 3600)::FLOAT AS temporal_score,
    -- Combined weighted score
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

-- Pure semantic search (fast ANN via HNSW)
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

-- Conversation history retrieval (episodic memory for a session)
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_session_id TEXT,
  p_user_id UUID,
  message_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.metadata,
    m.created_at
  FROM memory_embeddings m
  WHERE m.session_id = p_session_id
    AND m.user_id = p_user_id
    AND m.memory_type = 'episodic'
  ORDER BY m.created_at DESC
  LIMIT message_limit;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_memory_embeddings_updated_at
  BEFORE UPDATE ON memory_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Memory Cleanup (optional cron job material)
-- ============================================
-- Episodic memories older than 90 days can be pruned
-- Semantic memories are kept indefinitely
