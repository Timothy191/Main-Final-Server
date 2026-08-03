/**
 * Tests for @repo/supabase middleware.ts
 *
 * NOTE: jest.mock calls are hoisted to the top of the file, so all mock
 * factories must create everything inline without referencing external variables.
 * Access mocks via globalThis in tests.
 */

jest.mock('next/server', () => {
  const mockCookieGetAll = jest.fn().mockReturnValue([])
  const mockCookieSet = jest.fn()
  const mockResponseCookieSet = jest.fn()

  ;(globalThis as any).__mockCookieGetAll = mockCookieGetAll
  ;(globalThis as any).__mockCookieSet = mockCookieSet
  ;(globalThis as any).__mockResponseCookieSet = mockResponseCookieSet

  return {
    NextRequest: jest.fn().mockImplementation(() => ({
      cookies: {
        getAll: mockCookieGetAll,
        set: mockCookieSet,
      },
    })),
    NextResponse: {
      next: jest.fn().mockReturnValue({
        cookies: {
          set: mockResponseCookieSet,
        },
      }),
    },
  }
})

jest.mock('@supabase/ssr', () => {
  return {
    createServerClient: jest.fn().mockReturnValue({
      auth: { getUser: jest.fn() },
    }),
  }
})

import { createMiddlewareClient } from '../middleware'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  // Reset default mock returns
  const mockCookieGetAll = (globalThis as any).__mockCookieGetAll
  if (mockCookieGetAll) mockCookieGetAll.mockReturnValue([])
})

// ---------------------------------------------------------------------------
// createMiddlewareClient
// ---------------------------------------------------------------------------
describe('createMiddlewareClient', () => {
  it('should create a middleware client with response property', async () => {
    const { createServerClient } = jest.requireMock('@supabase/ssr')
    const { NextRequest } = jest.requireMock('next/server')

    const mockReq = new NextRequest()
    const result = await createMiddlewareClient(mockReq)

    expect(result).toHaveProperty('supabase')
    expect(result).toHaveProperty('response')

    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.any(Object),
      })
    )
  })

  it('should pass cookies from the request to Supabase', async () => {
    const mockCookieGetAll = (globalThis as any).__mockCookieGetAll
    mockCookieGetAll.mockReturnValue([{ name: 'sb-auth-token', value: 'token123' }])

    const { NextRequest } = jest.requireMock('next/server')
    const mockReq = new NextRequest()
    await createMiddlewareClient(mockReq)

    const { createServerClient } = jest.requireMock('@supabase/ssr')
    const cookieConfig = createServerClient.mock.calls[0][2].cookies

    const allCookies = cookieConfig.getAll()
    expect(allCookies).toEqual([{ name: 'sb-auth-token', value: 'token123' }])
  })

  it('should set cookies on both the request and response', async () => {
    const mockCookieSet = (globalThis as any).__mockCookieSet
    const mockResponseCookieSet = (globalThis as any).__mockResponseCookieSet

    const { NextRequest } = jest.requireMock('next/server')
    const mockReq = new NextRequest()
    await createMiddlewareClient(mockReq)

    const { createServerClient } = jest.requireMock('@supabase/ssr')
    const cookieConfig = createServerClient.mock.calls[0][2].cookies

    mockCookieSet.mockClear()
    mockResponseCookieSet.mockClear()

    cookieConfig.setAll([
      {
        name: 'sb-access-token',
        value: 'new-token',
        options: { path: '/' },
      },
    ])

    expect(mockCookieSet).toHaveBeenCalledWith('sb-access-token', 'new-token')
    expect(mockResponseCookieSet).toHaveBeenCalledWith(
      'sb-access-token',
      'new-token',
      expect.objectContaining({
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
    )
  })

  it('should set Secure=true in production, false otherwise', async () => {
    const mockResponseCookieSet = (globalThis as any).__mockResponseCookieSet
    const mockCookieGetAll = (globalThis as any).__mockCookieGetAll
    const originalNodeEnv = process.env.NODE_ENV

    // Test production
    process.env.NODE_ENV = 'production'
    jest.clearAllMocks()
    mockCookieGetAll.mockReturnValue([])

    const { NextRequest } = jest.requireMock('next/server')
    await createMiddlewareClient(new NextRequest())

    const { createServerClient } = jest.requireMock('@supabase/ssr')
    const cookieConfig = createServerClient.mock.calls[0][2].cookies
    cookieConfig.setAll([{ name: 't', value: 'v', options: {} }])

    expect(mockResponseCookieSet).toHaveBeenCalledWith(
      't',
      'v',
      expect.objectContaining({ secure: true })
    )

    // Test development
    process.env.NODE_ENV = 'development'
    jest.clearAllMocks()
    mockCookieGetAll.mockReturnValue([])
    mockResponseCookieSet.mockClear()

    await createMiddlewareClient(new NextRequest())

    const { createServerClient: createClient2 } = jest.requireMock('@supabase/ssr')
    const allCalls = createClient2.mock.calls
    const latestCall = allCalls[allCalls.length - 1]
    latestCall[2].cookies.setAll([{ name: 't', value: 'v', options: {} }])

    expect(mockResponseCookieSet).toHaveBeenCalledWith(
      't',
      'v',
      expect.objectContaining({ secure: false })
    )

    process.env.NODE_ENV = originalNodeEnv
  })

  it('should handle empty cookies gracefully', async () => {
    const mockCookieGetAll = (globalThis as any).__mockCookieGetAll
    mockCookieGetAll.mockReturnValue([])

    const { NextRequest } = jest.requireMock('next/server')
    const mockReq = new NextRequest()
    const result = await createMiddlewareClient(mockReq)

    expect(result).toBeDefined()
    expect(result.supabase).toBeDefined()
  })
})
