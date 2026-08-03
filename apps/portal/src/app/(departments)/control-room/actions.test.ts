/**
 * Tests for control-room server actions.
 */

jest.mock('@/lib/dept-access', () => ({
  assertDeptRole: jest.fn(),
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
  ValidationError: class ValidationError extends Error {
    constructor(
      m: string,
      public ctx?: Record<string, unknown>
    ) {
      super(m)
      this.name = 'ValidationError'
    }
  },
}))

jest.mock('@/lib/department-cache', () => ({
  DEPARTMENT_CACHE_TAGS: {
    CONTROL_ROOM: 'dept:control-room',
    TABLE_MACHINES: 'table:machines',
  },
  CACHE_TTL: {},
}))

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  cacheTag: jest.fn(),
  cacheLife: jest.fn(),
}))

const { assertDeptRole } = jest.requireMock('@/lib/dept-access')
const { revalidateTag } = jest.requireMock('next/cache')

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const single = jest.fn()

  const afterSelect = {
    single,
  }

  const afterUpdateEq = {
    select: jest.fn().mockReturnValue(afterSelect),
  }

  const afterUpdate = {
    eq: jest.fn().mockReturnValue(afterUpdateEq),
  }

  const afterSelectEq = {
    single,
  }

  const chainable = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue(afterSelectEq),
    }),
    eq: jest.fn().mockReturnThis(),
    single,
    update: jest.fn().mockReturnValue(afterUpdate),
    ...overrides,
  }

  return {
    from: jest.fn().mockReturnValue(chainable),
    auth: { getUser: jest.fn() },
  }
}

const baseRow = {
  department_id: 'dept-1',
  total_loads: 10,
  hour_05: 2,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('adjustHourlyLoad', () => {
  it('increments the requested hour and total_loads', async () => {
    const supabase = createMockSupabase()
    supabase
      .from()
      .single.mockResolvedValueOnce({ data: baseRow, error: null })
      .mockResolvedValueOnce({ data: { total_loads: 11, hour_05: 3 }, error: null })

    assertDeptRole.mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    const result = await adjustHourlyLoad({
      id: '11111111-1111-1111-1111-111111111111',
      hourColumn: 'hour_05',
      delta: 1,
    })

    expect(result).toEqual({ success: true, newValue: 3, totalLoads: 11 })
    expect(revalidateTag).toHaveBeenCalledWith('dept:control-room', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('table:machines', 'max')
  })

  it('decrements the requested hour and total_loads', async () => {
    const supabase = createMockSupabase()
    supabase
      .from()
      .single.mockResolvedValueOnce({ data: baseRow, error: null })
      .mockResolvedValueOnce({ data: { total_loads: 9, hour_05: 1 }, error: null })

    assertDeptRole.mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    const result = await adjustHourlyLoad({
      id: '11111111-1111-1111-1111-111111111111',
      hourColumn: 'hour_05',
      delta: -1,
    })

    expect(result).toEqual({ success: true, newValue: 1, totalLoads: 9 })
  })

  it('rejects decrementing below zero', async () => {
    const supabase = createMockSupabase()
    supabase.from().single.mockResolvedValueOnce({
      data: { ...baseRow, hour_05: 0 },
      error: null,
    })

    assertDeptRole.mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    await expect(
      adjustHourlyLoad({
        id: '11111111-1111-1111-1111-111111111111',
        hourColumn: 'hour_05',
        delta: -1,
      })
    ).rejects.toThrow('Cannot decrement hourly load below zero')
  })

  it('throws ValidationError for invalid payload', async () => {
    assertDeptRole.mockResolvedValue({
      supabase: createMockSupabase(),
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    await expect(
      adjustHourlyLoad({
        id: 'not-a-uuid',
        hourColumn: 'hour_13',
        delta: 2,
      })
    ).rejects.toThrow('Invalid hourly load adjustment payload')
  })

  it('throws DatabaseError when record is not found', async () => {
    const supabase = createMockSupabase()
    supabase.from().single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    assertDeptRole.mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    await expect(
      adjustHourlyLoad({
        id: '11111111-1111-1111-1111-111111111111',
        hourColumn: 'hour_05',
        delta: 1,
      })
    ).rejects.toThrow('Hourly load record not found')
  })
})
