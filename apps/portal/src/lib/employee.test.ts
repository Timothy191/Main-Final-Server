import { getEmployeeIdForAuthUser } from './employee'

describe('getEmployeeIdForAuthUser', () => {
  it('returns employee id when auth user exists', async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'emp-uuid' } }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getEmployeeIdForAuthUser>[0]

    await expect(getEmployeeIdForAuthUser(supabase, 'auth-uuid')).resolves.toBe('emp-uuid')
  })

  it('returns null when no employee row', async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getEmployeeIdForAuthUser>[0]

    await expect(getEmployeeIdForAuthUser(supabase, 'auth-uuid')).resolves.toBe(null)
  })
})
