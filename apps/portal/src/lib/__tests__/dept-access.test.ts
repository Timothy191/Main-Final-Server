import { assertDeptRole, isDeptAllowedForRole, filterDepartmentsByRole } from '../dept-access'

// Mock Supabase server module (dynamically imported by assertDeptRole)
jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

// Mock error classes
jest.mock('@/lib/errors/error-classes', () => ({
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'AuthError'
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor(
      message: string,
      public context?: { resource?: string; action?: string }
    ) {
      super(message)
      this.name = 'ForbiddenError'
    }
  },
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')

/* ------------------------------------------------------------------ */
/*  assertDeptRole                                                     */
/* ------------------------------------------------------------------ */

describe('assertDeptRole', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws AuthError when no user is authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    }
    createServerSupabaseClient.mockResolvedValue(mockSupabase)

    await expect(assertDeptRole(['admin'], 'test-resource')).rejects.toThrow('Unauthorized')
  })

  it('throws ForbiddenError when employee role is not in allowed list', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockEmployee = { role: 'viewer', department_id: 'dept-1' }

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null }),
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mockSupabase)

    await expect(assertDeptRole(['admin'], 'test-resource')).rejects.toThrow(
      'Forbidden: admin role required'
    )
  })

  it('throws ForbiddenError when no employee record is found', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mockSupabase)

    await expect(assertDeptRole(['admin'], 'test-resource')).rejects.toThrow(
      'Forbidden: admin role required'
    )
  })

  it('returns context with supabase, user, and employee when authorized', async () => {
    const mockUser = { id: 'user-123', email: 'admin@example.com' }
    const mockEmployee = { role: 'admin', department_id: 'dept-1' }
    const mockSupabaseInstance = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null }),
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mockSupabaseInstance)

    const result = await assertDeptRole(['admin', 'supervisor'], 'satellite-monitoring')

    expect(result).toHaveProperty('supabase')
    expect(result.supabase).toBe(mockSupabaseInstance)
    expect(result.user).toEqual({ id: 'user-123', email: 'admin@example.com' })
    expect(result.employee).toEqual({ role: 'admin', department_id: 'dept-1' })
  })

  it('accepts any role in the allowed list', async () => {
    const mockUser = { id: 'user-456', email: 'op@example.com' }
    const mockEmployee = { role: 'operator', department_id: 'dept-2' }

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null }),
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mockSupabase)

    const result = await assertDeptRole(['admin', 'operator', 'viewer'], 'test')

    expect(result.employee.role).toBe('operator')
  })

  it('rejects roles not in the allowed list with descriptive message', async () => {
    const mockUser = { id: 'user-789', email: 'guest@example.com' }
    const mockEmployee = { role: 'guest', department_id: 'dept-3' }

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null }),
      }),
    }
    createServerSupabaseClient.mockResolvedValue(mockSupabase)

    await expect(assertDeptRole(['admin', 'supervisor'], 'safety')).rejects.toThrow(
      'Forbidden: admin or supervisor role required'
    )
  })
})

/* ------------------------------------------------------------------ */
/*  isDeptAllowedForRole                                               */
/* ------------------------------------------------------------------ */

describe('isDeptAllowedForRole', () => {
  it('returns true for departments without restrictions', () => {
    expect(isDeptAllowedForRole('drilling', 'any_role')).toBe(true)
    expect(isDeptAllowedForRole('production', 'operator')).toBe(true)
    expect(isDeptAllowedForRole('satellite-monitoring', 'guest')).toBe(true)
  })

  it('returns true for allowed roles on restricted departments', () => {
    expect(isDeptAllowedForRole('access-control', 'access_control')).toBe(true)
    expect(isDeptAllowedForRole('access-control', 'admin')).toBe(true)
    expect(isDeptAllowedForRole('control-room', 'control_room_operator')).toBe(true)
    expect(isDeptAllowedForRole('control-room', 'admin')).toBe(true)
  })

  it('returns false for disallowed roles on restricted departments', () => {
    expect(isDeptAllowedForRole('access-control', 'operator')).toBe(false)
    expect(isDeptAllowedForRole('access-control', 'viewer')).toBe(false)
    expect(isDeptAllowedForRole('control-room', 'operator')).toBe(false)
  })
})

/* ------------------------------------------------------------------ */
/*  filterDepartmentsByRole                                            */
/* ------------------------------------------------------------------ */

describe('filterDepartmentsByRole', () => {
  const allDepts = [
    { name: 'drilling' },
    { name: 'production' },
    { name: 'access-control' },
    { name: 'control-room' },
    { name: 'safety' },
  ]

  it('filters out restricted departments the user cannot access', () => {
    const result = filterDepartmentsByRole(allDepts, 'operator')
    const names = result.map((d) => d.name)
    expect(names).toContain('drilling')
    expect(names).toContain('production')
    expect(names).toContain('safety')
    expect(names).not.toContain('access-control')
    expect(names).not.toContain('control-room')
  })

  it('includes all departments for admin role', () => {
    const result = filterDepartmentsByRole(allDepts, 'admin')
    expect(result).toHaveLength(5)
  })

  it('includes access-control for access_control role', () => {
    const result = filterDepartmentsByRole(allDepts, 'access_control')
    const names = result.map((d) => d.name)
    expect(names).toContain('access-control')
    expect(names).not.toContain('control-room')
  })

  it('returns empty array when given empty input', () => {
    const result = filterDepartmentsByRole([], 'admin')
    expect(result).toEqual([])
  })

  it('handles departments with same name as restricted keys', () => {
    const depts = [{ name: 'admin' }]
    const result = filterDepartmentsByRole(depts, 'viewer')
    // 'admin' is in RESTRICTED_DEPT_ROLES with only ['admin'] allowed
    expect(result).toHaveLength(0)
  })
})
