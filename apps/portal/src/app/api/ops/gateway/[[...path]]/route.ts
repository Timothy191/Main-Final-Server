import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { serverLogger } from '@repo/logger'

// Hop-by-hop headers that should not be forwarded (defined as a static Record lookup)
const SKIPPED_HEADERS: Record<string, boolean> = {
  host: true,
  connection: true,
  'keep-alive': true,
  'proxy-authenticate': true,
  'proxy-authorization': true,
  te: true,
  trailers: true,
  'transfer-encoding': true,
  upgrade: true,
}

async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
): Promise<NextResponse> {
  const secret = process.env.OPS_INTERNAL_SECRET
  const token = request.headers.get('x-ops-secret')

  let isAuthorized = false

  // 1. Authenticate via Internal Secret
  if (secret && token === secret) {
    isAuthorized = true
  } else {
    // 2. Fallback to Supabase Admin session check
    try {
      const supabase = await createServerSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('role')
          .eq('auth_id', user.id)
          .single()

        if (employee?.role === 'admin') {
          isAuthorized = true
        }
      }
    } catch (authError) {
      serverLogger().warn('Supabase auth check failed in gateway proxy:', authError)
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const paramsObj = await params
    const pathSegments = paramsObj.path ?? []
    const subPath = pathSegments.join('/')

    // Intercept health check directly (matches old HTTP Server)
    if (subPath === 'health' || subPath === '') {
      return NextResponse.json({
        name: 'arch-ops-gateway',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          'ops-gateway': 'healthy',
        },
      })
    }

    const searchParams = request.nextUrl.search
    const targetUrl = `http://127.0.0.1:3000/api/ops/${subPath}${searchParams}`

    // Build headers for the outgoing request
    const outgoingHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (!SKIPPED_HEADERS[lowerKey]) {
        outgoingHeaders[key] = value
      }
    })

    // Enforce target host and secret signatures
    outgoingHeaders['host'] = '127.0.0.1:3000'
    if (secret) {
      outgoingHeaders['x-ops-secret'] = secret
    }

    // Get body if request has payload
    let body: BodyInit | undefined = undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text()
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: outgoingHeaders,
      body,
    })

    const responseHeaders = new Headers()
    response.headers.forEach((val, key) => {
      // Forward headers from target service
      const lowerKey = key.toLowerCase()
      if (!SKIPPED_HEADERS[lowerKey]) {
        responseHeaders.set(key, val)
      }
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    serverLogger().error(`Proxy failed: ${error}`)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const DELETE = handle
export const PATCH = handle
export const OPTIONS = handle
export const HEAD = handle
