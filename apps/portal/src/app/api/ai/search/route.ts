/**
 * POST /api/ai/search
 *
 * Semantic search across portal data using Gemini embeddings.
 * Generates a query embedding via the configured provider, then searches
 * the memory_embeddings table using cosine similarity.
 *
 * Request body:
 *   { query: string, limit?: number, department?: string }
 *
 * Response:
 *   { results: Array<{ content: string, similarity: number, metadata: object }>, query: string }
 *
 * @see https://ai.google.dev/api/embeddings
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit-middleware'
import { logError } from '@/lib/errors/error-logger'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(2000, 'Query too long'),
  limit: z.number().int().min(1).max(50).default(10),
  department: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handleSearch(request: NextRequest): Promise<NextResponse> {
  // 1. Auth check
  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  // 2. Parse & validate body
  let body: z.infer<typeof SearchRequestSchema>
  try {
    const raw = await request.json()
    const parsed = SearchRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // 3. Generate query embedding
  try {
    const { getEmbedding } = await import('@/lib/ai/embedding-provider')
    const { embedding } = await getEmbedding(body.query)

    // 4. Search memory_embeddings via Supabase RPC
    const supabase = auth.supabase
    const { data, error } = await supabase.rpc('search_memories_hybrid', {
      query_embedding: embedding as unknown as string,
      query_text: body.query,
      p_user_id: auth.user.id,
      p_session_id: null,
      p_memory_type: null,
      match_count: body.limit,
      semantic_weight: 0.6,
      keyword_weight: 0.2,
      temporal_weight: 0.2,
    })

    if (error) {
      // If RPC fails (e.g., dimension mismatch), fall back to simple text search
      const { data: fallbackData } = await supabase
        .from('memory_embeddings')
        .select('content, metadata, memory_type')
        .ilike('content', `%${body.query}%`)
        .limit(body.limit)

      const results = (fallbackData ?? []).map(
        (row: { content: string | null; metadata: unknown; memory_type: string | null }) => ({
          content: row.content,
          similarity: 0.5, // approximate for text match
          metadata: row.metadata,
          type: row.memory_type,
        })
      )

      return NextResponse.json({
        results,
        query: body.query,
        provider: 'text-fallback',
      })
    }

    const results = (data ?? []).map((row: Record<string, unknown>) => ({
      content: row.content,
      similarity: row.similarity,
      metadata: row.metadata,
      type: row.memory_type,
    }))

    return NextResponse.json({
      results,
      query: body.query,
      provider: 'vector-search',
    })
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: 'ai_search_endpoint',
      userId: auth.user.id,
      query: body.query,
    })

    return NextResponse.json(
      { error: 'Search failed', results: [], query: body.query },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// Export with rate limiting
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  return withRateLimit(request, () => handleSearch(request))
}
