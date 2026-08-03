import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { EXTERNAL_TOOLS } from '@/lib/tools'
import { cacheWrap } from '@repo/redis'

/**
 * @swagger
 * /api/tools/status:
 *   get:
 *     summary: External tools health status
 *     description: Returns the health status and response times of all configured external tools. Results are cached for 60 seconds. Requires authentication.
 *     tags:
 *       - Tools
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of tool status objects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tools:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       url:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       color:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [online, offline, unknown]
 *                       responseTime:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

interface ToolStatus {
  name: string
  displayName: string
  url: string
  description: string
  icon: string
  color: string
  status: 'online' | 'offline' | 'unknown'
  responseTime?: number
}

async function checkToolHealth(tool: (typeof EXTERNAL_TOOLS)[number]): Promise<ToolStatus> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(tool.url, {
      method: 'HEAD',
      signal: controller.signal,
    })

    clearTimeout(timeout)

    return {
      ...tool,
      status: response.ok ? 'online' : 'offline',
      responseTime: Date.now() - start,
    }
  } catch {
    return {
      ...tool,
      status: 'offline',
      responseTime: Date.now() - start,
    }
  }
}

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statuses = await cacheWrap('tools:status', async () => {
    return await Promise.all(EXTERNAL_TOOLS.map(checkToolHealth))
  })

  return NextResponse.json({ tools: statuses })
}
