/**
 * @jest-environment node
 */
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')

function buildMock(
  overrides: {
    user?: unknown
    employee?: unknown
    webhooks?: unknown
    insertData?: unknown
    dbError?: unknown
  } = {}
) {
  const user = overrides.user !== undefined ? overrides.user : { id: 'user-1' }
  const employee =
    overrides.employee !== undefined
      ? overrides.employee
      : {
          department_id: '11111111-1111-4111-a111-111111111111',
          role: 'supervisor',
          accessible_departments: [],
        }

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
      return {
        select: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            or: jest.fn().mockResolvedValue({
              data: overrides.webhooks ?? [],
              error: overrides.dbError ?? null,
            }),
            // admin path (no .or())
            then: undefined,
          }),
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: overrides.insertData ?? {
                id: 'wh-1',
                url: 'https://example.com',
              },
              error: overrides.dbError ?? null,
            }),
          }),
        }),
      }
    }),
  }
  createServerSupabaseClient.mockResolvedValue(mock)
  return mock
}

// ---------------------------------------------------------------------------
// GET /api/webhooks
// ---------------------------------------------------------------------------

describe('GET /api/webhooks', () => {
  beforeEach(() => jest.clearAllMocks())

  const mockReq = new NextRequest('http://localhost/api/webhooks')

  it('returns 401 when not authenticated', async () => {
    buildMock({ user: null })
    const res = await GET(mockReq)
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Unauthorized')
  })

  it('returns 404 when employee not found', async () => {
    buildMock({ employee: null })
    const res = await GET(mockReq)
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Employee not found')
  })

  it('returns 200 with webhooks for non-admin (with .or filter)', async () => {
    const webhookList = [{ id: 'w1', url: 'https://example.com' }]
    buildMock({
      employee: {
        department_id: 'dept-1',
        role: 'supervisor',
        accessible_departments: [],
      },
      webhooks: webhookList,
    })
    const res = await GET(mockReq)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.webhooks).toEqual(webhookList)
  })

  it('returns 500 on db error', async () => {
    buildMock({
      employee: {
        department_id: 'dept-1',
        role: 'supervisor',
        accessible_departments: [],
      },
      webhooks: null,
      dbError: { message: 'DB failure' },
    })
    const res = await GET(mockReq)
    expect(res.status).toBe(500)
  })

  it('returns 200 for admin without department filter', async () => {
    // Admin path: buildMock with role=admin — the mock's .is() resolves directly (no .or())
    const webhookList = [{ id: 'w2', url: 'https://admin.com' }]

    // Override to make the is() call resolve directly for admin
    const adminEmployee = {
      department_id: 'dept-1',
      role: 'admin',
      accessible_departments: [],
    }
    const mock = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } }),
      },
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'employees') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: adminEmployee }),
              }),
            }),
          }
        }
        // Admin skips .or(), so the chain is .select().is()
        const isResult = Promise.resolve({ data: webhookList, error: null })
        return {
          select: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue(
              Object.assign(isResult, {
                or: jest.fn().mockResolvedValue({ data: webhookList, error: null }),
              })
            ),
          }),
        }
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mock)
    const res = await GET(mockReq)
    expect(res.status).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// POST /api/webhooks
// ---------------------------------------------------------------------------

describe('POST /api/webhooks', () => {
  beforeEach(() => jest.clearAllMocks())

  const DEFAULT_DEPT = '11111111-1111-4111-a111-111111111111'

  function makeRequest(body: unknown) {
    const defaultBody = {
      department_id: DEFAULT_DEPT,
    }
    const finalBody =
      body && typeof body === 'object' && !Array.isArray(body) ? { ...defaultBody, ...body } : body
    return new NextRequest('http://localhost/api/webhooks', {
      method: 'POST',
      body: JSON.stringify(finalBody),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('returns 401 when not authenticated', async () => {
    buildMock({ user: null })
    const req = makeRequest({
      url: 'https://example.com',
      event_types: ['daily_log.created'],
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when url is missing', async () => {
    buildMock()
    const req = makeRequest({ event_types: ['daily_log.created'] })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('invalid request body')
  })

  it('returns 400 when event_types is empty', async () => {
    buildMock()
    const req = makeRequest({ url: 'https://example.com', event_types: [] })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when employee not found', async () => {
    buildMock({ employee: null })
    const req = makeRequest({
      url: 'https://example.com',
      event_types: ['breakdown.created'],
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 403 when non-admin tries to create webhook for different department', async () => {
    buildMock({
      employee: {
        department_id: '11111111-1111-4111-a111-111111111111',
        role: 'supervisor',
        accessible_departments: [],
      },
    })
    const req = makeRequest({
      url: 'https://example.com',
      event_types: ['daily_log.created'],
      department_id: '22222222-2222-4222-a222-222222222222',
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 201 on successful creation', async () => {
    buildMock({
      employee: {
        department_id: '11111111-1111-4111-a111-111111111111',
        role: 'supervisor',
        accessible_departments: [],
      },
      insertData: {
        id: 'wh-new',
        url: 'https://example.com',
        event_types: ['breakdown.created'],
      },
    })
    const req = makeRequest({
      url: 'https://example.com',
      event_types: ['breakdown.created'],
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.webhook).toBeDefined()
  })

  it('returns 500 when insert fails', async () => {
    const employee = {
      department_id: '11111111-1111-4111-a111-111111111111',
      role: 'supervisor',
      accessible_departments: [],
    }
    const insertError = { message: 'Insert failed' }

    // Custom mock where insert returns an error
    const mock = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
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
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: insertError }),
            }),
          }),
        }
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mock)

    const req = makeRequest({
      url: 'https://example.com',
      event_types: ['breakdown.created'],
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Failed to create webhook')
  })
})
