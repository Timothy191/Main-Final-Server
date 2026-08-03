'use server'

import { UnauthorizedError, ForbiddenError, ValidationError } from '@repo/errors'

export async function speculativeEmbedShiftLog(text: string) {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const { inngest, aiGenerateEmbeddingEvent } = await import('@repo/utils/inngest')
  const { logError } = await import('@/lib/errors/error-logger')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError()
  }

  if (!text || text.trim() === '') return

  try {
    await inngest.send({
      name: aiGenerateEmbeddingEvent,
      data: {
        text,
        userId: user.id,
      },
    })
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: 'speculative_embed_queue_failed',
    })
  }
}

export async function generateMonthlyReport(
  reportData: Record<string, unknown>,
  departmentId?: string
) {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const { logError } = await import('@/lib/errors/error-logger')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError()
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role, department_id')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin' && employee?.role !== 'manager') {
    throw new ForbiddenError('Only admins and managers can generate monthly reports.')
  }

  try {
    const { pdf } = await import('@react-pdf/renderer')
    const { ReportTemplate } = await import('@/features/analytics/components/ReportTemplate')
    const React = await import('react')

    const deptId = departmentId || employee.department_id
    if (!deptId) {
      throw new ValidationError('Department ID is required to determine storage permissions.')
    }

    const doc = React.createElement(ReportTemplate, { data: reportData }) as unknown as Parameters<
      typeof pdf
    >[0]
    const buffer = await pdf(doc).toBuffer()

    const filename = `${deptId}/${user.id}/report-${Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filename, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      throw new ValidationError(`Upload failed: ${uploadError.message}`)
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filename, 3600)

    if (signedError) {
      throw new ValidationError(`Signed URL creation failed: ${signedError.message}`)
    }

    return { success: true, url: signedData.signedUrl }
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: 'generate_monthly_report',
    })
    throw err
  }
}
