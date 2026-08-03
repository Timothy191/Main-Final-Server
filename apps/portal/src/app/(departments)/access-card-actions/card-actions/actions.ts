'use server'

import type { PersonnelRow, BadgesRow, IssuedCardsRow } from '@repo/supabase'
import { AuthError, DatabaseError, ForbiddenError } from '@/lib/errors/error-classes'
import { submitCupsPrintJob } from '../lib/printer-detection'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PersonnelSearchResult {
  id: string
  first_name: string
  surname: string
  id_number: string
  job_title: string | null
  area: string | null
  status: string
  department_id: string | null
  has_badge: boolean
}

export interface PersonnelDetail extends PersonnelRow {
  badge: Pick<BadgesRow, 'id' | 'qr_code' | 'is_active'> | null
  issued_card: Pick<IssuedCardsRow, 'id' | 'status' | 'expires_at'> | null
  photo_signed_url: string | null
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertAccessCardActionsRole() {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new AuthError('Unauthorized')

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (!employee || !['admin', 'access_control'].includes(employee.role)) {
    throw new ForbiddenError('Forbidden: access_control or admin role required', {
      resource: 'card_actions',
      action: 'assert_role',
    })
  }

  return { supabase, user, employee }
}

/* ------------------------------------------------------------------ */
/*  1. Search Personnel                                                */
/* ------------------------------------------------------------------ */

export async function searchPersonnel(query: string): Promise<PersonnelSearchResult[]> {
  const { supabase } = await assertAccessCardActionsRole()

  if (!query || query.trim().length < 2) return []

  const searchTerm = `%${query.trim()}%`

  const { data, error } = await supabase
    .from('personnel')
    .select(
      `
      id,
      first_name,
      surname,
      id_number,
      job_title,
      area,
      status,
      department_id,
      badges!left(id)
    `
    )
    .or(`first_name.ilike.${searchTerm},surname.ilike.${searchTerm},id_number.ilike.${searchTerm}`)
    .order('surname', { ascending: true })
    .limit(50)

  if (error) {
    throw new DatabaseError('Failed to search personnel', {
      cause: error,
      table: 'personnel',
    })
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    first_name: row.first_name,
    surname: row.surname,
    id_number: row.id_number,
    job_title: row.job_title,
    area: row.area,
    status: row.status,
    department_id: row.department_id,
    has_badge: Array.isArray(row.badges) && row.badges.length > 0,
  }))
}

/* ------------------------------------------------------------------ */
/*  2. Get Personnel Detail                                            */
/* ------------------------------------------------------------------ */

export async function getPersonnelDetail(personnelId: string): Promise<PersonnelDetail | null> {
  const { supabase } = await assertAccessCardActionsRole()

  const { data: personnel, error } = await supabase
    .from('personnel')
    .select('*')
    .eq('id', personnelId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new DatabaseError('Failed to fetch personnel detail', {
      cause: error,
      table: 'personnel',
    })
  }

  const { data: badge } = await supabase
    .from('badges')
    .select('id, qr_code, is_active')
    .eq('personnel_id', personnelId)
    .maybeSingle()

  const { data: issuedCard } = await supabase
    .from('issued_cards')
    .select('id, status, expires_at')
    .eq('personnel_id', personnelId)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let photoSignedUrl: string | null = null
  if (personnel.photo_url) {
    if (personnel.photo_url.startsWith('http')) {
      photoSignedUrl = personnel.photo_url
    } else {
      const { data: signedData } = await supabase.storage
        .from('personnel-photos')
        .createSignedUrl(personnel.photo_url, 3600)
      photoSignedUrl = signedData?.signedUrl ?? null
    }
  }

  return {
    ...personnel,
    badge: badge ?? null,
    issued_card: issuedCard ?? null,
    photo_signed_url: photoSignedUrl,
  }
}

/* ------------------------------------------------------------------ */
/*  3. Print Card for Personnel                                        */
/* ------------------------------------------------------------------ */

export async function printCardForPersonnel(personnelId: string, templateId?: string) {
  const { supabase, user } = await assertAccessCardActionsRole()

  const detail = await getPersonnelDetail(personnelId)
  if (!detail) {
    throw new DatabaseError('Personnel not found', { table: 'personnel' })
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, department_id')
    .eq('auth_id', user.id)
    .single()

  const qrCode = detail.badge?.qr_code ?? null

  const { data: printer } = await supabase
    .from('card_printers')
    .select('id, cups_name')
    .eq('status', 'online')
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle()

  const { data: job, error } = await supabase
    .from('print_jobs')
    .insert({
      personnel_id: personnelId,
      employee_name: `${detail.first_name} ${detail.surname}`,
      role_title: detail.job_title,
      qr_code_data: qrCode,
      status: 'queued',
      printer_id: printer?.id ?? null,
      template_id: templateId ?? null,
      created_by: employee?.id ?? null,
      expires_at: detail.induction_expiry ?? undefined,
    })
    .select()
    .single()

  if (error) {
    throw new DatabaseError('Failed to create print job', {
      cause: error,
      table: 'print_jobs',
    })
  }

  let cupsJobId: number | null = null
  if (printer?.cups_name) {
    try {
      const result = await submitCupsPrintJob(printer.cups_name, `card-${personnelId}`)
      cupsJobId = result.cupsJobId
    } catch {
      // CUPS submission is best-effort; job remains queued in DB
    }
  }

  if (cupsJobId) {
    await supabase
      .from('print_jobs')
      .update({ cups_job_id: cupsJobId, status: 'sent_to_printer' })
      .eq('id', job.id)
  }

  return { job: { ...job, cups_job_id: cupsJobId }, printer }
}

/* ------------------------------------------------------------------ */
/*  4. Bulk Print Cards for Personnel                                  */
/* ------------------------------------------------------------------ */

export async function bulkPrintCardsForPersonnel(personnelIds: string[], templateId?: string) {
  const results = []
  for (const id of personnelIds) {
    try {
      const res = await printCardForPersonnel(id, templateId)
      results.push({ id, status: 'success', data: res })
    } catch (err) {
      results.push({
        id,
        status: 'error',
        error: err instanceof Error ? err.message : 'Print failed',
      })
    }
  }
  return results
}

/* ------------------------------------------------------------------ */
/*  5. Get Card Templates                                              */
/* ------------------------------------------------------------------ */

export async function getCardTemplates() {
  const { supabase } = await assertAccessCardActionsRole()
  const { data, error } = await supabase
    .from('card_templates')
    .select('id, name, background, is_default')
    .is('deleted_at', null)
    .order('is_default', { ascending: false })

  if (error) {
    throw new DatabaseError('Failed to fetch card templates', {
      cause: error,
      table: 'card_templates',
    })
  }
  return data ?? []
}
