/**
 * @jest-environment node
 */
import { POST, GET } from './route'
import { NextRequest } from 'next/server'

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('signs out and returns success response', async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null })
    createServerSupabaseClient.mockResolvedValue({ auth: { signOut } })

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.redirectUrl).toBe('/login')
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('returns 500 status on sign out error', async () => {
    createServerSupabaseClient.mockRejectedValue(new Error('Supabase error'))

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error.code).toBe('INTERNAL_ERROR')
    expect(json.error.message).toBe('An error occurred during logout')
  })
})

describe('GET /api/auth/logout', () => {
  it('signs out and redirects to /login', async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null })
    createServerSupabaseClient.mockResolvedValue({ auth: { signOut } })

    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'GET',
    })

    const res = await GET(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login')
  })
})
