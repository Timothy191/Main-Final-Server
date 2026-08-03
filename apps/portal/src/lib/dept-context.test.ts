import { getDepartmentContext, requireDepartment } from './dept-context'

jest.mock('@repo/redis/cache', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')
const { notFound } = jest.requireMock('next/navigation')

describe('getDepartmentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns context for a valid department', async () => {
    createServerSupabaseClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'dept-uuid-123' },
            }),
          }),
        }),
      }),
    })

    const result = await getDepartmentContext({ department: 'safety' })

    expect(result.dept.name).toBe('safety')
    expect(result.deptId).toBe('dept-uuid-123')
    expect(result.supabase).toBeDefined()
    expect(result.today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('calls notFound for an invalid department slug', async () => {
    await expect(getDepartmentContext({ department: 'nonexistent-dept' })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )

    expect(notFound).toHaveBeenCalledTimes(1)
  })

  it('calls notFound when department row is missing in DB', async () => {
    createServerSupabaseClient.mockResolvedValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
            }),
          }),
        }),
      }),
    })

    await expect(getDepartmentContext({ department: 'drilling' })).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalledTimes(1)
  })
})

describe('requireDepartment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does nothing when department is allowed', () => {
    expect(() => requireDepartment('control-room', 'control-room')).not.toThrow()
  })

  it('calls notFound when department is not allowed', () => {
    expect(() => requireDepartment('safety', 'control-room')).toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(1)
  })

  it('allows department when in array of allowed departments', () => {
    expect(() => requireDepartment('safety', ['control-room', 'safety'])).not.toThrow()
  })

  it('calls notFound when department is not in allowed array', () => {
    expect(() => requireDepartment('drilling', ['control-room', 'safety'])).toThrow(
      'NEXT_NOT_FOUND'
    )
    expect(notFound).toHaveBeenCalledTimes(1)
  })
})
