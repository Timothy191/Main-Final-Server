/**
 * Tests for the access-control department actions (getAccessControlMetrics).
 *
 * Verifies the auth-decoupled "use cache" pattern:
 * - Outer function (getAccessControlMetrics) enforces auth
 * - Inner _getCachedMetrics uses createAdminClient()
 */

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
  createAdminClient: jest.fn(),
}))
jest.mock('next/cache', () => ({
  cacheTag: jest.fn(),
  revalidatePath: jest.fn(),
}))
jest.mock('@repo/redis', () => ({
  cacheInvalidateTags: jest.fn(),
}))

import { createServerSupabaseClient, createAdminClient } from '@repo/supabase/server'
import { getAccessControlMetrics } from '../actions'

const mockCreateServerClient = createServerSupabaseClient as jest.MockedFunction<
  typeof createServerSupabaseClient
>
const mockCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'access_control', department_id: 'dept-abc' },
        error: null,
      }),
    }),
    rpc: jest.fn(),
    ...overrides,
  }
}

describe('getAccessControlMetrics()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws AuthError when user is not authenticated', async () => {
    const supabaseMock = makeSupabaseMock({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    })
    mockCreateServerClient.mockResolvedValue(supabaseMock as never)

    await expect(getAccessControlMetrics('dept-abc')).rejects.toThrow('Unauthorized')
  })

  it('throws ForbiddenError when user lacks required role', async () => {
    const supabaseMock = makeSupabaseMock()
    // Override the employee select to return 'production' role
    supabaseMock.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'production', department_id: 'dept-abc' },
        error: null,
      }),
    })
    mockCreateServerClient.mockResolvedValue(supabaseMock as never)

    await expect(getAccessControlMetrics('dept-abc')).rejects.toThrow('Forbidden')
  })

  it('returns metrics when auth passes and RPC succeeds', async () => {
    const serverSupabaseMock = makeSupabaseMock()
    mockCreateServerClient.mockResolvedValue(serverSupabaseMock as never)

    const adminMock = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          metrics: {
            active_qr_codes: 42,
            total_entities: 100,
            expiring_soon: 5,
            denied_today: 2,
            access_events_today: 120,
            expired_assigned: 3,
          },
        },
        error: null,
      }),
    }
    mockCreateAdminClient.mockReturnValue(adminMock as never)

    const result = await getAccessControlMetrics('dept-abc')

    expect(result.activeQrCodes).toBe(42)
    expect(result.entityCoverage).toBe(42) // (42/100)*100 = 42%
    expect(result.expiringSoon).toBe(5)
    expect(result.deniedToday).toBe(2)
    expect(result.accessEventsToday).toBe(120)
  })
})
