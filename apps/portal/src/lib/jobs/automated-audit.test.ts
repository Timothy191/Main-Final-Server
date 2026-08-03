import { automatedAuditFn } from './automated-audit'

// Mock Supabase service role client
jest.mock('@repo/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn(),
}))

// Mock React PDF renderer components and StyleSheet
jest.mock('@react-pdf/renderer', () => ({
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Document: ({ children }: any) => children,
  Page: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  View: ({ children }: any) => children,
  renderToFile: jest.fn().mockResolvedValue(undefined),
}))

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('mock pdf content')),
  unlink: jest.fn().mockResolvedValue(undefined),
}))

// Mock errors logging
jest.mock('@/lib/errors/error-logger', () => ({
  logError: jest.fn(),
}))

// Mock metrics reporting
jest.mock('@/lib/observability/metrics', () => ({
  recordJobExecution: jest.fn(),
}))

const { createServiceRoleClient } = jest.requireMock('@repo/supabase/service-role')
const { renderToFile } = jest.requireMock('@react-pdf/renderer')

describe('automatedAuditFn Inngest Job', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully aggregates metrics, renders PDF, uploads to storage, and writes database record', async () => {
    // Mock Safety Department fetch
    const mockDept = { id: 'dept-safety-uuid', name: 'safety' }

    const mockStorageUpload = jest.fn().mockResolvedValue({ error: null })
    const mockStorageGetPublicUrl = jest
      .fn()
      .mockReturnValue({ data: { publicUrl: 'https://supabase.com/audit_report.pdf' } })
    const mockInsert = jest.fn().mockResolvedValue({ error: null })

    const mockSupabase = {
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'departments') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockDept, error: null }),
          }
        }
        if (table === 'generated_reports') {
          return { insert: mockInsert }
        }
        // Access logs
        if (table === 'access_logs') {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        // Drilling ops
        if (table === 'drill_operations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        // Production logs
        if (table === 'production_logs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return {}
      }),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: mockStorageUpload,
          getPublicUrl: mockStorageGetPublicUrl,
        }),
      },
    }

    createServiceRoleClient.mockReturnValue(mockSupabase)

    // Call Inngest handler directly
    const handler = (automatedAuditFn as any).fn
    const result = await handler({ event: {}, step: {} })

    expect(result.success).toBe(true)
    expect(result.pdfUrl).toBe('https://supabase.com/audit_report.pdf')

    // Verify PDF template rendering was triggered
    expect(renderToFile).toHaveBeenCalledTimes(1)

    // Verify upload to 'audit-reports' bucket
    expect(mockStorageUpload).toHaveBeenCalledTimes(1)

    // Verify insert into generated_reports table
    expect(mockInsert).toHaveBeenCalledTimes(1)
    const insertPayload = mockInsert.mock.calls[0][0]
    expect(insertPayload.department_id).toBe('dept-safety-uuid')
    expect(insertPayload.shift_type).toBe('daily_audit')
    expect(insertPayload.pdf_url).toBe('https://supabase.com/audit_report.pdf')
  })
})
