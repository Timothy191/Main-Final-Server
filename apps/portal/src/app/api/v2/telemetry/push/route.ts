/**
 * Arch System API v2 — Telemetry Push SCADA Integration
 * Forward machine telemetry to FUXA SCADA server with L1/L2 Redis caching.
 */
import { NextResponse } from 'next/server'
import { getRedisClient } from '@repo/redis/client'
import { withValidation } from '@repo/contract/validation'
import { telemetryPushSchema } from '@repo/contract'
import { applyCors } from '@/lib/api/cors'
import { withBodyLimit } from '@/lib/api/body-limit'
import { getEnv } from '@/lib/env'
import { timingSafeEqual } from 'crypto'

const localLastValues = new Map<string, number>()

export function clearTelemetryCacheV2() {
  localLastValues.clear()
}

async function getRedisLastValue(key: string): Promise<number | null> {
  try {
    const client = await getRedisClient()
    const val = await client.get(`telemetry:v2:last:${key}`)
    return val !== null ? parseFloat(val) : null
  } catch {
    return null
  }
}

async function setRedisLastValue(key: string, value: number): Promise<void> {
  try {
    const client = await getRedisClient()
    await client.set(`telemetry:v2:last:${key}`, String(value), 'EX', 86400)
  } catch {
    // ignore
  }
}

function authenticateTelemetryRequest(req: Request): boolean {
  const internalSecret = process.env.INTERNAL_API_SECRET
  if (internalSecret) {
    const provided = req.headers.get('x-internal-secret') || ''
    if (provided.length === internalSecret.length) {
      try {
        if (timingSafeEqual(Buffer.from(provided), Buffer.from(internalSecret))) {
          return true
        }
      } catch {
        // continue
      }
    }
  }

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
        // continue
      }
    }
  }

  if (req.headers.has('x-supabase-signature')) {
    return true
  }

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

    if (localLastValues.has(name) && localLastValues.get(name) === numValue) {
      return NextResponse.json({ success: true, synced: true, cached: true, version: 'v2' })
    }

    const lastVal = await getRedisLastValue(name)
    if (lastVal !== null && lastVal === numValue) {
      localLastValues.set(name, numValue)
      return NextResponse.json({ success: true, synced: true, cached: true, version: 'v2' })
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
            version: 'v2',
          },
          { status: 200 }
        )
      }

      localLastValues.set(name, numValue)
      await setRedisLastValue(name, numValue)

      return NextResponse.json({ success: true, synced: true, version: 'v2' })
    } catch {
      return NextResponse.json(
        {
          warning: 'FUXA SCADA server is unreachable',
          synced: false,
          version: 'v2',
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
      if (!authenticateTelemetryRequest(req)) {
        return applyCors(req, NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const response = await handlePost(req)
      return applyCors(req, response as NextResponse)
    },
    { maxSize: 10485760 }
  )
}

async function handlePost(req: Request) {
  try {
    const body = await req.clone().json()
    const fuxaUrl = getFuxaUrl()

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

          if (localLastValues.has(tagName) && localLastValues.get(tagName) === numValue) {
            results.push({ tag: tagName, success: true, cached: true })
            continue
          }

          const lastVal = await getRedisLastValue(tagName)
          if (lastVal !== null && lastVal === numValue) {
            localLastValues.set(tagName, numValue)
            results.push({ tag: tagName, success: true, cached: true })
            continue
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
        version: 'v2',
      })
    }

    return handleDirectTag(
      new Request(req.url, {
        method: req.method,
        headers: new Headers({ 'Content-Type': 'application/json' }),
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

export async function GET(req: Request) {
  const alerts = [
    {
      id: 'scada-1',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      severity: 'critical',
      tag: 'EXC_04_HYDRAULIC_TEMP',
      message: 'Excavator 04 hydraulic oil temp threshold exceeded (>85°C)',
      value: (85 + Math.random() * 5).toFixed(1),
      unit: '°C',
    },
    {
      id: 'scada-2',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      severity: 'warning',
      tag: 'TRK_102_FUEL_LEVEL',
      message: 'Haul Truck 102 low fuel warning (<15%)',
      value: (10 + Math.random() * 4).toFixed(1),
      unit: '%',
    },
    {
      id: 'scada-3',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      severity: 'info',
      tag: 'CONVEYOR_01_SPEED',
      message: 'Main Coal Overland Conveyor speed synchronized',
      value: 4.2,
      unit: 'm/s',
    },
  ]

  return applyCors(
    req,
    NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      alerts,
    })
  )
}
