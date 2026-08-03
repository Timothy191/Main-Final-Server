import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@repo/supabase/service-role'
import { cacheSet, cacheGet } from '@repo/redis/cache'
import { generateLocalFallbackEmbedding } from '@/lib/ai/embedding-provider'

export async function GET(_req: NextRequest) {
  const startedAt = Date.now()
  const components: Record<string, string> = {
    postgres: 'skipped',
    pgvector_hnsw: 'skipped',
    redis: 'skipped',
  }

  try {
    const supabase = createServiceRoleClient()
    const { error: pgError } = await supabase.from('departments').select('id').limit(1)

    if (pgError) {
      components.postgres = `error: ${pgError.message}`
    } else {
      components.postgres = 'ok'
    }

    // Warm-up pgvector HNSW index by executing a dummy vector match query
    try {
      const dummyVec = generateLocalFallbackEmbedding('system warmup ping 1536d vector')
      const { error: vecError } = await supabase.rpc('match_memories', {
        query_embedding: dummyVec,
        match_threshold: 0.0,
        match_count: 1,
      })

      if (vecError && !vecError.message.includes('function match_memories does not exist')) {
        components.pgvector_hnsw = `warn: ${vecError.message}`
      } else {
        components.pgvector_hnsw = 'ok'
      }
    } catch (vecErr) {
      components.pgvector_hnsw = `warn: ${vecErr instanceof Error ? vecErr.message : String(vecErr)}`
    }
  } catch (error) {
    components.postgres = `error: ${error instanceof Error ? error.message : String(error)}`
  }

  try {
    await cacheSet('health:warmup:v1', Date.now().toString(), 60)
    const _cached = await cacheGet<string>('health:warmup:v1')
    components.redis = 'ok'
  } catch (error) {
    components.redis = `error: ${error instanceof Error ? error.message : String(error)}`
  }

  const degraded = Object.values(components).some((value) => value.startsWith('error'))
  const status = degraded ? 'degraded' : 'ok'

  return NextResponse.json(
    { status, latencyMs: Date.now() - startedAt, components },
    { status: degraded ? 503 : 200, headers: { 'X-Health-Status': status } }
  )
}
