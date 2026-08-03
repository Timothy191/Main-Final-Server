import type { InngestFunction } from 'inngest'
import { inngest } from '@repo/utils/inngest'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'
export const generateReportFn = inngest.createFunction(
  { id: 'generate-shift-report', triggers: [{ event: 'report/generate' }] },
  async ({ event }) => {
    const { departmentId, dateFrom, dateTo } = event.data
    const supabase = await createServerSupabaseClient()
    const start = performance.now()
    let success = true

    try {
      // Fetch aggregated data for the report
      const { data: dailyLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('department_id', departmentId)
        .gte('date', dateFrom)
        .lte('date', dateTo)

      const { data: productionLogs } = await supabase
        .from('production_logs')
        .select('*')
        .eq('department_id', departmentId)
        .gte('date', dateFrom)
        .lte('date', dateTo)

      const totalCoal = productionLogs?.reduce((sum, log) => sum + (log.coal_tonnes ?? 0), 0)
      const totalWaste = productionLogs?.reduce((sum, log) => sum + (log.waste_tonnes ?? 0), 0)

      const reportData = {
        department_id: departmentId,
        date_from: dateFrom,
        date_to: dateTo,
        total_shifts: dailyLogs?.length ?? 0,
        total_coal_tonnes: totalCoal,
        total_waste_tonnes: totalWaste,
        generated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('generated_reports').insert(reportData)

      if (error) throw error

      return { success: true, report: reportData }
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'generate_report_job',
        departmentId,
        dateFrom,
        dateTo,
      })
      throw err
    } finally {
      recordJobExecution('generate-shift-report', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
