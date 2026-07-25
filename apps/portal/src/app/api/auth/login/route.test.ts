/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/api/rate-limit-middleware', () => ({
  withRateLimit: jest.fn(
    async (_req: NextRequest, handler: () => Promise<Response>) => await handler()
  ),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')

function makeJsonRequest(body: unknown, headers?: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 415 when Content-Type is not application/json', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'email=foo&password=bar',
    })

    const res = await POST(req)
    expect(res.status).toBe(415)
    const json = await res.json()
    expect(json.error).toMatch(/application\/json/)
  })

  it('returns 400 when email or password is missing', async () => {
    const req = makeJsonRequest({ email: 'a@b.co' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/required/i)
  })

  it('returns 401 with generic message on invalid credentials', async () => {
    const signInWithPassword = jest
      .fn()
      .mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    createServerSupabaseClient.mockResolvedValue({ auth: { signInWithPassword } })

    const req = makeJsonRequest({ email: 'a@b.co', password: 'wrong' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Invalid credentials')
  })

  it('returns 401 with rate-limit hint when Supabase reports rate limiting', async () => {
    const signInWithPassword = jest
      .fn()
      .mockResolvedValue({ error: { message: 'Email rate limit exceeded' } })
    createServerSupabaseClient.mockResolvedValue({ auth: { signInWithPassword } })

    const req = makeJsonRequest({ email: 'a@b.co', password: 'pw' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/too many attempts/i)
  })

  it('returns 200 with { success: true, redirectTo: "/hub" } on success', async () => {
    const signInWithPassword = jest.fn().mockResolvedValue({ error: null })
    createServerSupabaseClient.mockResolvedValue({ auth: { signInWithPassword } })

    const req = makeJsonRequest({ email: 'a@b.co', password: 'pw' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ success: true, redirectTo: '/hub' })
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'pw' })
  })

  it('returns 500 on unexpected server error', async () => {
    createServerSupabaseClient.mockRejectedValue(new Error('boom'))

    const req = makeJsonRequest({ email: 'a@b.co', password: 'pw' })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toMatch(/error occurred/i)
  })
})

describe('POST /api/auth/login — CSRF (production)', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV
  const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL

  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    })
    process.env.NEXT_PUBLIC_APP_URL = 'https://portal.example.com'
  })

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: ORIGINAL_ENV,
      configurable: true,
    })
    if (ORIGINAL_APP_URL === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL
    }
  })

  it('rejects request with no Origin or Referer header', async () => {
    const req = makeJsonRequest({ email: 'a@b.co', password: 'pw' })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects mismatched Origin header', async () => {
    const req = makeJsonRequest(
      { email: 'a@b.co', password: 'pw' },
      { Origin: 'https://evil.example.com' }
    )
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('accepts matching Origin header and reaches Supabase', async () => {
    const signInWithPassword = jest.fn().mockResolvedValue({ error: null })
    createServerSupabaseClient.mockResolvedValue({ auth: { signInWithPassword } })

    const req = makeJsonRequest(
      { email: 'a@b.co', password: 'pw' },
      { Origin: 'https://portal.example.com' }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(signInWithPassword).toHaveBeenCalled()
  })
})
