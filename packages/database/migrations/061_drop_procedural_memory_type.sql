-- ============================================
-- Drop 'procedural' from memory_type enum
-- ============================================
-- 'procedural' memory type has been removed from the codebase.
-- Any existing procedural rows are migrated to 'semantic'
-- since procedural instructions are a form of factual knowledge.
--
-- This migration also handles the partial HNSW indexes that
-- reference the old enum labels — they are dropped and recreated
-- after the type change.
-- ============================================

-- Step 1: Migrate any existing 'procedural' rows to 'semantic'
UPDATE memory_embeddings
SET memory_type = 'semantic'
WHERE memory_type::text = 'procedural';

-- Step 2: Drop column default BEFORE renaming the type
-- (avoids type-mismatch errors when the default expression references
--  the old enum name after the rename)
ALTER TABLE memory_embeddings
  ALTER COLUMN memory_type DROP DEFAULT;

-- Step 3: Drop partial HNSW indexes that reference the old enum labels
-- (they would break when the type is renamed)
DROP INDEX IF EXISTS idx_memory_embeddings_hnsw_episodic;
DROP INDEX IF EXISTS idx_memory_embeddings_hnsw_semantic;

-- Step 4: Rename old enum, create new one without 'procedural'
ALTER TYPE memory_type RENAME TO memory_type_old;
CREATE TYPE memory_type AS ENUM ('episodic', 'semantic');

-- Step 5: Cast column to new enum (safe — no more 'procedural' rows)
-- Two-step cast: memory_type_old → text → new memory_type
ALTER TABLE memory_embeddings
  ALTER COLUMN memory_type TYPE memory_type
  USING memory_type::text::memory_type;

-- Step 6: Restore default
ALTER TABLE memory_embeddings
  ALTER COLUMN memory_type SET DEFAULT 'episodic'::memory_type;

-- Step 7: Drop old enum
DROP TYPE memory_type_old;

-- Step 8: Recreate partial HNSW indexes for filtered vector search
CREATE INDEX idx_memory_embeddings_hnsw_episodic
  ON memory_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m='24', ef_construction='128')
  WHERE memory_type = 'episodic'::memory_type;

CREATE INDEX idx_memory_embeddings_hnsw_semantic
  ON memory_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m='24', ef_construction='128')
  WHERE memory_type = 'semantic'::memory_type;

-- Step 9: Update column comment
COMMENT ON COLUMN memory_embeddings.memory_type IS 'Enum: episodic (conversations), semantic (facts)';
