/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock dependencies
jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/api/api-guard', () => ({
  runApiGuards: jest.fn(),
}))

jest.mock('@repo/contract', () => ({
  syncResultSchema: {
    parse: (data: unknown) => data,
  },
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')
const { runApiGuards: _runApiGuards } = jest.requireMock('@/lib/api/api-guard')

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/sync/sharepoint-employees', {
    method: 'POST',
  })
}

describe('POST /api/sync/sharepoint-employees', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('returns 401 when no user session', async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    })

    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/unauthorized/i)
  })

  it('returns 403 when user is not admin', async () => {
    const mockUser = { id: 'user-123' }
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { role: 'operator' },
                error: null,
              }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest())
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toMatch(/admin role required/)
  })

  it('returns 500 when Supabase config is missing', async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const mockUser = { id: 'admin-123' }
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { role: 'admin' },
                error: null,
              }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toMatch(/configuration not available/)

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
  })

  it('returns 200 with sync result on success', async () => {
    const mockUser = { id: 'admin-123' }
    const mockSyncResult = {
      success: true,
      total_users: 5,
      upserted: [{ upn: 'test@example.com', status: 'upserted' }],
      errors: [],
      error_count: 0,
    }

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSyncResult),
    }) as jest.Mock

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { role: 'admin' },
                error: null,
              }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.synced).toEqual(mockSyncResult)
  })

  it('returns 500 when edge function call fails', async () => {
    const mockUser = { id: 'admin-123' }

    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { role: 'admin' },
                error: null,
              }),
          }),
        }),
      }),
    })

    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toMatch(/Failed to trigger sync/)
  })
})
