/**
 * Tests for department auth wrapper functions.
 *
 * Each department's actions.ts defines a 1-line wrapper around assertDeptRole
 * with department-specific allowed roles. Some wrappers are exported, others
 * are private and only called by public server actions.
 *
 * We mock assertDeptRole (already tested extensively in dept-access.test.ts)
 * and verify each wrapper passes the correct arguments.
 */

/* ------------------------------------------------------------------ */
/*  Mocks                                                             */
/* ------------------------------------------------------------------ */

jest.mock('@/lib/dept-access', () => ({
  assertDeptRole: jest.fn(),
  isDeptAllowedForRole: jest.fn().mockReturnValue(true),
  filterDepartmentsByRole: jest.fn().mockImplementation((depts) => [...depts]),
}))

jest.mock('@/lib/errors/error-classes', () => ({
  AuthError: class AuthError extends Error {
    constructor(m: string) {
      super(m)
      this.name = 'AuthError'
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor(
      m: string,
      public ctx?: Record<string, unknown>
    ) {
      super(m)
      this.name = 'ForbiddenError'
    }
  },
  DatabaseError: class DatabaseError extends Error {
    constructor(
      m: string,
      public ctx?: Record<string, unknown>
    ) {
      super(m)
      this.name = 'DatabaseError'
    }
  },
}))

jest.mock('@/lib/department-cache', () => ({
  DEPARTMENT_CACHE_TAGS: {},
  CACHE_TTL: {},
}))

const { assertDeptRole } = jest.requireMock('@/lib/dept-access')

/* ------------------------------------------------------------------ */
/*  Shared mock setup                                                 */
/* ------------------------------------------------------------------ */

const mockResult = {
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('no db')),
      maybeSingle: jest.fn().mockRejectedValue(new Error('no db')),
      rpc: jest.fn().mockRejectedValue(new Error('no db')),
    }),
    auth: { getUser: jest.fn() },
    storage: {
      from: jest.fn().mockReturnValue({ createSignedUrl: jest.fn() }),
    },
    rpc: jest.fn().mockRejectedValue(new Error('no db')),
  } as any,
  user: { id: 'test-user', email: 'test@example.com' },
  employee: { role: 'admin', department_id: 'dept-1' },
}

beforeEach(() => {
  jest.clearAllMocks()
  assertDeptRole.mockResolvedValue(mockResult)
})

/* ------------------------------------------------------------------ */
/*  Exported Wrappers                                                  */
/* ------------------------------------------------------------------ */

describe('dept auth wrappers (exported)', () => {
  describe('assertSatelliteRole', () => {
    it('calls assertDeptRole with satellite roles and resource', async () => {
      const { assertSatelliteRole } =
        await import('@/app/(departments)/satellite-monitoring/actions')
      await assertSatelliteRole()
      expect(assertDeptRole).toHaveBeenCalledWith(
        ['admin', 'satellite', 'supervisor'],
        'satellite-monitoring'
      )
    })

    it('returns the result from assertDeptRole', async () => {
      const { assertSatelliteRole } =
        await import('@/app/(departments)/satellite-monitoring/actions')
      const result = await assertSatelliteRole()
      expect(result).toBe(mockResult)
    })
  })

  describe('assertAccessCardActionsRole (access-card-actions)', () => {
    it('calls assertDeptRole with access-control roles and resource', async () => {
      const { assertAccessCardActionsRole } =
        await import('@/app/(departments)/access-card-actions/actions')
      await assertAccessCardActionsRole()
      expect(assertDeptRole).toHaveBeenCalledWith(
        ['admin', 'access_control'],
        'access_card_actions'
      )
    })
  })
})

/* ------------------------------------------------------------------ */
/*  Private Wrappers (tested through public functions)                */
/* ------------------------------------------------------------------ */

describe('dept auth wrappers (private — tested through public API)', () => {
  describe('safety — assertSafetyRole', () => {
    it('calls assertDeptRole with safety roles', async () => {
      const mod = await import('@/app/(departments)/safety/actions')
      try {
        await mod.getSafetyMetrics('dept-1')
      } catch {
        // expected — mock supabase has no real DB
      }
      expect(assertDeptRole).toHaveBeenCalledWith(['admin', 'safety', 'supervisor'], 'safety')
    })
  })

  describe('production — assertProductionRole', () => {
    it('calls assertDeptRole with production roles', async () => {
      const mod = await import('@/app/(departments)/production/actions')
      try {
        await mod.getProductionMetrics('dept-1')
      } catch {
        // expected
      }
      expect(assertDeptRole).toHaveBeenCalledWith(
        ['admin', 'production', 'supervisor'],
        'production'
      )
    })
  })

  describe('control-room — assertControlRoomRole', () => {
    it('calls assertDeptRole with control-room roles', async () => {
      const mod = await import('@/app/(departments)/control-room/actions')
      try {
        await mod.getControlRoomMetrics('dept-1')
      } catch {
        // expected
      }
      expect(assertDeptRole).toHaveBeenCalledWith(
        ['admin', 'control_room', 'supervisor'],
        'control-room'
      )
    })
  })

  describe('access-control — assertAccessControlRole', () => {
    it('calls assertDeptRole with access-control roles', async () => {
      const mod = await import('@/app/(departments)/access-control/actions')
      try {
        await mod.getAccessControlMetrics('dept-1')
      } catch {
        // expected
      }
      expect(assertDeptRole).toHaveBeenCalledWith(['admin', 'access_control'], 'access_control')
    })
  })

  describe('card-actions — assertAccessCardActionsRole (card-actions)', () => {
    it('calls assertDeptRole with card-actions roles', async () => {
      const mod = await import('@/app/(departments)/access-card-actions/card-actions/actions')
      try {
        await mod.searchPersonnel('test')
      } catch {
        // expected
      }
      expect(assertDeptRole).toHaveBeenCalledWith(['admin', 'access_control'], 'card_actions')
    })
  })
})
