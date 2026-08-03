/**
 * @jest-environment node
 */
import { PUT, DELETE } from './route'
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
    existingWebhook?: unknown
    updateError?: unknown
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
      : { id: 'wh-1', url: 'https://example.com', department_id: 'dept-1' }

  let callCount = 0

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
      // webhook_endpoints
      callCount++
      if (callCount === 1) {
        // First call: GET existing webhook
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: existingWebhook }),
            }),
          }),
        }
      }
      // Second call: UPDATE/DELETE
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: existingWebhook,
                error: overrides.updateError ?? null,
              }),
            }),
            // for DELETE (no .select())
            then: jest.fn().mockResolvedValue({ error: overrides.updateError ?? null }),
          }),
        }),
      }
    }),
  }
  createServerSupabaseClient.mockResolvedValue(mock)
  return mock
}

function makeRequest(body: unknown = {}) {
  return new NextRequest('http://localhost/api/webhooks/wh-1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// PUT /api/webhooks/[id]
// ---------------------------------------------------------------------------

describe('PUT /api/webhooks/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  const params = Promise.resolve({ id: 'wh-1' })

  it('returns 401 when not authenticated', async () => {
    buildMock({ user: null })
    const res = await PUT(makeRequest({ url: 'https://new.com' }), { params })
    expect(res.status).toBe(401)
  })

  it('returns 404 when employee not found', async () => {
    buildMock({ employee: null })
    const res = await PUT(makeRequest({ url: 'https://new.com' }), { params })
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Employee not found')
  })

  it('returns 404 when webhook not found', async () => {
    buildMock({ existingWebhook: null })
    const res = await PUT(makeRequest({ url: 'https://new.com' }), { params })
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Webhook not found')
  })

  it('returns 403 when non-admin tries to update webhook from different dept', async () => {
    buildMock({
      employee: {
        department_id: 'dept-1',
        role: 'supervisor',
        accessible_departments: [],
      },
      existingWebhook: {
        id: 'wh-1',
        url: 'https://example.com',
        department_id: 'dept-OTHER',
      },
    })
    const res = await PUT(makeRequest({ url: 'https://new.com' }), { params })
    expect(res.status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// DELETE /api/webhooks/[id]
// ---------------------------------------------------------------------------

describe('DELETE /api/webhooks/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  const params = Promise.resolve({ id: 'wh-1' })

  function makeDeleteRequest() {
    return new NextRequest('http://localhost/api/webhooks/wh-1', {
      method: 'DELETE',
    })
  }

  it('returns 401 when not authenticated', async () => {
    buildMock({ user: null })
    const res = await DELETE(makeDeleteRequest(), { params })
    expect(res.status).toBe(401)
  })

  it('returns 404 when employee not found', async () => {
    buildMock({ employee: null })
    const res = await DELETE(makeDeleteRequest(), { params })
    expect(res.status).toBe(404)
  })

  it('returns 404 when webhook not found', async () => {
    buildMock({ existingWebhook: null })
    const res = await DELETE(makeDeleteRequest(), { params })
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('Webhook not found')
  })

  it('returns 403 when non-admin tries to delete webhook from different dept', async () => {
    buildMock({
      employee: {
        department_id: 'dept-1',
        role: 'supervisor',
        accessible_departments: [],
      },
      existingWebhook: {
        id: 'wh-1',
        url: 'https://example.com',
        department_id: 'dept-OTHER',
      },
    })
    const res = await DELETE(makeDeleteRequest(), { params })
    expect(res.status).toBe(403)
  })

  it('returns 200 on successful soft delete', async () => {
    const employee = {
      department_id: 'dept-1',
      role: 'admin',
      accessible_departments: [],
    }
    const existingWebhook = {
      id: 'wh-1',
      url: 'https://example.com',
      department_id: 'dept-1',
    }

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
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: existingWebhook }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mock)

    const res = await DELETE(makeDeleteRequest(), { params })
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })

  it('returns 500 when soft delete fails', async () => {
    const employee = {
      department_id: 'dept-1',
      role: 'admin',
      accessible_departments: [],
    }
    const existingWebhook = {
      id: 'wh-1',
      url: 'https://example.com',
      department_id: 'dept-1',
    }
    const deleteError = { message: 'Delete failed' }

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
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: existingWebhook }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: deleteError }),
          }),
        }
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mock)

    const res = await DELETE(makeDeleteRequest(), { params })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Failed to delete webhook')
  })
})

// ---------------------------------------------------------------------------
// PUT success and error paths
// ---------------------------------------------------------------------------

describe('PUT /api/webhooks/[id] – success paths', () => {
  beforeEach(() => jest.clearAllMocks())

  const params = Promise.resolve({ id: 'wh-1' })

  it('returns 200 on successful update', async () => {
    const employee = {
      department_id: 'dept-1',
      role: 'admin',
      accessible_departments: [],
    }
    const existingWebhook = {
      id: 'wh-1',
      url: 'https://old.com',
      department_id: 'dept-1',
    }
    const updatedWebhook = {
      id: 'wh-1',
      url: 'https://new.com',
      department_id: 'dept-1',
    }

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
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: existingWebhook }),
            }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: updatedWebhook, error: null }),
              }),
            }),
          }),
        }
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mock)

    const req = new NextRequest('http://localhost/api/webhooks/wh-1', {
      method: 'PUT',
      body: JSON.stringify({ url: 'https://new.com' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.webhook).toBeDefined()
  })
})
