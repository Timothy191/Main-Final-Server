import type { InngestFunction } from 'inngest'
import { inngest } from '@repo/utils/inngest'
import { createServiceRoleClient } from '@repo/supabase/service-role'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'

/**
 * Orphaned Record Detection Job
 *
 * Runs daily at 02:00 to detect data integrity issues where records
 * reference non-existent machines or have missing relationships.
 *
 * Schedule: Daily at 02:00
 * Checks:
 * - Machine operations without valid machine_id
 * - Hourly loads without matching machine operation
 * Action: Flag for admin review, create cleanup job
 */

export const orphanedRecordDetectionFn = inngest.createFunction(
  {
    id: 'orphaned-record-detection',
    triggers: [{ cron: '0 2 * * *' }],
  },
  async () => {
    const serviceRole = createServiceRoleClient()
    const start = performance.now()
    let success = true
    const issues: { type: string; count: number; details: string[] }[] = []

    try {
      // AGENT-TRACE: Check machine operations without valid machine_id
      const { data: invalidMachineOps, error: opsError } = await serviceRole
        .from('machine_operations')
        .select('id, machine_id, operator_id, operation_date')
        .not('machine_id', 'in', serviceRole.from('machines').select('id'))

      if (opsError) throw opsError

      if (invalidMachineOps && invalidMachineOps.length > 0) {
        issues.push({
          type: 'invalid_machine_id_in_operations',
          count: invalidMachineOps.length,
          details: invalidMachineOps.map((op) => `ID: ${op.id}, Machine ID: ${op.machine_id}`),
        })

        // AGENT-TRACE: Flag these records for admin review
        for (const op of invalidMachineOps) {
          await serviceRole.from('data_integrity_issues').insert({
            issue_type: 'orphaned_record',
            table_name: 'machine_operations',
            record_id: op.id,
            description: `Invalid machine_id: ${op.machine_id}`,
            severity: 'high',
            created_at: new Date().toISOString(),
          })
        }
      }

      // AGENT-TRACE: Check hourly loads without matching machine operation
      const { data: orphanedLoads, error: loadsError } = await serviceRole
        .from('hourly_loads')
        .select('id, machine_id, load_date, shift_type')
        .not('machine_id', 'in', serviceRole.from('machines').select('id').eq('active', true))

      if (loadsError) throw loadsError

      if (orphanedLoads && orphanedLoads.length > 0) {
        issues.push({
          type: 'hourly_loads_orphaned_machine',
          count: orphanedLoads.length,
          details: orphanedLoads.map(
            (load) => `ID: ${load.id}, Machine ID: ${load.machine_id}, Date: ${load.load_date}`
          ),
        })

        // AGENT-TRACE: Flag these records for admin review
        for (const load of orphanedLoads) {
          await serviceRole.from('data_integrity_issues').insert({
            issue_type: 'orphaned_record',
            table_name: 'hourly_loads',
            record_id: load.id,
            description: `Machine not active or doesn't exist: ${load.machine_id}`,
            severity: 'medium',
            created_at: new Date().toISOString(),
          })
        }
      }

      // AGENT-TRACE: Check for machine operations without valid operator
      const { data: invalidOps, error: invalidOpsError } = await serviceRole
        .from('machine_operations')
        .select('id, operator_id, operation_date')
        .not('operator_id', 'in', serviceRole.from('employees').select('id'))

      if (invalidOpsError) throw invalidOpsError

      if (invalidOps && invalidOps.length > 0) {
        issues.push({
          type: 'invalid_operator_id_in_operations',
          count: invalidOps.length,
          details: invalidOps.map((op) => `ID: ${op.id}, Operator ID: ${op.operator_id}`),
        })

        // AGENT-TRACE: Flag these records for admin review
        for (const op of invalidOps) {
          await serviceRole.from('data_integrity_issues').insert({
            issue_type: 'orphaned_record',
            table_name: 'machine_operations',
            record_id: op.id,
            description: `Invalid operator_id: ${op.operator_id}`,
            severity: 'high',
            created_at: new Date().toISOString(),
          })
        }
      }

      // AGENT-TRACE: Check shift_status without valid department
      const { data: invalidShiftStatus, error: shiftError } = await serviceRole
        .from('shift_status')
        .select('id, department_id, shift_date')
        .not('department_id', 'in', serviceRole.from('departments').select('id'))

      if (shiftError) throw shiftError

      if (invalidShiftStatus && invalidShiftStatus.length > 0) {
        issues.push({
          type: 'invalid_department_id_in_shift_status',
          count: invalidShiftStatus.length,
          details: invalidShiftStatus.map(
            (shift) => `ID: ${shift.id}, Dept ID: ${shift.department_id}`
          ),
        })

        // AGENT-TRACE: Flag these records for admin review
        for (const shift of invalidShiftStatus) {
          await serviceRole.from('data_integrity_issues').insert({
            issue_type: 'orphaned_record',
            table_name: 'shift_status',
            record_id: shift.id,
            description: `Invalid department_id: ${shift.department_id}`,
            severity: 'high',
            created_at: new Date().toISOString(),
          })
        }
      }

      const result = {
        success: true,
        issues_found: issues.length,
        issues,
        total_issues: issues.reduce((sum, issue) => sum + issue.count, 0),
      }

      return result
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'orphaned_record_detection_job',
      })
      throw err
    } finally {
      recordJobExecution('orphaned-record-detection', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
