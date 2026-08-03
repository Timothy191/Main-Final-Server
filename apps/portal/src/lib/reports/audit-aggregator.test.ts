import { getAggregatedAuditData } from './audit-aggregator'

describe('getAggregatedAuditData', () => {
  it('queries the database tables and aggregates statistics correctly', async () => {
    const mockAccessLogs = [
      { access_granted: true, direction: 'IN' },
      { access_granted: true, direction: 'OUT' },
      { access_granted: false, direction: 'IN' },
    ]

    const mockDrillOps = [
      {
        holes: 5,
        meters_drilled: 12.5,
        production_delays: 10,
        non_productional_delays: 20,
        engineering_delays: 30,
      },
      {
        holes: 3,
        meters_drilled: 8.0,
        production_delays: 5,
        non_productional_delays: 0,
        engineering_delays: 15,
      },
    ]

    const mockProdLogs = [
      { coal_tonnes: 150.5, waste_tonnes: 300.0, daily_logs: { log_date: '2026-07-20' } },
      { coal_tonnes: 200.0, waste_tonnes: 450.5, daily_logs: { log_date: '2026-07-20' } },
    ]

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'access_logs') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({ data: mockAccessLogs, error: null }),
          }
        }
        if (table === 'drill_operations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockDrillOps, error: null }),
          }
        }
        if (table === 'production_logs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockProdLogs, error: null }),
          }
        }
        return {}
      }),
    } as any

    const targetDate = new Date('2026-07-21T08:00:00.000Z')
    const result = await getAggregatedAuditData(mockSupabase, targetDate)

    // 1. Verify date processing
    expect(result.reportDate).toBe('2026-07-21')

    // 2. Verify Access Control aggregation
    expect(result.metrics.accessControl.checkIns).toBe(1)
    expect(result.metrics.accessControl.checkOuts).toBe(1)
    expect(result.metrics.accessControl.denials).toBe(1)

    // 3. Verify Drilling performance aggregation
    expect(result.metrics.drilling.totalHoles).toBe(8)
    expect(result.metrics.drilling.totalMeters).toBe(20.5)
    expect(result.metrics.drilling.totalDowntimeMinutes).toBe(80) // 10+20+30 + 5+0+15 = 80

    // 4. Verify Production output aggregation
    expect(result.metrics.production.totalCoalTonnes).toBe(350.5)
    expect(result.metrics.production.totalWasteTonnes).toBe(750.5)
  })
})
