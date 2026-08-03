/**
 * Tests for @repo/supabase server.ts
 *
 * NOTE: jest.mock calls are hoisted to the top of the file, so all mock
 * factories must create everything inline without referencing external variables.
 * Access mocks via jest.requireMock in tests.
 */

jest.mock('@supabase/ssr', () => {
  const mockGetUser = jest.fn()
  const mockClient = {
    auth: { getUser: mockGetUser },
  }
  // Store for test access
  ;(globalThis as any).__mockGetUser = mockGetUser
  return {
    createServerClient: jest.fn().mockReturnValue(mockClient),
  }
})

jest.mock('next/headers', () => {
  const mockCookieStore = {
    getAll: jest.fn().mockReturnValue([{ name: 'test', value: 'cookie' }]),
    set: jest.fn(),
  }
  return {
    cookies: jest.fn().mockResolvedValue(mockCookieStore),
  }
})

jest.mock('@supabase/supabase-js', () => ({}))

import { instrumentedFetch, getUserSafely } from '../server'

beforeEach(() => {
  ;(globalThis as any).__recordDbQuery = undefined
  // Reset the mockGetUser function
  const mockGetUser = (globalThis as any).__mockGetUser
  if (mockGetUser) mockGetUser.mockReset()
  jest.clearAllMocks()
})

// ---------------------------------------------------------------------------
// instrumentedFetch
// ---------------------------------------------------------------------------
describe('instrumentedFetch', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('should return the fetch response', async () => {
    const mockResponse = { ok: true, status: 200 } as Response
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const result = await instrumentedFetch('http://example.com/api/v1/users')
    expect(result).toBe(mockResponse)
  })

  it('should record DB query timing when __recordDbQuery is defined', async () => {
    const recordDbQuery = jest.fn()
    ;(globalThis as any).__recordDbQuery = recordDbQuery
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    await instrumentedFetch('http://example.com/rest/v1/machines?select=*', {
      method: 'POST',
    })

    expect(recordDbQuery).toHaveBeenCalledWith('machines', 'POST', expect.any(Number), true)
  })

  it('should handle failed requests and report success=false', async () => {
    const recordDbQuery = jest.fn()
    ;(globalThis as any).__recordDbQuery = recordDbQuery
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await instrumentedFetch(new URL('http://example.com/rest/v1/employees'))

    expect(recordDbQuery).toHaveBeenCalledWith('employees', 'GET', expect.any(Number), false)
  })

  it('should handle URL input objects', async () => {
    const recordDbQuery = jest.fn()
    ;(globalThis as any).__recordDbQuery = recordDbQuery
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    await instrumentedFetch(new URL('http://example.com/rest/v1/data'))

    expect(recordDbQuery).toHaveBeenCalledWith('data', 'GET', expect.any(Number), true)
  })

  it('should extract table name correctly from URL path', async () => {
    const recordDbQuery = jest.fn()
    ;(globalThis as any).__recordDbQuery = recordDbQuery
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    await instrumentedFetch('http://example.com/rest/v1/rpc/get_dashboard?param=1')

    expect(recordDbQuery).toHaveBeenCalledWith('rpc', 'GET', expect.any(Number), true)
  })

  it("should report 'unknown' table when URL has no rest path", async () => {
    const recordDbQuery = jest.fn()
    ;(globalThis as any).__recordDbQuery = recordDbQuery
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    await instrumentedFetch('http://example.com/health')

    expect(recordDbQuery).toHaveBeenCalledWith('unknown', 'GET', expect.any(Number), true)
  })

  it('should re-throw when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    await expect(instrumentedFetch('http://example.com/rest/v1/test')).rejects.toThrow(
      'Network error'
    )
  })

  it('should record failure timing when fetch throws', async () => {
    const recordDbQuery = jest.fn()
    ;(globalThis as any).__recordDbQuery = recordDbQuery
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    await expect(instrumentedFetch('http://example.com/rest/v1/test')).rejects.toThrow()
    // The finally block runs even on error, so recordDbQuery gets called
    expect(recordDbQuery).toHaveBeenCalledWith('test', 'GET', expect.any(Number), false)
  })
})

// ---------------------------------------------------------------------------
// getUserSafely
// ---------------------------------------------------------------------------
describe('getUserSafely', () => {
  function getSupabaseClient() {
    const { createServerClient } = jest.requireMock('@supabase/ssr')
    return createServerClient()
  }

  function mockGetUser() {
    return (globalThis as any).__mockGetUser
  }

  it('should return the user when authenticated', async () => {
    const mockUser: any = {
      id: 'user-1',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
    }
    mockGetUser().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    const result = await getUserSafely(getSupabaseClient())
    expect(result).toEqual(mockUser)
  })

  it('should return null when user is not authenticated', async () => {
    mockGetUser().mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    })
    const result = await getUserSafely(getSupabaseClient())
    expect(result).toBeNull()
  })

  it('should return null when getUser throws a refresh token error', async () => {
    mockGetUser().mockRejectedValue(new Error('Invalid Refresh Token: Refresh Token Not Found'))
    const result = await getUserSafely(getSupabaseClient())
    expect(result).toBeNull()
  })

  it('should return null when getUser throws any error', async () => {
    mockGetUser().mockRejectedValue(new Error('Network error'))
    const result = await getUserSafely(getSupabaseClient())
    expect(result).toBeNull()
  })
})
