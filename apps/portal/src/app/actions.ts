'use server'

import { revalidateTag, updateTag } from 'next/cache'

export async function speculativeEmbedShiftLog(text: string) {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const { inngest, aiGenerateEmbeddingEvent } = await import('@repo/utils/inngest')
  const { logError } = await import('@/lib/errors/error-logger')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
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
    // Log error but do not fail the user's critical operation path
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: 'speculative_embed_queue_failed',
    })
  }
}

export async function revalidateRSC(tags: string[]) {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  for (const tag of tags) {
    revalidateTag(tag, 'max')
  }
  return { success: true }
}

export async function updateCacheTags(tags: string[]) {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  for (const tag of tags) {
    updateTag(tag)
  }
  return { success: true }
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
    throw new Error('Unauthorized')
  }

  // Validate user role is admin or manager
  const { data: employee } = await supabase
    .from('employees')
    .select('role, department_id')
    .eq('auth_id', user.id)
    .single()

  if (employee?.role !== 'admin' && employee?.role !== 'manager') {
    throw new Error('Unauthorized')
  }

  try {
    const { pdf } = await import('@react-pdf/renderer')
    const { ReportTemplate } = await import('@/features/analytics/components/ReportTemplate')
    const React = await import('react')

    // Use employee department ID as fallback for folder categorization
    const deptId = departmentId || employee.department_id
    if (!deptId) {
      throw new Error('Department ID is required to determine storage permissions')
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
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filename, 3600)

    if (signedError) {
      throw new Error(`Signed URL creation failed: ${signedError.message}`)
    }

    return { success: true, url: signedData.signedUrl }
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: 'generate_monthly_report',
    })
    throw err
  }
}
