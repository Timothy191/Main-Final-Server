import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { inngest } from '@repo/utils/inngest'
import { createServiceRoleClient } from '@repo/supabase/service-role'
import { withRateLimit } from '@/lib/api/rate-limit-middleware'

/**
 * POST /api/cleanup/trigger
 *
 * Manually trigger the cache-cleanup Inngest job.
 * Rate-limited: 5 req/min per client.
 * Requires admin/supervisor role.
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const supabase = createServiceRoleClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { data: employee } = await supabase
        .from('employees')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (!employee || !['admin', 'supervisor'].includes(employee.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Trigger the cache-cleanup event
      await inngest.send({
        name: 'cache/cleanup',
        data: { triggeredBy: user.id, timestamp: new Date().toISOString() },
      })

      return NextResponse.json({ success: true, message: 'Cache cleanup triggered' })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
