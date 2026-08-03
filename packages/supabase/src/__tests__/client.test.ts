/**
 * @jest-environment node
 */

const mockCreateBrowserClient = jest.fn().mockReturnValue({
  __type: 'browser-client',
})

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: (...args: any[]) => mockCreateBrowserClient(...args),
}))

const OGP = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...OGP }
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  // Set up a mock window for URL-rewriting tests
  ;(globalThis as any).window = undefined
})

afterAll(() => {
  process.env = OGP
})

function withWindow(hostname: string, fn: () => void) {
  const orig = (globalThis as any).window
  ;(globalThis as any).window = { location: { hostname } }
  try {
    fn()
  } finally {
    ;(globalThis as any).window = orig
  }
}

describe('createBrowserSupabaseClient', () => {
  it('creates a client with the provided env vars', () => {
    const { createBrowserSupabaseClient } = require('../client')
    const client = createBrowserSupabaseClient()

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        auth: { persistSession: true, storage: undefined },
      })
    )
    expect(client.__type).toBe('browser-client')
  })

  it('rewrites hostname to 127.0.0.1 when on localhost', () => {
    withWindow('localhost', () => {
      const { createBrowserSupabaseClient } = require('../client')
      createBrowserSupabaseClient()

      const callUrl = mockCreateBrowserClient.mock.calls[0][0]
      const parsed = new URL(callUrl)
      expect(parsed.hostname).toBe('127.0.0.1')
    })
  })

  it('rewrites hostname to the current hostname when different', () => {
    withWindow('mine.example.com', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
      const { createBrowserSupabaseClient } = require('../client')
      createBrowserSupabaseClient()

      const callUrl = mockCreateBrowserClient.mock.calls[0][0]
      const parsed = new URL(callUrl)
      expect(parsed.hostname).toBe('mine.example.com')
    })
  })

  it('preserves hostname when it already matches', () => {
    withWindow('project.supabase.co', () => {
      const { createBrowserSupabaseClient } = require('../client')
      createBrowserSupabaseClient()

      const callUrl = mockCreateBrowserClient.mock.calls[0][0]
      const parsed = new URL(callUrl)
      expect(parsed.hostname).toBe('project.supabase.co')
    })
  })

  it('does not crash if URL is invalid', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url'

    withWindow('localhost', () => {
      const { createBrowserSupabaseClient } = require('../client')
      expect(() => createBrowserSupabaseClient()).not.toThrow()
    })
  })

  it('works in non-browser environment (typeof window === undefined)', () => {
    ;(globalThis as any).window = undefined

    const { createBrowserSupabaseClient } = require('../client')
    const client = createBrowserSupabaseClient()

    // Should use the URL as-is
    const callUrl = mockCreateBrowserClient.mock.calls[0][0]
    expect(callUrl).toBe('https://project.supabase.co')
    expect(client.__type).toBe('browser-client')
  })
})
