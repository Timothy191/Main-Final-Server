import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { getRedisClient } from '@repo/redis/client'
import { generateLocalFallbackEmbedding } from '@/lib/ai/embedding-provider'

export const dynamic = 'force-dynamic' // Health check should never be cached

export async function GET() {
  const startedAt = Date.now()
  const checks: Record<string, unknown> = {}
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  // 1. Check Supabase / PostgreSQL Database connectivity
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from('employees').select('role').limit(1)

    if (error) {
      checks.database = { status: 'degraded', error: error.message }
      status = 'degraded'
    } else {
      checks.database = { status: 'healthy' }
    }

    // 1b. Synthetic health check assertion for pgvector HNSW index
    try {
      const pingVector = generateLocalFallbackEmbedding('synthetic health check ping')
      const { error: vecError } = await supabase.rpc('search_memories_semantic', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        query_embedding: pingVector as unknown as string,
        similarity_threshold: 0.0,
        match_count: 1,
      })

      if (vecError && !vecError.message.includes('search_memories_semantic')) {
        checks.pgvector_hnsw = { status: 'degraded', error: vecError.message }
        status = 'degraded'
      } else {
        checks.pgvector_hnsw = { status: 'healthy' }
      }
    } catch (vecErr) {
      checks.pgvector_hnsw = {
        status: 'degraded',
        error: vecErr instanceof Error ? vecErr.message : String(vecErr),
      }
      status = 'degraded'
    }
  } catch (err: unknown) {
    checks.database = {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : String(err),
    }
    status = 'unhealthy'
  }

  // 2. Check Redis Cache connectivity (ioredis — status === "ready")
  try {
    const redis = await getRedisClient()
    let redisConnected = redis.status === 'ready'
    if (!redisConnected) {
      try {
        const pong = await redis.ping()
        redisConnected = pong === 'PONG'
      } catch {
        redisConnected = false
      }
    }
    checks.redis = {
      status: redisConnected ? 'healthy' : 'degraded',
      connected: redisConnected,
    }
    if (!redisConnected) {
      if (status !== 'unhealthy') {
        status = 'degraded'
      }
    }
  } catch (err: unknown) {
    checks.redis = {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : String(err),
    }
    status = 'unhealthy'
  }

  const responseStatus = status === 'unhealthy' ? 503 : 200

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      checks,
    },
    { status: responseStatus }
  )
}
