/**
 * @jest-environment node
 */
import { GET } from './route'
import { NextRequest } from 'next/server'

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')

function buildMock(
  overrides: {
    user?: unknown
    employee?: unknown
    existingWebhook?: unknown
    logs?: unknown
    logsError?: unknown
  } = {}
) {
  const user = overrides.user !== undefined ? overrides.user : { id: 'user-1' }
  const employee =
    overrides.employee !== undefined
      ? overrides.employee
      : { department_id: 'dept-1', role: 'admin', accessible_departments: [] }
  const existingWebhook =
    overrides.existingWebhook !== undefined
      ? overrides.existingWebhook
      : { id: 'wh-1', department_id: 'dept-1' }

  const mock = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'employees') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: employee }),
            }),
          }),
        }
      }
      if (table === 'webhook_endpoints') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: existingWebhook }),
            }),
          }),
        }
      }
      // webhook_delivery_logs
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: overrides.logs ?? [],
                error: overrides.logsError ?? null,
              }),
            }),
          }),
        }),
      }
    }),
  }
  createServerSupabaseClient.mockResolvedValue(mock)
  return mock
}

const params = Promise.resolve({ id: 'wh-1' })

describe('GET /api/webhooks/[id]/logs', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    buildMock({ user: null })
    const res = await GET(new NextRequest('http://localhost'), { params })
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Unauthorized')
  })

  it('returns 404 when employee not found', async () => {
    buildMock({ employee: null })
    const res = await GET(new NextRequest('http://localhost'), { params })
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Employee not found')
  })

  it('returns 404 when webhook not found', async () => {
    buildMock({ existingWebhook: null })
    const res = await GET(new NextRequest('http://localhost'), { params })
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Webhook not found')
  })

  it('returns 403 when non-admin tries to view logs from different dept', async () => {
    buildMock({
      employee: {
        department_id: 'dept-1',
        role: 'supervisor',
        accessible_departments: [],
      },
      existingWebhook: { id: 'wh-1', department_id: 'dept-OTHER' },
    })
    const res = await GET(new NextRequest('http://localhost'), { params })
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe('Forbidden')
  })

  it('returns 500 when logs query fails', async () => {
    buildMock({ logsError: { message: 'Query failed' } })
    const res = await GET(new NextRequest('http://localhost'), { params })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Database query failed')
  })

  it('returns logs array on success for admin', async () => {
    buildMock({ logs: [{ id: 'log-1', status: 200 }] })
    const res = await GET(new NextRequest('http://localhost'), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.logs)).toBe(true)
    expect(body.logs).toHaveLength(1)
  })

  it("allows supervisor to view logs for their own dept's webhook", async () => {
    buildMock({
      employee: {
        department_id: 'dept-1',
        role: 'supervisor',
        accessible_departments: [],
      },
      existingWebhook: { id: 'wh-1', department_id: 'dept-1' },
      logs: [],
    })
    const res = await GET(new NextRequest('http://localhost'), { params })
    expect(res.status).toBe(200)
  })
})
