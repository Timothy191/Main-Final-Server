/**
 * POST /api/cache/invalidate
 *
 * Cache invalidation endpoint for department data.
 * Allows targeted invalidation of cached data when database changes occur.
 *
 * Usage:
 *   POST /api/cache/invalidate
 *   Body: { tags: ['dept:engineering', 'table:breakdowns'] }
 *
 *   OR
 *
 *   POST /api/cache/invalidate
 *   Body: { department: 'engineering' }
 *
 *   OR — evict a user's edge-auth cache after a role / department change:
 *   POST /api/cache/invalidate
 *   Body: { userId: '<auth_id>' }
 *
 * AGENT-TRACE: `userId` evicts the employee-auth cache record that
 * `proxy.ts` `resolveEmployee` caches at `arch:auth:employee:<userId>` for
 * 300s (Redis L2) / 30s (in-process L1). It deletes BOTH tiers (`cacheDelete`
 * → `memoryDelete` + `redis.del`) so the next request re-reads `employees` on
 * every pod. The role-change admin flow MUST call this with the TARGET user's
 * id, otherwise the edge proxy keeps authorizing on the old role for up to
 * 5 min. See docs/WAYFINDER.md → "Caching" + ADR-001.
 */

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { cacheDelete } from '@repo/redis/cache'
import { AppError } from '@/lib/errors/error-classes'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AppError('Unauthorized', {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required to invalidate cache',
      })
    }

    const body = await request.json()
    const { tags, department, allDepartments, userId } = body as {
      tags?: string[]
      department?: string
      allDepartments?: boolean
      userId?: string
    }

    if (!tags && !department && !allDepartments && !userId) {
      return NextResponse.json(
        {
          error: 'No invalidation target specified',
          hint: 'Provide tags, department, allDepartments: true, or userId',
        },
        { status: 400 }
      )
    }

    // Evict the edge-proxy employee-auth cache for a specific user — BOTH the
    // in-process L1 and the Redis L2 key. Called by the role-change flow so the
    // proxy re-reads `employees` on the next request instead of serving the
    // pre-change role for up to 300s.
    // AGENT-TRACE: `cacheDelete` does `memoryDelete` + `redis.del` (L1 + L2).
    // The previous `cacheEvictL1ByPrefix` was L1-only and left the Redis key
    // for its 300s TTL — `cacheGet` would re-populate L1 from the stale L2 hit.
    // See ADR-001 (docs/architecture/adr-001-cache-auth-eviction-l1-l2.md) and
    // docs/runbooks/evict-employee-auth-cache.md.
    let evictedUser = false
    if (userId) {
      await cacheDelete(`arch:auth:employee:${userId}`)
      evictedUser = true
    }

    const tagsToInvalidate: string[] = []

    // Handle all departments invalidation
    if (allDepartments) {
      tagsToInvalidate.push(
        ...Object.values(DEPARTMENT_CACHE_TAGS).filter(
          (tag) => tag.startsWith('dept:') || tag.startsWith('table:')
        )
      )
    }

    // Handle specific department
    if (department) {
      const deptTag = DEPARTMENT_CACHE_TAGS[department as keyof typeof DEPARTMENT_CACHE_TAGS]
      if (deptTag) {
        tagsToInvalidate.push(deptTag)
      } else {
        tagsToInvalidate.push(`dept:${department}`)
      }
    }

    // Handle custom tags
    if (tags && Array.isArray(tags)) {
      tagsToInvalidate.push(...tags)
    }

    // Deduplicate tags
    const uniqueTags = [...new Set(tagsToInvalidate)]

    // Invalidate each tag
    const results = await Promise.allSettled(uniqueTags.map((tag) => revalidateTag(tag, 'max')))

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failedCount = results.length - successCount

    return NextResponse.json({
      success: true,
      invalidated: uniqueTags.length,
      successCount,
      failedCount,
      tags: uniqueTags,
      evictedUserAuth: evictedUser ? userId : undefined,
      failedTags: results
        .filter((r) => r.status === 'rejected')
        .map((r, i) => ({ tag: uniqueTags[i], reason: r.reason })),
    })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 })
    }

    console.error('[cache/invalidate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate cache', message: (error as Error).message },
      { status: 500 }
    )
  }
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Cache invalidation endpoint is available',
    endpoint: 'POST /api/cache/invalidate',
  })
}
