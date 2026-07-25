'use server'

import { revalidatePath } from 'next/cache'
import { UnauthorizedError, ForbiddenError } from '@repo/errors'

export async function triggerManualAudit() {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const { inngest } = await import('@repo/utils/inngest')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError()
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (
    !employee ||
    (employee.role !== 'admin' && employee.role !== 'manager' && employee.role !== 'safety')
  ) {
    throw new ForbiddenError(
      'Only admins, managers, or safety officers can trigger a manual audit.'
    )
  }

  await inngest.send({
    name: 'report/automated-audit',
    data: {},
  })

  revalidatePath('/safety/audit-dashboard')
}
