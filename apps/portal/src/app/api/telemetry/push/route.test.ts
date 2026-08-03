/**
 * @jest-environment node
 */

import { POST, clearTelemetryCache } from './route'

const TEST_API_SECRET = 'test-secret-for-jest'

jest.mock('@/lib/env', () => ({
  getEnv: () => ({ NEXT_PUBLIC_FUXA_URL: 'http://localhost:1881' }),
}))

jest.mock('@repo/redis', () => ({
  getRedisClient: jest.fn().mockRejectedValue(new Error('Redis disabled in tests')),
}))

describe('POST /api/telemetry/push', () => {
  let originalFetch: typeof global.fetch

  beforeAll(() => {
    originalFetch = global.fetch
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  beforeEach(() => {
    jest.clearAllMocks()
    clearTelemetryCache()
    process.env.INTERNAL_API_SECRET = TEST_API_SECRET
  })

  function createRequest(body: unknown) {
    return new Request('http://localhost/api/telemetry/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': TEST_API_SECRET,
      },
      body: JSON.stringify(body),
    })
  }

  it('rejects direct requests missing name or value with 400', async () => {
    const req = createRequest({ name: 'test-tag' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Request body validation failed')
  })

  it('successfully forwards direct single tag payload to FUXA', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    })
    global.fetch = mockFetch

    const req = createRequest({ name: 'machine_1_engine_rpm', value: 1200 })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.synced).toBe(true)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:1881/api/tag',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'machine_1_engine_rpm', value: 1200 }),
      })
    )
  })

  it('gracefully returns warning when FUXA returns an error status', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })
    global.fetch = mockFetch

    const req = createRequest({ name: 'machine_1_engine_rpm', value: 1200 })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.warning).toContain('FUXA SCADA server returned status 500')
    expect(json.synced).toBe(false)
  })

  it('gracefully returns warning when FUXA is unreachable', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Connection refused'))
    global.fetch = mockFetch

    const req = createRequest({ name: 'machine_1_engine_rpm', value: 1200 })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.warning).toBe('FUXA SCADA server is unreachable')
    expect(json.synced).toBe(false)
  })

  it('processes Supabase database webhook payloads and updates multiple tags', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    })
    global.fetch = mockFetch

    const webhookBody = {
      type: 'INSERT',
      table: 'machine_telemetry',
      schema: 'public',
      record: {
        id: 'telemetry-123',
        machine_id: 'machine-uuid-456',
        department_id: 'dept-789',
        engine_rpm: 1500,
        engine_temp: 92.4,
        hydraulic_pressure: 210.5,
        vibration_level: 0.12,
        fuel_level: 82.5,
        bit_depth: 14.2,
      },
      old_record: null,
    }

    const req = createRequest(webhookBody)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.webhook).toBe(true)
    expect(json.processed).toBe(6) // 6 metrics are non-null and mapped
    expect(json.results).toHaveLength(6)

    // Verify all 6 tags were posted
    expect(mockFetch).toHaveBeenCalledTimes(6)
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:1881/api/tag',
      expect.objectContaining({
        body: JSON.stringify({
          name: 'machine_machine-uuid-456_engine_rpm',
          value: 1500,
        }),
      })
    )
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:1881/api/tag',
      expect.objectContaining({
        body: JSON.stringify({
          name: 'machine_machine-uuid-456_engine_temp',
          value: 92.4,
        }),
      })
    )
  })

  it('skips sending duplicate tag values (delta diff caching)', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    })
    global.fetch = mockFetch

    // Send first request - should be a cache miss and call fetch
    const req1 = createRequest({ name: 'machine_1_engine_rpm', value: 1200 })
    const res1 = await POST(req1)
    expect(res1.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    mockFetch.mockClear()

    // Send duplicate second request - should be a cache hit and bypass fetch
    const req2 = createRequest({ name: 'machine_1_engine_rpm', value: 1200 })
    const res2 = await POST(req2)
    expect(res2.status).toBe(200)
    const json2 = await res2.json()
    expect(json2.success).toBe(true)
    expect(json2.synced).toBe(true)
    expect(mockFetch).not.toHaveBeenCalled() // fetch skipped!
  })
})
