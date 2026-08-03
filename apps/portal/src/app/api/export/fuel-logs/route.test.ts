/**
 * @jest-environment node
 */
import { GET } from './route'
import { NextRequest } from 'next/server'

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')

describe('GET /api/export/fuel-logs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 if unauthenticated', async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    })

    const req = new NextRequest('http://localhost/api/export/fuel-logs')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns JSON data on successful query', async () => {
    const mockData = [
      {
        id: 'log-1',
        log_date: '2026-06-01',
        shift: 'day',
        department_id: 'dept-1',
        fuel_logs: [
          {
            id: 'fl-1',
            diesel_litres: 120.5,
            machine_id: 'machine-1',
            machines: {
              name: 'Excavator 01',
              machine_type: 'excavator',
            },
          },
        ],
      },
    ]

    const mockQuery = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockImplementation(() => Promise.resolve({ data: mockData, error: null })),
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      ...mockQuery,
    } as any)

    const req = new NextRequest(
      'http://localhost/api/export/fuel-logs?from=2026-06-01&to=2026-06-02'
    )
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].machine_name).toBe('Excavator 01')
    expect(body.data[0].diesel_litres).toBe('120.50')
  })

  it('returns CSV formatted data when Accept header is text/csv', async () => {
    const mockData = [
      {
        id: 'log-1',
        log_date: '2026-06-01',
        shift: 'day',
        department_id: 'dept-1',
        fuel_logs: [
          {
            id: 'fl-1',
            diesel_litres: 120.5,
            machine_id: 'machine-1',
            machines: {
              name: 'Excavator 01',
              machine_type: 'excavator',
            },
          },
        ],
      },
    ]

    const mockQuery = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockImplementation(() => Promise.resolve({ data: mockData, error: null })),
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      ...mockQuery,
    } as any)

    const req = new NextRequest('http://localhost/api/export/fuel-logs', {
      headers: {
        accept: 'text/csv',
      },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/csv')

    const text = await res.text()
    expect(text).toContain(
      'id,log_date,shift,department_id,machine_id,machine_name,machine_type,diesel_litres'
    )
    expect(text).toContain('Excavator 01')
    expect(text).toContain('120.50')
  })
})
