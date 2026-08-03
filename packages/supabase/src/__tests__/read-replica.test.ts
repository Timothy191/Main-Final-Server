/**
 * @jest-environment node
 */

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn((url, anonKey, options) => ({
    __type: 'replica-client',
    url,
    anonKey,
    options,
  })),
}))

jest.mock('../server', () => ({
  instrumentedFetch: jest.fn(() => Promise.resolve(new Response())),
}))

const mockCookies = {
  getAll: jest.fn().mockReturnValue([{ name: 'test', value: 'value' }]),
  set: jest.fn(),
}

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue(mockCookies),
}))

const OGP = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...OGP }
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://primary.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  delete process.env.SUPABASE_READ_REPLICA_URL
})

afterAll(() => {
  process.env = OGP
})

describe('createReadReplicaClient', () => {
  it('uses SUPABASE_READ_REPLICA_URL when configured', async () => {
    process.env.SUPABASE_READ_REPLICA_URL = 'https://replica.supabase.co'

    const { createReadReplicaClient } = require('../read-replica')
    const client = await createReadReplicaClient()

    expect(client.url).toBe('https://replica.supabase.co')
  })

  it('falls back to NEXT_PUBLIC_SUPABASE_URL when replica URL is not set', async () => {
    const { createReadReplicaClient } = require('../read-replica')
    const client = await createReadReplicaClient()

    expect(client.url).toBe('https://primary.supabase.co')
  })

  it('passes the instrumentedFetch as the global fetch', async () => {
    const { createReadReplicaClient } = require('../read-replica')
    const client = await createReadReplicaClient()

    expect(client.options.global.fetch).toBeDefined()
  })

  it('uses provided cookieList when supplied', async () => {
    const cookieList = [
      { name: 'session', value: 'abc123' },
      { name: 'prefs', value: 'dark' },
    ]

    const { createReadReplicaClient } = require('../read-replica')
    const client = await createReadReplicaClient(cookieList)

    // cookies.getAll should return the provided list
    const result = client.options.cookies.getAll()
    expect(result).toEqual(cookieList)
  })

  it('does not call cookieStore.setAll when cookieList is provided', async () => {
    const { createReadReplicaClient } = require('../read-replica')
    const client = await createReadReplicaClient([])

    // Calling setAll should be a no-op
    client.options.cookies.setAll([{ name: 'x', value: 'y', options: {} }])

    expect(mockCookies.set).not.toHaveBeenCalled()
  })

  it('returns empty data from getAll when cookieList is [] and cookieStore has no cookies', async () => {
    const { createReadReplicaClient } = require('../read-replica')
    const client = await createReadReplicaClient([])
    const result = client.options.cookies.getAll()
    expect(result).toEqual([])
  })
})
