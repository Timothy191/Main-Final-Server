import type { InngestFunction } from 'inngest'
import { inngest } from '@repo/utils/inngest'
import { createServiceRoleClient } from '@repo/supabase/service-role'
import { getShiftCompleteness } from '@/lib/shift-completeness'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'

/**
 * Shift Completeness Check Job
 *
 * Runs every 15 minutes during shift hours to verify that all machines
 * have entries for the current shift. Sends notifications if machines
 * are missing entries >30 minutes into the shift.
 *
 * Schedule: Every 15 minutes
 * Shift Hours: Day (06:00-18:00), Night (18:00-06:00)
 */

export const shiftCompletenessCheckFn = inngest.createFunction(
  {
    id: 'shift-completeness-check',
    // AGENT-TRACE: Run every 15 minutes
    triggers: [{ cron: '*/15 * * * *' }],
  },
  async ({ step: _step }) => {
    const serviceRole = createServiceRoleClient()
    const start = performance.now()
    let success = true
    const alerts: string[] = []

    try {
      // AGENT-TRACE: Get all active departments
      const { data: departments, error: deptError } = await serviceRole
        .from('departments')
        .select('id, name')
        .eq('type', 'operational')
        .eq('active', true)

      if (deptError) throw deptError
      if (!departments || departments.length === 0) {
        return { success: true, message: 'No active departments found' }
      }

      // AGENT-TRACE: Determine current shift
      const now = new Date()
      const hour = now.getHours()
      const isDayShift = hour >= 6 && hour < 18
      const shiftType: 'day' | 'night' = isDayShift ? 'day' : 'night'
      const today = now.toISOString().split('T')[0]!

      // AGENT-TRACE: Check each department's shift completeness
      for (const department of departments) {
        // Only check control-room departments
        if (department.name !== 'control-room') continue

        const completeness = await getShiftCompleteness(
          serviceRole,
          department.id,
          null,
          today,
          shiftType
        )

        // AGENT-TRACE: Identify machines without entries
        const missingMachines = completeness.statuses.filter(
          (status) => !status.exempt && !status.hasEntry
        )

        // AGENT-TRACE: Check if we're >30 minutes into shift
        const shiftStartHour = isDayShift ? 6 : 18
        const minutesIntoShift = (hour - shiftStartHour) * 60 + now.getMinutes()

        // Handle night shift crossing midnight
        const actualMinutesIntoShift =
          minutesIntoShift < 0 ? minutesIntoShift + 24 * 60 : minutesIntoShift

        if (missingMachines.length > 0 && actualMinutesIntoShift > 30) {
          // AGENT-TRACE: Create alert for missing machines
          const machineNames = missingMachines.map((m) => m.machineName).join(', ')
          const alert = `Department: ${department.name}, Shift: ${shiftType}, Missing machines (${missingMachines.length}): ${machineNames}`
          alerts.push(alert)

          // AGENT-TRACE: Log to database for tracking
          await serviceRole.from('shift_completeness_alerts').insert({
            department_id: department.id,
            shift_date: today,
            shift_type: shiftType,
            missing_machine_count: missingMachines.length,
            missing_machines: machineNames,
            minutes_into_shift: actualMinutesIntoShift,
            resolved: false,
            created_at: new Date().toISOString(),
          })
        }
      }

      const result = {
        success: true,
        departments_checked: departments.length,
        alerts_generated: alerts.length,
        alerts,
      }

      return result
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'shift_completeness_check_job',
      })
      throw err
    } finally {
      recordJobExecution('shift-completeness-check', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
