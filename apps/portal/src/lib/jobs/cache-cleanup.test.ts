import { cacheCleanupFn } from './cache-cleanup'

// Mock Supabase service role client
jest.mock('@repo/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn(),
}))

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readdir: jest.fn().mockResolvedValue([]),
  stat: jest.fn(),
  unlink: jest.fn().mockResolvedValue(undefined),
}))

// Mock os.tmpdir
jest.mock('os', () => ({
  tmpdir: jest.fn().mockReturnValue('/tmp/mock'),
}))

// Mock errors logging
jest.mock('@/lib/errors/error-logger', () => ({
  logError: jest.fn(),
}))

// Mock metrics reporting
jest.mock('@/lib/observability/metrics', () => ({
  recordJobExecution: jest.fn(),
  clearObservabilityMetrics: jest.fn(),
}))

const { createServiceRoleClient } = jest.requireMock('@repo/supabase/service-role')
const { clearObservabilityMetrics } = jest.requireMock('@/lib/observability/metrics')
const fs = jest.requireMock('fs/promises')

describe('cacheCleanupFn Inngest Job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully clears metrics and handles no old reports', async () => {
    const mockSelect = jest.fn().mockReturnThis()
    const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null })
    const mockLt = jest.fn().mockReturnThis()
    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'generated_reports') {
        return {
          select: mockSelect,
          lt: mockLt,
          limit: mockLimit,
        }
      }
      return {}
    })

    const mockSupabase = {
      from: mockFrom,
      storage: {
        from: jest.fn().mockReturnValue({
          remove: jest.fn().mockResolvedValue({ error: null }),
        }),
      },
    }

    createServiceRoleClient.mockReturnValue(mockSupabase)
    fs.readdir.mockResolvedValue([])

    const handler = (cacheCleanupFn as any).fn
    const result = await handler({ event: {}, step: {} })

    expect(result.success).toBe(true)
    expect(result.results).toContain('observability_metrics: cleared')
    expect(result.results).toContain('temp_files_removed: 0')
    expect(result.results).toContain('old_reports_archived: 0')

    // Verify metrics were cleared
    expect(clearObservabilityMetrics).toHaveBeenCalledTimes(1)

    // Verify old reports were queried
    expect(mockFrom).toHaveBeenCalledWith('generated_reports')
    expect(mockSelect).toHaveBeenCalledWith('id, pdf_url')
  })

  it('cleans up old temp files matching known patterns', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
      storage: {
        from: jest.fn().mockReturnValue({
          remove: jest.fn().mockResolvedValue({ error: null }),
        }),
      },
    }

    createServiceRoleClient.mockReturnValue(mockSupabase)

    // Simulate old temp files that match cleanup patterns
    const now = Date.now()
    fs.readdir.mockResolvedValue([
      'audit_report_2024-01-01.pdf',
      'arch-temp-abc123.tmp',
      'other_random_file.txt',
    ])

    // First file: old, should be cleaned
    // Second file: old, should be cleaned
    // Third file: doesn't match pattern, should be skipped
    fs.stat
      .mockResolvedValueOnce({ isFile: () => true, mtimeMs: now - 7200000 }) // 2 hours old
      .mockResolvedValueOnce({ isFile: () => true, mtimeMs: now - 7200000 }) // 2 hours old

    const handler = (cacheCleanupFn as any).fn
    const result = await handler({ event: {}, step: {} })

    expect(result.success).toBe(true)
    expect(result.results).toContain('temp_files_removed: 2')
    expect(fs.unlink).toHaveBeenCalledTimes(2)
  })

  it('archives old reports from storage and database', async () => {
    const mockStorageRemove = jest.fn().mockResolvedValue({ error: null })
    const mockIn = jest.fn().mockResolvedValue({ error: null })
    const mockDelete = jest.fn().mockReturnValue({ in: mockIn })

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'generated_reports') {
          return {
            select: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'report-1',
                  pdf_url:
                    'https://supabase.co/storage/v1/object/public/audit-reports/daily/report-1.pdf',
                },
                {
                  id: 'report-2',
                  pdf_url:
                    'https://supabase.co/storage/v1/object/public/audit-reports/daily/report-2.pdf',
                },
              ],
              error: null,
            }),
            delete: mockDelete,
          }
        }
        return {}
      }),
      storage: {
        from: jest.fn().mockReturnValue({
          remove: mockStorageRemove,
        }),
      },
    }

    createServiceRoleClient.mockReturnValue(mockSupabase)
    fs.readdir.mockResolvedValue([])

    const handler = (cacheCleanupFn as any).fn
    const result = await handler({ event: {}, step: {} })

    expect(result.success).toBe(true)
    expect(result.results).toContain('old_reports_archived: 2')

    // Verify storage cleanup for both reports
    expect(mockStorageRemove).toHaveBeenCalledTimes(2)
    expect(mockStorageRemove).toHaveBeenCalledWith(['audit-reports/daily/report-1.pdf'])
    expect(mockStorageRemove).toHaveBeenCalledWith(['audit-reports/daily/report-2.pdf'])

    // Verify chain: .delete() → .in('id', [...])
    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(mockIn).toHaveBeenCalledWith('id', ['report-1', 'report-2'])
  })

  it('handles errors gracefully', async () => {
    const mockSupabase = {
      from: jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed')
      }),
      storage: {
        from: jest.fn(),
      },
    }

    createServiceRoleClient.mockReturnValue(mockSupabase)
    fs.readdir.mockResolvedValue([])

    const handler = (cacheCleanupFn as any).fn

    await expect(handler({ event: {}, step: {} })).rejects.toThrow()
  })
})
