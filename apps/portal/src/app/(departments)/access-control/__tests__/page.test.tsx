import { getAccessControlMetrics } from '../actions'
import { DatabaseError } from '@/lib/errors/error-classes'

// Mock next/cache for cacheTag/cacheLife used in cached server actions
jest.mock('next/cache', () => ({
  cacheTag: jest.fn(),
  cacheLife: jest.fn(),
  revalidatePath: jest.fn(),
}))

// Mock Supabase — both admin client (for RPC queries) and server client (for auth)
const mockRpc = jest.fn()

const buildAuthMock = (overrides: Record<string, unknown> = {}) => ({
  auth: {
    getUser: jest
      .fn()
      .mockResolvedValue({ data: { user: { id: 'test-user', email: 'admin@test.com' } } }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { role: 'admin', department_id: 'dept-1' },
      error: null,
    }),
  }),
  rpc: mockRpc,
  ...overrides,
})

jest.mock('@repo/supabase/server', () => ({
  createAdminClient: jest.fn(() => buildAuthMock()),
  createServerSupabaseClient: jest.fn(() => Promise.resolve(buildAuthMock())),
}))

describe('Access Control Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns formatted metrics when RPC succeeds', async () => {
    mockRpc.mockResolvedValue({
      data: {
        metrics: {
          active_qr_codes: 42,
          expiring_soon: 7,
          denied_today: 3,
          access_events_today: 156,
          expired_assigned: 2,
          total_entities: 200,
        },
      },
      error: null,
    })

    const result = await getAccessControlMetrics('dept-123')

    expect(result).toEqual({
      activeQrCodes: 42,
      expiringSoon: 7,
      deniedToday: 3,
      accessEventsToday: 156,
      expiredAssigned: 2,
      entityCoverage: 21,
    })

    expect(mockRpc).toHaveBeenCalledWith('get_access_control_metrics_jsonb', {
      p_department_id: 'dept-123',
    })
  })

  it('defaults to zeros when RPC returns no data', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: null,
    })

    const result = await getAccessControlMetrics('dept-456')

    expect(result).toEqual({
      activeQrCodes: 0,
      expiringSoon: 0,
      deniedToday: 0,
      accessEventsToday: 0,
      expiredAssigned: 0,
      entityCoverage: 0,
    })
  })

  it('calculates entityCoverage percentage correctly', async () => {
    mockRpc.mockResolvedValue({
      data: {
        metrics: {
          active_qr_codes: 50,
          total_entities: 200,
        },
      },
      error: null,
    })

    const result = await getAccessControlMetrics('dept-789')

    expect(result.activeQrCodes).toBe(50)
    expect(result.entityCoverage).toBe(25)
  })

  it('throws DatabaseError when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC failure' },
    })

    await expect(getAccessControlMetrics('dept-999')).rejects.toThrow(DatabaseError)
    await expect(getAccessControlMetrics('dept-999')).rejects.toThrow(
      'Failed to load access control metrics'
    )
  })

  it('handles missing metrics key gracefully', async () => {
    mockRpc.mockResolvedValue({
      data: {},
      error: null,
    })

    const result = await getAccessControlMetrics('dept-xyz')

    expect(result).toEqual({
      activeQrCodes: 0,
      expiringSoon: 0,
      deniedToday: 0,
      accessEventsToday: 0,
      expiredAssigned: 0,
      entityCoverage: 0,
    })
  })
})
