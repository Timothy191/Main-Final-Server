import { logAuditEvent, recordAdminAuditEvent } from './audit'

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')

function buildMockSupabase({
  userId = 'auth-user-1',
  employeeId = 'emp-1',
  employeeRole = 'admin',
  employeeDept = 'dept-admin',
  insertError = null,
}: {
  userId?: string
  employeeId?: string | null
  employeeRole?: string | null
  employeeDept?: string | null
  insertError?: unknown
} = {}) {
  const mockInsert = jest.fn().mockResolvedValue({ error: insertError })

  const mock = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: userId } } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'employees') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: employeeId
                  ? { id: employeeId, role: employeeRole, department_id: employeeDept }
                  : null,
              }),
            }),
          }),
        }
      }
      if (table === 'audit_logs' || table === 'admin_audit_trail') {
        return { insert: mockInsert }
      }
      return {}
    }),
  }

  createServerSupabaseClient.mockResolvedValue(mock)
  return { mockInsert }
}

describe('logAuditEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('inserts an audit log with correct fields', async () => {
    const { mockInsert } = buildMockSupabase()

    await logAuditEvent({
      action: 'insert',
      tableName: 'daily_logs',
      recordId: 'record-123',
      newData: { foo: 'bar' },
      departmentId: 'dept-abc',
    })

    expect(mockInsert).toHaveBeenCalledTimes(1)
    const payload = mockInsert.mock.calls[0][0]
    expect(payload.action).toBe('insert')
    expect(payload.table_name).toBe('daily_logs')
    expect(payload.record_id).toBe('record-123')
    expect(payload.new_data).toEqual({ foo: 'bar' })
    expect(payload.performed_by).toBe('emp-1')
    expect(payload.department_id).toBe('dept-abc')
  })

  it('sets performed_by to null when employee is not found', async () => {
    const { mockInsert } = buildMockSupabase({ employeeId: null })

    await logAuditEvent({
      action: 'delete',
      tableName: 'machines',
      recordId: 'machine-1',
    })

    const payload = mockInsert.mock.calls[0][0]
    expect(payload.performed_by).toBeNull()
    expect(payload.department_id).toBeNull()
  })

  it('sets old_data and new_data for update actions', async () => {
    const { mockInsert } = buildMockSupabase()

    await logAuditEvent({
      action: 'update',
      tableName: 'breakdowns',
      recordId: 'bd-5',
      oldData: { status: 'open' },
      newData: { status: 'closed' },
      departmentId: 'dept-eng',
    })

    const payload = mockInsert.mock.calls[0][0]
    expect(payload.action).toBe('update')
    expect(payload.old_data).toEqual({ status: 'open' })
    expect(payload.new_data).toEqual({ status: 'closed' })
  })

  it('handles missing optional fields gracefully', async () => {
    const { mockInsert } = buildMockSupabase()

    await logAuditEvent({
      action: 'delete',
      tableName: 'audit_logs',
    })

    const payload = mockInsert.mock.calls[0][0]
    expect(payload.record_id).toBeUndefined()
    expect(payload.old_data).toBeUndefined()
    expect(payload.department_id).toBeNull()
  })
})

describe('recordAdminAuditEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('inserts an admin audit trail event with performer and department', async () => {
    const { mockInsert } = buildMockSupabase()

    await recordAdminAuditEvent({
      action: 'user.role_changed',
      entityType: 'employee',
      entityId: 'emp-9',
      details: { full_name: 'Grace', from: 'operator', to: 'supervisor' },
    })

    expect(mockInsert).toHaveBeenCalledTimes(1)
    const payload = mockInsert.mock.calls[0][0]
    expect(payload.action).toBe('user.role_changed')
    expect(payload.entity_type).toBe('employee')
    expect(payload.entity_id).toBe('emp-9')
    expect(payload.performed_by).toBe('emp-1')
    expect(payload.department_id).toBe('dept-admin')
    expect(payload.details).toEqual({ full_name: 'Grace', from: 'operator', to: 'supervisor' })
  })

  it('respects an explicit department override', async () => {
    const { mockInsert } = buildMockSupabase()

    await recordAdminAuditEvent({
      action: 'department.created',
      entityType: 'department',
      entityId: 'dept-new',
      departmentId: 'dept-other',
    })

    const payload = mockInsert.mock.calls[0][0]
    expect(payload.department_id).toBe('dept-other')
  })

  it('throws ForbiddenError when caller is not an admin', async () => {
    buildMockSupabase({ employeeRole: 'operator' })

    await expect(
      recordAdminAuditEvent({ action: 'user.created', entityType: 'employee' })
    ).rejects.toThrow('Only admins can record audit events')
  })

  it('throws ForbiddenError when employee record is missing', async () => {
    buildMockSupabase({ employeeId: null })

    await expect(
      recordAdminAuditEvent({ action: 'user.created', entityType: 'employee' })
    ).rejects.toThrow('Only admins can record audit events')
  })

  it('throws DatabaseError when the insert fails', async () => {
    buildMockSupabase({ insertError: new Error('constraint violation') })

    await expect(
      recordAdminAuditEvent({ action: 'user.deactivated', entityType: 'employee' })
    ).rejects.toThrow('Failed to record audit event')
  })
})
