/**
 * Auth integration tests — full flow through assertDeptRole.
 *
 * Unlike the unit tests (dept-auth-wrappers.test.ts), these tests do NOT mock
 * @/lib/dept-access. Instead, they mock only the external boundary
 * (@repo/supabase/server) and let the real assertDeptRole run.
 *
 * This validates the complete auth pipeline:
 *   public function → dept wrapper → assertDeptRole → Supabase query
 */

import { AuthError, ForbiddenError } from '@/lib/errors/error-classes'

/* ------------------------------------------------------------------ */
/*  Mock — only the external Supabase boundary                        */
/* ------------------------------------------------------------------ */

// Note: createAdminClient + mockRpc are NOT needed for current tests since all
// cached-function paths ('use cache') can't run in Jest. Include them here if
// you add tests for cached department functions in the future.
jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server') as {
  createServerSupabaseClient: jest.Mock
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeMockSupabase(options: {
  user?: { id: string; email?: string } | null
  employee?: { role: string; department_id: string } | null
}) {
  const {
    user = { id: 'test-user', email: 'admin@test.com' },
    employee = { role: 'admin', department_id: 'dept-1' },
  } = options

  const builderMethods = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: employee,
      error: employee ? null : { code: 'PGRST116', message: 'No rows' },
    }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  }

  const mock = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: user ?? null } }),
    },
    from: jest.fn().mockReturnValue(builderMethods),
  }

  return mock
}

beforeEach(() => {
  jest.clearAllMocks()
})

/* ------------------------------------------------------------------ */
/*  assertDeptRole integration tests                                   */
/* ------------------------------------------------------------------ */

describe('assertDeptRole (integration — real auth logic)', () => {
  describe('authentication', () => {
    it('throws AuthError when no user is authenticated', async () => {
      createServerSupabaseClient.mockResolvedValue(makeMockSupabase({ user: null }))

      const { assertDeptRole } = await import('../dept-access')

      await expect(assertDeptRole(['admin'], 'test-resource')).rejects.toThrow(AuthError)
      await expect(assertDeptRole(['admin'], 'test-resource')).rejects.toThrow('Unauthorized')
    })

    it('throws ForbiddenError when employee role is not in allowed list', async () => {
      createServerSupabaseClient.mockResolvedValue(
        makeMockSupabase({ employee: { role: 'viewer', department_id: 'dept-1' } })
      )

      const { assertDeptRole } = await import('../dept-access')

      await expect(assertDeptRole(['admin', 'supervisor'], 'safety')).rejects.toThrow(
        ForbiddenError
      )
      await expect(assertDeptRole(['admin', 'supervisor'], 'safety')).rejects.toThrow(
        'Forbidden: admin or supervisor role required'
      )
    })

    it('throws ForbiddenError when no employee record exists', async () => {
      createServerSupabaseClient.mockResolvedValue(makeMockSupabase({ employee: null }))

      const { assertDeptRole } = await import('../dept-access')

      await expect(assertDeptRole(['admin'], 'test')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('authorization', () => {
    it('returns supabase, user, and employee when role matches', async () => {
      const user = { id: 'user-123', email: 'admin@example.com' }
      const employee = { role: 'admin', department_id: 'dept-1' }
      const mockSupabase = makeMockSupabase({ user, employee })
      createServerSupabaseClient.mockResolvedValue(mockSupabase)

      const { assertDeptRole } = await import('../dept-access')

      const result = await assertDeptRole(['admin', 'supervisor'], 'satellite-monitoring')

      expect(result).toHaveProperty('supabase')
      expect(result.supabase).toBe(mockSupabase)
      expect(result.user).toEqual({ id: 'user-123', email: 'admin@example.com' })
      expect(result.employee).toEqual({ role: 'admin', department_id: 'dept-1' })
    })

    it('accepts any role in the allowed list', async () => {
      createServerSupabaseClient.mockResolvedValue(
        makeMockSupabase({ employee: { role: 'operator', department_id: 'dept-2' } })
      )

      const { assertDeptRole } = await import('../dept-access')

      const result = await assertDeptRole(['admin', 'operator', 'viewer'], 'test')
      expect(result.employee.role).toBe('operator')
    })

    it('rejects roles not in allowed list with descriptive error', async () => {
      createServerSupabaseClient.mockResolvedValue(
        makeMockSupabase({ employee: { role: 'guest', department_id: 'dept-3' } })
      )

      const { assertDeptRole } = await import('../dept-access')

      await expect(assertDeptRole(['admin', 'supervisor'], 'safety')).rejects.toThrow(
        'Forbidden: admin or supervisor role required'
      )
    })
  })
})

/* ------------------------------------------------------------------ */
/*  Department wrapper integration tests                               */
/* ------------------------------------------------------------------ */

describe('department auth wrappers (integration — real auth logic)', () => {
  it('assertSatelliteRole delegates to real assertDeptRole', async () => {
    createServerSupabaseClient.mockResolvedValue(
      makeMockSupabase({ employee: { role: 'satellite', department_id: 'dept-sat' } })
    )

    const { assertSatelliteRole } = await import('@/app/(departments)/satellite-monitoring/actions')

    const result = await assertSatelliteRole()
    expect(result.employee.role).toBe('satellite')
  })

  it('assertSatelliteRole rejects unauthorized roles', async () => {
    createServerSupabaseClient.mockResolvedValue(
      makeMockSupabase({ employee: { role: 'viewer', department_id: 'dept-sat' } })
    )

    const { assertSatelliteRole } = await import('@/app/(departments)/satellite-monitoring/actions')

    await expect(assertSatelliteRole()).rejects.toThrow(ForbiddenError)
    await expect(assertSatelliteRole()).rejects.toThrow(
      'Forbidden: admin or satellite or supervisor role required'
    )
  })

  it('assertAccessCardActionsRole accepts access_control role', async () => {
    createServerSupabaseClient.mockResolvedValue(
      makeMockSupabase({ employee: { role: 'access_control', department_id: 'dept-ac' } })
    )

    const { assertAccessCardActionsRole } =
      await import('@/app/(departments)/access-card-actions/actions')

    const result = await assertAccessCardActionsRole()
    expect(result.employee.role).toBe('access_control')
  })

  it('getAccessControlMetrics: throws ForbiddenError for unauthorized role', async () => {
    createServerSupabaseClient.mockResolvedValue(
      makeMockSupabase({ employee: { role: 'operator', department_id: 'dept-ac' } })
    )

    const { getAccessControlMetrics } = await import('@/app/(departments)/access-control/actions')

    await expect(getAccessControlMetrics('dept-ac')).rejects.toThrow(ForbiddenError)
  })

  it('getRecentAccessActivity: returns data when authorized (non-cached path)', async () => {
    // Configure auth mock: authenticated as admin
    createServerSupabaseClient.mockResolvedValue(
      makeMockSupabase({ employee: { role: 'admin', department_id: 'dept-ac' } })
    )

    const { getRecentAccessActivity } = await import('@/app/(departments)/access-control/actions')

    // The function is non-cached — it uses assertAccessControlRole then queries Supabase.
    // Since supabase.from().select().eq().order().limit() returns mock chain,
    // the function will get null data and return []
    const result = await getRecentAccessActivity('dept-ac')

    // Auth succeeded — verify the auth flow was triggered
    expect(createServerSupabaseClient).toHaveBeenCalled()

    // Data flow: empty array since mock chain returns null
    expect(Array.isArray(result)).toBe(true)
  })
})
