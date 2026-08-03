---
title: AI orchestration & product memory
tags: [architecture, ai, langgraph, memory, pgvector, supabase]
updated: 2026-07-21
source_agent: claude-code
status: active
---

# AI orchestration & product memory

Grounded in [`apps/portal/GEMINI.md`](../../../apps/portal/GEMINI.md) and
[`packages/database/migrations/009_ai_memory.sql`](../../../packages/database/migrations/009_ai_memory.sql).

## Portal AI subsystem

- **Agent graph:** LangGraph-based state machine in `apps/portal/src/lib/ai/agent-graph.ts`.
- **Modular subsystem:** `apps/portal/src/lib/ai/` holds modules for chunking, embeddings,
  memory, and tools.
- **Control plane:** `apps/ops-gateway/` is the MCP bridge/dispatcher/subscriber for
  external integrations and event-driven tasks.

## Product runtime memory (`memory_embeddings`)

Migration `009_ai_memory.sql` provisions end-user AI memory. This is a **product runtime
feature for portal users — not agent-development knowledge.** Keep agent-dev learnings in
this knowledge base instead.

- **Table:** `memory_embeddings` — `VECTOR(1536)` embedding, `content`, `metadata` JSONB,
  `memory_type` in (`episodic`, `semantic`, `procedural`), `session_id`, `user_id`.
- **Indexes:** HNSW (`vector_cosine_ops`, m=16, ef_construction=64) for ANN; B-tree +
  GIN (metadata) + FTS (`to_tsvector('english', content)`) for hybrid retrieval.
- **RLS:** scoped to `auth.uid()`, with an `employees.role = 'admin'` override. Every
  policy (select/insert/update/delete) requires ownership or admin.
- **Helper functions (`SECURITY DEFINER`):**
  - `search_memories_hybrid(...)` — weighted semantic + keyword + temporal (exponential
    decay, lambda 0.05 / ~13.9h half-life). Default weights 0.6 / 0.2 / 0.2.
  - `search_memories_semantic(...)` — fast ANN via HNSW with a similarity threshold.
  - `get_conversation_history(...)` — recent episodic rows for a session.
- **Retention:** episodic memories older than 90 days can be pruned; semantic kept
  indefinitely.

## Why this is separate from the knowledge base

The knowledge base (`.agents/knowledge/`) is durable, shared, cross-agent understanding
of the codebase, stored as git-tracked Markdown. `memory_embeddings` is per-user runtime
data behind RLS. Do not conflate them; do not store agent-dev notes in the DB table.
