import { searchEmployees } from './actions'
import { AuthError, DatabaseError } from '@/lib/errors/error-classes'

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')

describe('actions - searchEmployees', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSupabaseClient = (user: any, employee: any, searchResponse: any) => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: employee }),
      or: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(searchResponse),
    }

    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user } }),
      },
      from: jest.fn().mockReturnValue(mockQuery),
    })
  }

  it('throws AuthError when user is not authenticated', async () => {
    mockSupabaseClient(null, null, {})
    await expect(searchEmployees('test')).rejects.toThrow(AuthError)
  })

  it('throws ForbiddenError if employee does not have right role', async () => {
    mockSupabaseClient({ id: 'user-1' }, { role: 'operator' }, {})
    await expect(searchEmployees('test')).rejects.toThrow('Forbidden')
  })

  it('returns empty employees array when query is too short', async () => {
    mockSupabaseClient({ id: 'user-1' }, { role: 'access_control' }, {})
    const result = await searchEmployees('a')
    expect(result.employees).toEqual([])
  })

  it('returns matched employees successfully', async () => {
    const mockEmployees = [{ id: '1', first_name: 'John', last_name: 'Doe', national_id: '123' }]
    mockSupabaseClient(
      { id: 'user-1' },
      { role: 'access_control' },
      { data: mockEmployees, error: null }
    )

    const result = await searchEmployees('John')
    expect(result.employees).toEqual(mockEmployees)
  })

  it('throws DatabaseError if query fails', async () => {
    mockSupabaseClient(
      { id: 'user-1' },
      { role: 'access_control' },
      { data: null, error: { message: 'DB Error' } }
    )

    await expect(searchEmployees('John')).rejects.toThrow(DatabaseError)
  })
})
