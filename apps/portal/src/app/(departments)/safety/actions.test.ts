import {
  getSafetyMetrics,
  getRecentSafetyIncidents,
  reportSafetyIncident,
  updateIncidentStatus,
} from './actions'

// Mock dependencies
jest.mock('@/lib/dept-access', () => ({
  assertDeptRole: jest.fn(),
}))

jest.mock('@/lib/errors/error-classes', () => ({
  DatabaseError: class DatabaseError extends Error {
    constructor(
      message: string,
      public ctx?: any
    ) {
      super(message)
      this.name = 'DatabaseError'
    }
  },
}))

jest.mock('@/lib/department-cache', () => ({
  DEPARTMENT_CACHE_TAGS: {
    SAFETY: 'dept:safety',
    TABLE_SAFETY_INCIDENTS: 'table:safety_incidents',
  },
}))

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  cacheTag: jest.fn(),
  cacheLife: jest.fn(),
}))

// Mock @repo/supabase/server
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
}

jest.mock('@repo/supabase/server', () => ({
  createAdminClient: jest.fn(() => mockSupabaseClient),
}))

const { assertDeptRole } = jest.requireMock('@/lib/dept-access')
const { revalidateTag } = jest.requireMock('next/cache')

describe('Safety Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default assertDeptRole success mock
    assertDeptRole.mockResolvedValue({
      supabase: mockSupabaseClient,
      user: { id: 'test-user-id' },
      employee: { role: 'safety', department_id: 'safety-dept-id' },
    })
  })

  function fluentBuilder(data: any = null, error: any = null, count: number | null = null) {
    const builder: any = {}
    builder.select = jest.fn().mockReturnValue(builder)
    builder.eq = jest.fn().mockReturnValue(builder)
    builder.in = jest.fn().mockReturnValue(builder)
    builder.gte = jest.fn().mockReturnValue(builder)
    builder.order = jest.fn().mockReturnValue(builder)
    builder.limit = jest.fn().mockReturnValue(builder)
    builder.insert = jest.fn().mockReturnValue(builder)
    builder.update = jest.fn().mockReturnValue(builder)
    builder.single = jest.fn().mockResolvedValue({ data, error })

    // Resolve Promise structure directly for chained calls
    builder.then = (onfulfilled: any) => Promise.resolve({ data, error, count }).then(onfulfilled)

    return builder
  }

  describe('getSafetyMetrics', () => {
    it('calls assertSafetyRole and queries incident counts', async () => {
      // Mock all counts to return a specific count value
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'safety_incidents') {
          return fluentBuilder(null, null, 3)
        }
        return fluentBuilder()
      })

      const metrics = await getSafetyMetrics('safety-dept-id')

      expect(assertDeptRole).toHaveBeenCalledWith(['admin', 'safety', 'supervisor'], 'safety')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('safety_incidents')
      expect(metrics).toEqual({
        openIncidents: 3,
        resolvedThisMonth: 3,
        lostTimeIncidents: 3,
        nearMissCount: 3,
        underInvestigation: 3,
        incidentsTodayCount: 3,
      })
    })
  })

  describe('getRecentSafetyIncidents', () => {
    it('returns formatted recent incidents list', async () => {
      const mockIncidents = [
        {
          id: 'incident-1',
          incident_date: '2026-08-01',
          shift_type: 'day',
          incident_type: 'near-miss',
          status: 'open',
          description: 'Slip on walkway',
          location: 'Pit B',
          injured_parties: 0,
        },
      ]

      mockSupabaseClient.from.mockReturnValueOnce(fluentBuilder(mockIncidents))

      const result = await getRecentSafetyIncidents('safety-dept-id')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'incident-1',
        incidentDate: '2026-08-01',
        shiftType: 'day',
        incidentType: 'near-miss',
        status: 'open',
        description: 'Slip on walkway',
        location: 'Pit B',
        injuredParties: 0,
      })
    })

    it('throws DatabaseError if query fails', async () => {
      mockSupabaseClient.from.mockReturnValueOnce(
        fluentBuilder(null, { message: 'Database outage' })
      )

      await expect(getRecentSafetyIncidents('safety-dept-id')).rejects.toThrow(
        'Failed to load recent safety incidents'
      )
    })
  })

  describe('reportSafetyIncident', () => {
    it('inserts a new incident and revalidates cache tags', async () => {
      const input = {
        departmentId: 'safety-dept-id',
        title: 'Tripping hazard',
        description: 'Loose cable detected',
        severity: 'medium' as const,
        location: 'Workshop 1',
        shiftType: 'day' as const,
      }

      const mockInserted = { id: 'new-incident-1' }
      mockSupabaseClient.from.mockReturnValueOnce(fluentBuilder(mockInserted))

      const result = await reportSafetyIncident(input)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('safety_incidents')
      expect(result).toEqual({ success: true, incidentId: 'new-incident-1' })
      expect(revalidateTag).toHaveBeenCalledWith('dept:safety', 'max')
      expect(revalidateTag).toHaveBeenCalledWith('table:safety_incidents', 'max')
      expect(revalidateTag).toHaveBeenCalledWith('dept:safety:safety-dept-id', 'max')
    })

    it('maps critical severity to lost-time incident type', async () => {
      const input = {
        departmentId: 'safety-dept-id',
        title: 'Injury',
        description: 'Operator injured hand',
        severity: 'critical' as const,
      }

      const mockBuilder = fluentBuilder({ id: 'critical-inc-1' })
      mockSupabaseClient.from.mockReturnValueOnce(mockBuilder)

      await reportSafetyIncident(input)

      expect(mockBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          incident_type: 'lost-time',
        })
      )
    })
  })

  describe('updateIncidentStatus', () => {
    it('updates status and appends closed_at timestamp when resolved', async () => {
      const input = {
        incidentId: 'incident-1',
        status: 'resolved' as const,
      }

      const mockBuilder = fluentBuilder({ success: true })
      mockSupabaseClient.from.mockReturnValueOnce(mockBuilder)

      const result = await updateIncidentStatus(input)

      expect(result).toEqual({ success: true })
      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved',
          closed_at: expect.any(String),
        })
      )
      expect(revalidateTag).toHaveBeenCalledWith('dept:safety', 'max')
      expect(revalidateTag).toHaveBeenCalledWith('table:safety_incidents', 'max')
    })
  })
})
