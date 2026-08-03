import type { InngestFunction } from 'inngest'
import { inngest } from '@repo/utils/inngest'
import { createServiceRoleClient } from '@repo/supabase/service-role'
import { renderToFile } from '@react-pdf/renderer'
import React from 'react'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { getAggregatedAuditData } from '../reports/audit-aggregator'
import { AuditReportDocument } from '../reports/templates/AuditReportDocument'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'

export const automatedAuditFn = inngest.createFunction(
  {
    id: 'automated-audit-report',
    triggers: [{ cron: '0 8 * * *' }, { event: 'report/automated-audit' }], // Daily at 08:00 AM or manual event trigger
  },
  async () => {
    const supabase = createServiceRoleClient()
    const start = performance.now()
    let success = true
    let tempFilePath: string | null = null

    try {
      // 1. Fetch Safety Department UUID
      const { data: dept, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('name', 'safety')
        .single()

      if (deptError || !dept) {
        throw new Error(`Safety department not found: ${deptError?.message || 'empty result'}`)
      }

      // 2. Aggregate metrics for the past 24 hours
      const targetDate = new Date()
      const reportData = await getAggregatedAuditData(
        supabase as unknown as Parameters<typeof getAggregatedAuditData>[0],
        targetDate
      )

      // 3. Render PDF layout to a local temporary file
      const tempDir = os.tmpdir()
      const fileName = `audit_report_${reportData.reportDate}_${Date.now()}.pdf`
      tempFilePath = path.join(tempDir, fileName)

      await renderToFile(
        React.createElement(AuditReportDocument, { data: reportData }) as unknown as Parameters<
          typeof renderToFile
        >[0],
        tempFilePath
      )

      // 4. Upload PDF to Supabase storage bucket
      const pdfBuffer = await fs.readFile(tempFilePath)
      const storagePath = `daily/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('audit-reports')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
        })

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('audit-reports').getPublicUrl(storagePath)

      const pdfUrl = urlData.publicUrl

      // 5. Insert into generated_reports table
      const { error: insertError } = await supabase.from('generated_reports').insert({
        department_id: dept.id,
        report_date: reportData.reportDate,
        shift_type: 'daily_audit',
        report_data: reportData as unknown as Record<string, unknown>,
        pdf_url: pdfUrl,
      })

      if (insertError) {
        throw new Error(`Failed to insert generated report row: ${insertError.message}`)
      }

      // 6. Call Novu trigger API to dispatch notifications
      const novuApiKey = process.env.NOVU_API_KEY
      if (novuApiKey) {
        try {
          const response = await fetch('https://api.novu.co/v1/events/trigger', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `ApiKey ${novuApiKey}`,
            },
            body: JSON.stringify({
              name: 'automated-audit-reporter',
              to: {
                subscriberId: 'safety-compliance-officer',
              },
              payload: {
                reportDate: reportData.reportDate,
                downloadUrl: pdfUrl,
              },
            }),
          })
          if (!response.ok) {
            console.warn(`Novu trigger failed: status ${response.status}`)
          }
        } catch (err) {
          console.warn('Novu trigger network error:', err)
        }
      }

      return { success: true, date: reportData.reportDate, pdfUrl }
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'automated_audit_reporter_job',
      })
      throw err
    } finally {
      // Cleanup local temp file
      if (tempFilePath) {
        try {
          await fs.unlink(tempFilePath)
        } catch {
          // Ignore cleanup errors
        }
      }
      recordJobExecution('automated-audit-report', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
