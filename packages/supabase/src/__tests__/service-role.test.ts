/**
 * @jest-environment node
 */

const mockCreateClient = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: any[]) => {
    mockCreateClient(...args)
    return { __type: 'service-client', args }
  },
}))

const OGP = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...OGP }
})

afterAll(() => {
  process.env = OGP
})

describe('createServiceRoleClient', () => {
  it('throws when SUPABASE_URL is missing', () => {
    delete process.env.SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.SUPABASE_SERVICE_KEY = 'test-key'

    const { createServiceRoleClient } = require('../service-role')
    expect(() => createServiceRoleClient()).toThrow(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables'
    )
  })

  it('throws when SUPABASE_SERVICE_KEY is missing', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    delete process.env.SUPABASE_SERVICE_KEY

    const { createServiceRoleClient } = require('../service-role')
    expect(() => createServiceRoleClient()).toThrow(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables'
    )
  })

  it('creates a client with autoRefreshToken and persistSession disabled', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key'

    const { createServiceRoleClient } = require('../service-role')
    const client = createServiceRoleClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-key',
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    )
    expect(client.__type).toBe('service-client')
  })

  it('falls back to NEXT_PUBLIC_SUPABASE_URL when SUPABASE_URL is missing', () => {
    delete process.env.SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pub-test.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'

    const { createServiceRoleClient } = require('../service-role')
    createServiceRoleClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://pub-test.supabase.co',
      expect.any(String),
      expect.any(Object)
    )
  })

  it('prefers SUPABASE_URL over NEXT_PUBLIC_SUPABASE_URL', () => {
    process.env.SUPABASE_URL = 'https://private.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://pub.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'test-key'

    const { createServiceRoleClient } = require('../service-role')
    createServiceRoleClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://private.supabase.co',
      expect.any(String),
      expect.any(Object)
    )
  })
})
