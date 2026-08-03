-- ============================================
-- AI Embedding Cache — Persistent User-Isolated Cache
-- ============================================
-- Stores 768-dimension vector embeddings (from nomic-embed-text)
-- keyed by SHA-256 hash of the input text and isolated by user_id.
-- ============================================

CREATE TABLE IF NOT EXISTS embedding_cache (
  text_hash VARCHAR(64) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (text_hash, user_id),
  CONSTRAINT valid_embedding_dim CHECK (vector_dims(embedding) = 768)
);

-- RLS: enable Row Level Security
ALTER TABLE embedding_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT their own cached embeddings
CREATE POLICY "embedding_cache_select_own"
  ON embedding_cache FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to INSERT their own cached embeddings
CREATE POLICY "embedding_cache_insert_own"
  ON embedding_cache FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE embedding_cache IS 'User-isolated cache for Ollama 768-dimension text embeddings.';
