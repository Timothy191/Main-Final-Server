/**
 * @jest-environment node
 */
import { GET } from './route'
import { NextRequest } from 'next/server'

// Mock the prom-client metrics generator
jest.mock('@/lib/observability/metrics', () => ({
  getMetrics: jest.fn().mockResolvedValue({
    jobMetrics: new Map([['job1', { count: 1, errors: 0, totalDurationMs: 100 }]]),
    dbMetrics: new Map([['table1:select', { count: 1, errors: 0, totalDurationMs: 50 }]]),
  }),
}))

jest.mock('@repo/supabase/server', () => ({
  createAdminClient: jest.fn().mockReturnValue({
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
}))

describe('GET /api/metrics/prometheus', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns 200 and metrics if no token is configured in environment', async () => {
    delete process.env.METRICS_SCRAPE_TOKEN

    const req = new NextRequest('http://localhost/api/metrics/prometheus')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')
    const text = await res.text()
    expect(text).toContain('arch_job_executions_total')
  })

  it('returns 401 if token is configured but not provided in request', async () => {
    process.env.METRICS_SCRAPE_TOKEN = 'secure-secret-token'

    const req = new NextRequest('http://localhost/api/metrics/prometheus')
    const res = await GET(req)

    expect(res.status).toBe(401)
    const text = await res.text()
    expect(text).toBe('Unauthorized')
  })

  it('returns 401 if token is configured but incorrect in query param', async () => {
    process.env.METRICS_SCRAPE_TOKEN = 'secure-secret-token'

    const req = new NextRequest('http://localhost/api/metrics/prometheus?token=wrong-token')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 200 if token is configured and correct in query param', async () => {
    process.env.METRICS_SCRAPE_TOKEN = 'secure-secret-token'

    const req = new NextRequest('http://localhost/api/metrics/prometheus?token=secure-secret-token')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('arch_job_executions_total')
  })

  it('returns 401 if token is configured but incorrect in Authorization header', async () => {
    process.env.METRICS_SCRAPE_TOKEN = 'secure-secret-token'

    const req = new NextRequest('http://localhost/api/metrics/prometheus', {
      headers: {
        Authorization: 'Bearer wrong-token',
      },
    })
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 200 if token is configured and correct in Authorization header', async () => {
    process.env.METRICS_SCRAPE_TOKEN = 'secure-secret-token'

    const req = new NextRequest('http://localhost/api/metrics/prometheus', {
      headers: {
        Authorization: 'Bearer secure-secret-token',
      },
    })
    const res = await GET(req)

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('arch_job_executions_total')
  })
})
