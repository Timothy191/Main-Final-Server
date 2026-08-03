/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@repo/utils/inngest', () => {
  const mockSend = jest.fn().mockResolvedValue(undefined)
  return {
    inngest: { send: mockSend },
    syncPlaybackEvent: 'sync/playback',
    __mockSend: mockSend,
  }
})

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  }),
}))

const { __mockSend: mockSend } = jest.requireMock('@repo/utils/inngest')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/sync/playback', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('POST /api/sync/playback – validation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when idempotencyKey is missing', async () => {
    const req = makeRequest({
      actionType: 'create',
      payload: {},
      departmentId: 'dept-1',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Missing required fields')
  })

  it('returns 400 when actionType is missing', async () => {
    const req = makeRequest({
      idempotencyKey: 'key-1',
      payload: {},
      departmentId: 'dept-1',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when payload is missing', async () => {
    const req = makeRequest({
      idempotencyKey: 'key-1',
      actionType: 'create',
      departmentId: 'dept-1',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when departmentId is missing', async () => {
    const req = makeRequest({
      idempotencyKey: 'key-1',
      actionType: 'create',
      payload: {},
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Queuing
// ---------------------------------------------------------------------------

describe('POST /api/sync/playback – queuing', () => {
  beforeEach(() => jest.clearAllMocks())

  it('queues a create event via Inngest and returns 200', async () => {
    const req = makeRequest({
      idempotencyKey: 'idem-1',
      actionType: 'create',
      payload: {
        fleetId: 'EXC-01',
        machineType: 'Excavator',
        dateIn: '2026-05-17',
        reason: 'Hydraulic leak',
      },
      departmentId: 'dept-1',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.queued).toBe(true)
    expect(mockSend).toHaveBeenCalledWith({
      name: 'sync/playback',
      data: {
        idempotencyKey: 'idem-1',
        actionType: 'create',
        payload: expect.any(Object),
        departmentId: 'dept-1',
      },
    })
  })

  it('queues an update event via Inngest and returns 200', async () => {
    const req = makeRequest({
      idempotencyKey: 'idem-resolve',
      actionType: 'update',
      payload: { id: 'bd-1' },
      departmentId: 'dept-1',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.queued).toBe(true)
  })

  it('queues a create safety incident event via Inngest and returns 200', async () => {
    const req = makeRequest({
      idempotencyKey: 'si-1',
      actionType: 'create',
      payload: {
        incidentDate: '2026-05-17',
        shiftType: 'day',
        incidentType: 'near_miss',
        description: 'Slipped',
        location: 'Pit A',
      },
      departmentId: 'dept-1',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect((await res.json()).queued).toBe(true)
  })

  it('queues a create daily log event via Inngest and returns 200', async () => {
    const req = makeRequest({
      idempotencyKey: 'dl-1',
      actionType: 'create',
      payload: { logDate: '2026-05-17', shift: 'day', notes: 'All good' },
      departmentId: 'dept-1',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect((await res.json()).queued).toBe(true)
  })

  it('returns 500 when Inngest send throws', async () => {
    mockSend.mockRejectedValueOnce(new Error('Inngest down'))
    const req = makeRequest({
      idempotencyKey: 'idem-fail',
      actionType: 'create',
      payload: { fleetId: 'EXC-01' },
      departmentId: 'dept-1',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('Inngest down')
  })
})
