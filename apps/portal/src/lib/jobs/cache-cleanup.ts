import type { InngestFunction } from 'inngest'
import { inngest } from '@repo/utils/inngest'
import { createServiceRoleClient } from '@repo/supabase/service-role'
import { clearObservabilityMetrics } from '@/lib/observability/metrics'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

/**
 * Cache Cleanup Job
 *
 * Runs daily at 03:00 to:
 *   1. Clear in-memory observability metrics that accumulated during the day
 *   2. Clean up temporary PDF/files left behind by report generation (older than 1 hour)
 *   3. Archive stale Supabase data (generated_reports older than 90 days)
 *   4. Reclaim disk space from abandoned temp artifacts
 *
 * Schedule: Daily at 03:00
 */

const MAX_TEMP_AGE_MS = 60 * 60 * 1000 // 1 hour
const REPORT_RETENTION_DAYS = 90

export const cacheCleanupFn = inngest.createFunction(
  {
    id: 'cache-cleanup',
    triggers: [{ cron: '0 3 * * *' }, { event: 'cache/cleanup' }], // Daily at 03:00 or manual event
  },
  async ({ step: _step }) => {
    const supabase = createServiceRoleClient()
    const start = performance.now()
    let success = true
    const results: string[] = []

    try {
      // 1. Clear in-memory observability metrics
      clearObservabilityMetrics()
      results.push('observability_metrics: cleared')
      console.warn('[cache-cleanup] In-memory observability metrics cleared')

      // 2. Clean up old temp files in os.tmpdir() that match known patterns
      const tempDir = os.tmpdir()
      let tempFilesRemoved = 0
      try {
        const files = await fs.readdir(tempDir)
        const cutOff = Date.now() - MAX_TEMP_AGE_MS
        for (const file of files) {
          // Only clean files matching known report patterns
          if (
            file.startsWith('audit_report_') ||
            file.startsWith('arch-temp-') ||
            file.endsWith('.pdf')
          ) {
            try {
              const filePath = path.join(tempDir, file)
              const stat = await fs.stat(filePath)
              if (stat.isFile() && stat.mtimeMs < cutOff) {
                await fs.unlink(filePath)
                tempFilesRemoved++
              }
            } catch {
              // File may have been deleted by another process — skip
            }
          }
        }
      } catch {
        // Temp dir may be inaccessible — skip cleanup
        console.warn('[cache-cleanup] Unable to scan temp directory')
      }
      results.push(`temp_files_removed: ${tempFilesRemoved}`)

      // 3. Archive/delete generated reports older than retention period
      const retentionDate = new Date()
      retentionDate.setDate(retentionDate.getDate() - REPORT_RETENTION_DAYS)

      const { data: oldReports, error: fetchError } = await supabase
        .from('generated_reports')
        .select('id, pdf_url')
        .lt('generated_at', retentionDate.toISOString())
        .limit(50)

      if (fetchError) {
        console.warn('[cache-cleanup] Failed to query old reports:', fetchError.message)
      } else if (oldReports && oldReports.length > 0) {
        // Delete associated PDF files from storage
        for (const report of oldReports) {
          if (report.pdf_url) {
            try {
              const storagePath = report.pdf_url.split('/storage/v1/object/public/')[1]
              if (storagePath) {
                await supabase.storage.from('audit-reports').remove([storagePath])
              }
            } catch {
              // Ignore per-report cleanup errors
            }
          }
        }

        // Delete the database records
        const reportIds = oldReports.map((r) => r.id)
        const { error: deleteError } = await supabase
          .from('generated_reports')
          .delete()
          .in('id', reportIds)

        if (deleteError) {
          console.warn('[cache-cleanup] Failed to delete old report records:', deleteError.message)
        } else {
          results.push(`old_reports_archived: ${reportIds.length}`)
          console.warn(`[cache-cleanup] Archived ${reportIds.length} old reports`)
        }
      } else {
        results.push('old_reports_archived: 0')
      }

      return {
        success: true,
        results,
        summary: results.join(', '),
      }
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'cache_cleanup_job',
      })
      throw err
    } finally {
      recordJobExecution('cache-cleanup', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
