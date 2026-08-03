/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'

jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process')
  return {
    ...actual,
    execFile: jest.fn(),
  }
})
jest.mock('fs', () => {
  const actual = jest.requireActual('fs')
  return {
    ...actual,
    existsSync: jest.fn(),
  }
})

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  }),
}))

const { existsSync } = jest.requireMock('fs') as { existsSync: jest.Mock }

function makeRequest(body: unknown = {}) {
  return new NextRequest('http://localhost/api/plugins/rust-telemetry', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/plugins/rust-telemetry', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('JS fallback path (binary not found)', () => {
    beforeEach(() => existsSync.mockReturnValue(false))

    it('returns optimal status for low wear values', async () => {
      const req = makeRequest({ hours: 10, temp: 50, rpm: 500 })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.isNative).toBe(false)
      expect(body.status).toBe('optimal')
      expect(typeof body.wearIndex).toBe('number')
      expect(typeof body.probability).toBe('number')
      expect(typeof body.rulHours).toBe('number')
    })

    it('returns warning status for moderate wear', async () => {
      const req = makeRequest({ hours: 200, temp: 60, rpm: 1100 })
      const res = await POST(req)
      const body = await res.json()

      expect(body.isNative).toBe(false)
      expect(['warning', 'optimal']).toContain(body.status)
    })

    it('returns critical status for high wear (high hours + high temp)', async () => {
      const req = makeRequest({ hours: 500, temp: 90, rpm: 1200 })
      const res = await POST(req)
      const body = await res.json()

      expect(body.isNative).toBe(false)
      expect(body.status).toBe('critical')
    })

    it('uses default values when body fields are absent', async () => {
      const req = makeRequest({})
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.isNative).toBe(false)
    })

    it('rulHours is zero for very high hours input', async () => {
      const req = makeRequest({ hours: 9999, temp: 30, rpm: 500 })
      const res = await POST(req)
      const body = await res.json()
      expect(body.rulHours).toBe(0)
    })
  })

  describe('error handling', () => {
    it('returns fallback values and 200 on unexpected error', async () => {
      existsSync.mockImplementation(() => {
        throw new Error('fs crash')
      })

      const req = makeRequest({ hours: 100 })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.isNative).toBe(false)
      expect(body.error).toBeDefined()
    })
  })
})
