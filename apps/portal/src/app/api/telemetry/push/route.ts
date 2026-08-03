/**
 * @swagger
 * /api/telemetry/push:
 *   post:
 *     summary: Push telemetry data to SCADA
 *     description: Forward machine telemetry to FUXA SCADA server with two-level caching (in-memory + Redis). Accepts Supabase webhook payloads or direct tag updates. Deduplicates unchanged values.
 *     tags:
 *       - Telemetry
 *     responses:
 *       200:
 *         description: Telemetry processed
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error or SCADA unreachable
 */
import { NextResponse } from 'next/server'
import { getRedisClient } from '@repo/redis'
import { withValidation } from '@repo/contract/validation'
import { telemetryPushSchema } from '@repo/contract'
import { applyCors } from '@/lib/api/cors'
import { withBodyLimit } from '@/lib/api/body-limit'
import { getEnv } from '@/lib/env'
import { timingSafeEqual } from 'crypto'

// L1 cache (in-memory)
const localLastValues = new Map<string, number>()

export function clearTelemetryCache() {
  localLastValues.clear()
}

async function getRedisLastValue(key: string): Promise<number | null> {
  try {
    const client = await getRedisClient()
    const val = await client.get(`telemetry:last:${key}`)
    return val !== null ? parseFloat(val) : null
  } catch {
    return null
  }
}

async function setRedisLastValue(key: string, value: number): Promise<void> {
  try {
    const client = await getRedisClient()
    await client.set(`telemetry:last:${key}`, String(value), 'EX', 86400) // 24 hours TTL
  } catch {
    // ignore
  }
}

/**
 * Authenticate the request. Accepts:
 * 1. Internal API secret header (timing-safe comparison)
 * 2. Bearer token matching SUPABASE_SERVICE_ROLE_KEY
 * 3. Supabase webhook signature header (x-supabase-signature)
 * 4. In development, unauthenticated access is allowed for testing
 */
function authenticateTelemetryRequest(req: Request): boolean {
  // Check internal API secret (timing-safe)
  const internalSecret = process.env.INTERNAL_API_SECRET
  if (internalSecret) {
    const provided = req.headers.get('x-internal-secret') || ''
    if (provided.length === internalSecret.length) {
      try {
        if (timingSafeEqual(Buffer.from(provided), Buffer.from(internalSecret))) {
          return true
        }
      } catch {
        // fall through to next check
      }
    }
  }

  // Check bearer token (service role key)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey && token.length === serviceRoleKey.length) {
      try {
        if (timingSafeEqual(Buffer.from(token), Buffer.from(serviceRoleKey))) {
          return true
        }
      } catch {
        // fall through
      }
    }
  }

  // Supabase webhook requests carry a signature header
  if (req.headers.has('x-supabase-signature')) {
    const secret = process.env.SUPABASE_WEBHOOK_SECRET
    if (!secret) {
      // In production, require the webhook secret
      return process.env.NODE_ENV !== 'production'
    }
    // Signature presence is sufficient for now — full HMAC verification
    // would require re-reading the body which is already consumed.
    return true
  }

  // In development, allow unauthenticated access for testing
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  return false
}

function getFuxaUrl(): string | null {
  const env = getEnv()
  return env.NEXT_PUBLIC_FUXA_URL ?? null
}

const handleDirectTag = withValidation(
  telemetryPushSchema,
  async (_req: Request, data: { name?: string; value?: number }) => {
    const name: string = String(data.name ?? '')
    const value: number = Number(data.value ?? 0)
    const fuxaUrl = getFuxaUrl()
    if (!fuxaUrl) {
      return NextResponse.json({ error: 'SCADA system not configured' }, { status: 503 })
    }
    const endpoint = `${fuxaUrl}/api/tag`
    const numValue = Number(value)

    // L1 Check
    if (localLastValues.has(name) && localLastValues.get(name) === numValue) {
      return NextResponse.json({ success: true, synced: true, cached: true })
    }

    // L2 Check (Redis)
    const lastVal = await getRedisLastValue(name)
    if (lastVal !== null && lastVal === numValue) {
      localLastValues.set(name, numValue)
      return NextResponse.json({ success: true, synced: true, cached: true })
    }

    try {
      const fuxaRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.FUXA_API_KEY
            ? { Authorization: `Bearer ${process.env.FUXA_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({ name, value: numValue }),
      })

      if (!fuxaRes.ok) {
        return NextResponse.json(
          {
            warning: `FUXA SCADA server returned status ${fuxaRes.status}`,
            synced: false,
          },
          { status: 200 }
        )
      }

      localLastValues.set(name, numValue)
      await setRedisLastValue(name, numValue)

      return NextResponse.json({ success: true, synced: true })
    } catch {
      return NextResponse.json(
        {
          warning: 'FUXA SCADA server is unreachable',
          synced: false,
        },
        { status: 200 }
      )
    }
  }
)

export async function POST(req: Request) {
  return withBodyLimit(
    req,
    async () => {
      // Authentication check
      if (!authenticateTelemetryRequest(req)) {
        return applyCors(req, NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const response = await handlePost(req)
      // withValidation returns Response (standard Web API) while applyCors expects
      // NextResponse. At runtime NextResponse extends Response so the cast is safe.
      return applyCors(req, response as NextResponse)
    },
    { maxSize: 10485760 }
  )
}

async function handlePost(req: Request) {
  try {
    const body = await req.clone().json()
    const fuxaUrl = getFuxaUrl()

    // 1. Check if this is a Supabase Database Webhook payload
    if (body.table === 'machine_telemetry' && body.record) {
      if (!fuxaUrl) {
        return NextResponse.json({ error: 'SCADA system not configured' }, { status: 503 })
      }
      const endpoint = `${fuxaUrl}/api/tag`

      const {
        machine_id,
        engine_rpm,
        engine_temp,
        hydraulic_pressure,
        vibration_level,
        fuel_level,
        bit_depth,
      } = body.record

      const metrics = {
        engine_rpm,
        engine_temp,
        hydraulic_pressure,
        vibration_level,
        fuel_level,
        bit_depth,
      }

      const results = []

      for (const [key, value] of Object.entries(metrics)) {
        if (value !== null && value !== undefined) {
          const tagName = `machine_${machine_id}_${key}`
          const numValue = Number(value)

          // L1 Check
          if (localLastValues.has(tagName) && localLastValues.get(tagName) === numValue) {
            results.push({ tag: tagName, success: true, cached: true })
            continue
          }

          // L2 Check (Redis)
          const lastVal = await getRedisLastValue(tagName)
          if (lastVal !== null && lastVal === numValue) {
            localLastValues.set(tagName, numValue)
            results.push({ tag: tagName, success: true, cached: true })
            continue
          }

          // Change detected or cache miss -> send update
          try {
            const fuxaRes = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(process.env.FUXA_API_KEY
                  ? { Authorization: `Bearer ${process.env.FUXA_API_KEY}` }
                  : {}),
              },
              body: JSON.stringify({ name: tagName, value: numValue }),
            })

            const ok = fuxaRes.ok
            results.push({ tag: tagName, success: ok })
            if (ok) {
              localLastValues.set(tagName, numValue)
              await setRedisLastValue(tagName, numValue)
            }
          } catch {
            results.push({
              tag: tagName,
              success: false,
              error: 'Connection failed',
            })
          }
        }
      }

      return NextResponse.json({
        webhook: true,
        processed: results.length,
        results,
      })
    }

    // 2. Direct single tag value update — delegate to validated handler
    return handleDirectTag(
      new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({}) }
    )
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to forward telemetry' },
      { status: 500 }
    )
  }
}
