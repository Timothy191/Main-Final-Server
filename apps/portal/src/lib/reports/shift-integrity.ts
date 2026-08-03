import type { InngestFunction } from 'inngest'
import { inngest } from '@repo/utils/inngest'

export const shiftIntegrityReportFn = inngest.createFunction(
  { id: 'shift-integrity-report', triggers: [{ event: 'report/shift-integrity' }] },
  async () => {
    return { success: true }
  }
) as unknown as InngestFunction.Any
