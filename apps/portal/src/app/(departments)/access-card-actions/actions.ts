'use server'

import { revalidatePath } from 'next/cache'
import { AuthError, DatabaseError, ForbiddenError } from '@/lib/errors/error-classes'
import { detectAllPrinters } from './lib/printer-detection'

// AGENT-TRACE: Error handling pattern - Server Actions use typed error classes
// (AuthError, DatabaseError, ForbiddenError) which are caught by error boundaries.
// This provides consistent error codes and status codes via the error class system.

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

export async function assertAccessCardActionsRole() {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Unauthorized')

  const { data: employee } = await supabase
    .from('employees')
    .select('role, department_id')
    .eq('auth_id', user.id)
    .single()

  if (!employee || !['admin', 'access_control'].includes(employee.role)) {
    throw new ForbiddenError('Forbidden: access_control or admin role required', {
      resource: 'access_card_actions',
      action: 'assert_role',
    })
  }

  return { supabase, user, employee }
}

/* ------------------------------------------------------------------ */
/*  1. Printer Detection & Management                                  */
/* ------------------------------------------------------------------ */

/**
 * Scan for available printers via CUPS + USB and merge with registered printers.
 * Returns detected printers with registration status.
 */
export async function rescanPrinters() {
  const { supabase } = await assertAccessCardActionsRole()

  const detected = await detectAllPrinters()

  const { data: registered } = await supabase
    .from('card_printers')
    .select('cups_name, id')
    .is('deleted_at', null)

  const registeredNames = new Set((registered ?? []).map((r) => r.cups_name))

  const results = detected.map((printer) => ({
    ...printer,
    isRegistered: registeredNames.has(printer.cupsName),
    dbId: registered?.find((r) => r.cups_name === printer.cupsName)?.id ?? null,
  }))

  revalidatePath('/access-card-actions/print-cards')
  return { printers: results, count: results.length }
}

/**
 * Register a detected printer in the database.
 */
export async function registerPrinter(formData: {
  cupsName: string
  name: string
  model?: string
  connectionType?: string
  vendorId?: string
  productId?: string
  devicePath?: string
}) {
  await assertAccessCardActionsRole()
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('card_printers')
    .insert({
      cups_name: formData.cupsName,
      name: formData.name,
      model: formData.model ?? 'Neo Magic 300',
      connection_type: formData.connectionType ?? 'usb',
      vendor_id: formData.vendorId ?? null,
      product_id: formData.productId ?? null,
      device_path: formData.devicePath ?? null,
      status: 'online',
      last_online_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new DatabaseError('A printer with this CUPS name is already registered', {
        cause: error,
        table: 'card_printers',
      })
    }
    throw new DatabaseError('Failed to register printer', {
      cause: error,
      table: 'card_printers',
    })
  }

  revalidatePath('/access-card-actions/print-cards')
  return { printer: data }
}

/**
 * Unregister (soft delete) a printer.
 */
export async function unregisterPrinter(printerId: string) {
  const { supabase } = await assertAccessCardActionsRole()

  const { error } = await supabase
    .from('card_printers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', printerId)

  if (error) {
    throw new DatabaseError('Failed to unregister printer', {
      cause: error,
      table: 'card_printers',
    })
  }

  revalidatePath('/access-card-actions/print-cards')
  return { success: true }
}

/* ------------------------------------------------------------------ */
/*  2. Print Job Management                                            */
/* ------------------------------------------------------------------ */

/**
 * Get all print jobs, optionally filtered by status.
 */
export async function getPrintJobs(statusFilter?: string) {
  const { supabase } = await assertAccessCardActionsRole()

  let query = supabase
    .from('print_jobs')
    .select('*, printer:card_printers(name), template:card_templates(name)')
    .order('queued_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query
  if (error) {
    throw new DatabaseError('Failed to fetch print jobs', {
      cause: error,
      table: 'print_jobs',
    })
  }

  return { jobs: data ?? [] }
}

/**
 * Cancel a queued print job.
 */
export async function cancelPrintJob(jobId: string) {
  const { supabase } = await assertAccessCardActionsRole()

  const { error } = await supabase
    .from('print_jobs')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'queued') // Only cancel queued jobs

  if (error) {
    throw new DatabaseError('Failed to cancel print job', {
      cause: error,
      table: 'print_jobs',
    })
  }

  revalidatePath('/access-card-actions/print-cards')
  return { success: true }
}

/**
 * Retry a failed print job.
 */
export async function retryPrintJob(jobId: string) {
  const { supabase } = await assertAccessCardActionsRole()

  const { error } = await supabase
    .from('print_jobs')
    .update({
      status: 'queued',
      error_message: null,
      queued_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'failed')

  if (error) {
    throw new DatabaseError('Failed to retry print job', {
      cause: error,
      table: 'print_jobs',
    })
  }

  revalidatePath('/access-card-actions/print-cards')
  return { success: true }
}

/* ------------------------------------------------------------------ */
/*  3. Dashboard Stats                                                 */
/* ------------------------------------------------------------------ */

/**
 * Get dashboard metrics for the Access Card Actions department.
 */
export async function getDashboardMetrics() {
  const { supabase } = await assertAccessCardActionsRole()

  const today = new Date().toISOString().split('T')[0]

  const [printersResult, jobsTodayResult, pendingJobsResult, expiringCardsResult] =
    await Promise.all([
      supabase.from('card_printers').select('status').is('deleted_at', null),
      supabase
        .from('print_jobs')
        .select('id', { count: 'exact', head: true })
        .gte('queued_at', today),
      supabase
        .from('print_jobs')
        .select('id', { count: 'exact', head: true })
        .in('status', ['queued', 'rendering', 'printing']),
      supabase
        .from('issued_cards')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

  const onlinePrinters = (printersResult.data ?? []).filter((p) => p.status === 'online').length
  const totalPrinters = (printersResult.data ?? []).length

  return {
    onlinePrinters,
    totalPrinters,
    cardsPrintedToday: jobsTodayResult.count ?? 0,
    pendingJobs: pendingJobsResult.count ?? 0,
    expiringCards: expiringCardsResult.count ?? 0,
  }
}

/**
 * Get a list of expiring cards (within 7 days or already expired).
 */
export async function getExpiringCards() {
  const { supabase } = await assertAccessCardActionsRole()

  const { data, error } = await supabase
    .from('issued_cards')
    .select('*, personnel:personnel(first_name, surname)')
    .eq('status', 'active')
    .lte('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('expires_at', { ascending: true })

  if (error) {
    throw new DatabaseError('Failed to fetch expiring cards', {
      cause: error,
      table: 'issued_cards',
    })
  }

  return { cards: data ?? [] }
}

/**
 * Search employees for card printing.
 */
export async function searchEmployees(query: string) {
  const { supabase } = await assertAccessCardActionsRole()

  if (!query || query.length < 2) return { employees: [] }

  const { data, error } = await supabase
    .from('employees')
    .select(
      'id, first_name, last_name, national_id, job_title, areas, medical_expiry_date, induction_expiry_date, qr_code_data, photo_url'
    )
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,national_id.ilike.%${query}%`)
    .limit(10)

  if (error) {
    throw new DatabaseError('Failed to search employees', {
      cause: error,
      table: 'employees',
    })
  }

  return { employees: data ?? [] }
}
