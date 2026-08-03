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
 */

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createServerSupabaseClient } from '@repo/supabase/server'
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
    const { tags, department, allDepartments } = body as {
      tags?: string[]
      department?: string
      allDepartments?: boolean
    }

    if (!tags && !department && !allDepartments) {
      return NextResponse.json(
        {
          error: 'No invalidation target specified',
          hint: 'Provide tags, department, or allDepartments: true',
        },
        { status: 400 }
      )
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
