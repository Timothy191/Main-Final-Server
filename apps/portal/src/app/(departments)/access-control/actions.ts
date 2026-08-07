'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { encodeCursor, decodeCursor } from '@repo/ui/components/ui/pagination-cursor'
import { revalidatePath, revalidateTag } from 'next/cache'
import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AccessControlMetrics {
  activeQrCodes: number
  expiringSoon: number
  deniedToday: number
  accessEventsToday: number
  expiredAssigned: number
  entityCoverage: number
}

interface AccessActivityEntry {
  id: string
  entityName: string
  entityType: string
  zone: string
  status: 'Granted' | 'Denied' | 'Expired Credential' | 'Tailgate Alert'
  time: string
  qrId: string
}

interface EntityBadgeStatus {
  type: string
  total: number
  active: number
  expiring: number
  expired: number
}

export interface HourlyAccessPoint {
  hour: string
  granted: number
  denied: number
}

export interface BadgeStatusDistribution {
  name: string
  value: number
  fill: string
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertAccessControlRole() {
  return assertDeptRole(['admin', 'access_control'], 'access_control')
}

/* ------------------------------------------------------------------ */
/*  Shared pagination + metrics loaders                                */
/* ------------------------------------------------------------------ */

const BADGES_SELECT = `
  id,
  qr_code,
  entity_type,
  is_active,
  issued_at,
  expires_at,
  personnel:personnel_id(first_name, surname),
  visitor:visitor_id(first_name, surname),
  fleet:fleet_id(fleet_code, vehicle_type),
  equipment:equipment_id(equip_code, equipment_type)
`

const VISITORS_SELECT = `
  id,
  first_name,
  surname,
  id_number,
  company,
  visiting,
  reason_for_entry,
  check_in_time,
  check_out_time,
  status
`

const ACCESS_LOGS_SELECT = `
  id,
  scanned_at,
  gate_location,
  access_granted,
  denial_reason,
  access_type,
  direction,
  badge:badges!inner(qr_code, entity_type, personnel:personnel_id(first_name, surname), visitor:visitor_id(first_name, surname))
`

interface PaginationConfig {
  table: 'badges' | 'visitors' | 'access_logs'
  select: string
  sortColumn: string
  errorLabel: string
}

/** Offset (page/pageSize) fetch with exact count. */
async function paginateOffset<T>(
  deptId: string,
  config: PaginationConfig,
  page = 1,
  pageSize = 50
): Promise<{ items: T[]; totalCount: number }> {
  const { supabase } = await assertAccessControlRole()
  const { table, select, sortColumn, errorLabel } = config

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from(table)
    .select(select, { count: 'exact' })
    .eq('department_id', deptId)
    .order(sortColumn, { ascending: false })
    .range(from, to)

  if (error) {
    throw new DatabaseError(errorLabel, {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return { items: (data ?? []) as unknown as T[], totalCount: count ?? 0 }
}

/**
 * Cursor-based fetch for forward/backward navigation.
 * Fetches limit+1 rows to detect if a next page exists.
 */
async function paginateCursor<T extends { id: string }>(
  deptId: string,
  config: PaginationConfig,
  cursor?: string,
  limit = 50,
  direction: 'forward' | 'backward' = 'forward'
): Promise<{ items: T[]; nextCursor: string | null; hasMore: boolean; totalCount: number }> {
  const { supabase } = await assertAccessControlRole()
  const { table, select, sortColumn, errorLabel } = config

  let query = supabase
    .from(table)
    .select(select, { count: 'exact' })
    .eq('department_id', deptId)
    .order(sortColumn, { ascending: direction === 'backward' })
    .order('id', { ascending: direction === 'backward' })
    .limit(limit + 1)

  if (cursor) {
    const decoded = decodeCursor(cursor)
    if (decoded) {
      const { s: sortVal, i: idVal } = decoded
      if (direction === 'forward') {
        query = query.or(
          `${sortColumn}.lt.${sortVal},and(${sortColumn}.eq.${sortVal},id.lt.${idVal})`
        )
      } else {
        query = query.or(
          `${sortColumn}.gt.${sortVal},and(${sortColumn}.eq.${sortVal},id.gt.${idVal})`
        )
      }
    }
  }

  const { data, error, count } = await query

  if (error) {
    throw new DatabaseError(errorLabel, {
      operation: 'select',
      context: { error: error.message },
    })
  }

  const rows = (data ?? []) as unknown as T[]
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows

  // For backward pagination, reverse back to original order
  if (direction === 'backward') {
    items.reverse()
  }

  const lastRow = items[items.length - 1]
  const sortValue = (lastRow as Record<string, unknown>)[sortColumn] as string | undefined
  const nextCursor = hasMore && lastRow ? encodeCursor(sortValue ?? '', lastRow.id) : null

  return { items, nextCursor, hasMore, totalCount: count ?? 0 }
}

/** Shared loader for the get_access_control_metrics_jsonb RPC payload. */
async function getAccessControlMetricsPayload(
  deptId: string,
  errorLabel = 'Failed to load access control metrics'
): Promise<Record<string, unknown>> {
  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('get_access_control_metrics_jsonb', {
    p_department_id: deptId,
  })

  if (error) {
    throw new DatabaseError(errorLabel, {
      operation: 'rpc',
      context: { error: error.message },
    })
  }

  return (data as Record<string, unknown>) ?? {}
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics                                                     */
/* ------------------------------------------------------------------ */

async function _getCachedMetrics(deptId: string): Promise<AccessControlMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(DEPARTMENT_CACHE_TAGS.ACCESS_CONTROL, `dept:access-control:${deptId}`)
  const payload = await getAccessControlMetricsPayload(deptId)

  const metrics = payload?.metrics as Record<string, number> | undefined

  const activeQrCodes = metrics?.active_qr_codes ?? 0
  const totalEntities = metrics?.total_entities ?? 0
  const entityCoverage =
    totalEntities && activeQrCodes ? Math.round((activeQrCodes / totalEntities) * 100) : 0

  return {
    activeQrCodes,
    expiringSoon: metrics?.expiring_soon ?? 0,
    deniedToday: metrics?.denied_today ?? 0,
    accessEventsToday: metrics?.access_events_today ?? 0,
    expiredAssigned: metrics?.expired_assigned ?? 0,
    entityCoverage,
  }
}

export async function getAccessControlMetrics(deptId: string): Promise<AccessControlMetrics> {
  await assertAccessControlRole()
  return _getCachedMetrics(deptId)
}

/* ------------------------------------------------------------------ */
/*  2. Recent Activity Feed                                            */
/* ------------------------------------------------------------------ */

interface AccessLogWithBadge {
  id: string
  scanned_at: string
  gate_location: string
  access_granted: boolean
  denial_reason: string | null
  badge: {
    qr_code: string
    entity_type: string
    personnel: { first_name: string; surname: string } | null
    visitor: { first_name: string; surname: string } | null
  }
}

export async function getRecentAccessActivity(
  deptId: string,
  limit = 8
): Promise<AccessActivityEntry[]> {
  const { supabase } = await assertAccessControlRole()

  const { data: logs } = await supabase
    .from('access_logs')
    .select(
      `
      id,
      scanned_at,
      gate_location,
      access_granted,
      denial_reason,
      badge:badges!inner(qr_code, entity_type, personnel:personnel_id(first_name, surname), visitor:visitor_id(name))
    `
    )
    .eq('department_id', deptId)
    .order('scanned_at', { ascending: false })
    .limit(limit)

  if (!logs) return []

  return (logs as unknown as AccessLogWithBadge[]).map((log) => {
    const { badge } = log
    let entityName = 'Unknown'
    let entityType = badge?.entity_type ?? 'Unknown'

    if (badge?.personnel) {
      entityName = `${badge.personnel.first_name} ${badge.personnel.surname}`
      entityType = 'Employee'
    } else if (badge?.visitor) {
      entityName = `${badge.visitor.first_name} ${badge.visitor.surname}`
      entityType = 'Visitor'
    }

    let status: AccessActivityEntry['status'] = 'Granted'
    if (!log.access_granted) {
      status =
        log.denial_reason?.includes('Expired') || log.denial_reason?.includes('expired')
          ? 'Expired Credential'
          : log.denial_reason?.includes('Tailgate')
            ? 'Tailgate Alert'
            : 'Denied'
    }

    return {
      id: log.id,
      entityName,
      entityType,
      zone: log.gate_location,
      status,
      time: new Date(log.scanned_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      qrId: badge?.qr_code ?? 'N/A',
    }
  })
}

/* ------------------------------------------------------------------ */
/*  3. Entity Badge Status                                             */
/* ------------------------------------------------------------------ */

async function _getCachedEntityBadgeStatus(deptId: string): Promise<EntityBadgeStatus[]> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(DEPARTMENT_CACHE_TAGS.ACCESS_CONTROL_TAG, `dept:access-control:${deptId}:badges`)
  const payload = await getAccessControlMetricsPayload(deptId, 'Failed to load entity badge status')

  const status = payload?.entity_badge_status as
    | Record<
        string,
        {
          total?: number
          active?: number
          expiring?: number
          expired?: number
        }
      >
    | undefined

  return [
    {
      type: 'Employees',
      total: status?.employees?.total ?? 0,
      active: status?.employees?.active ?? 0,
      expiring: status?.employees?.expiring ?? 0,
      expired: status?.employees?.expired ?? 0,
    },
    {
      type: 'Vehicles',
      total: status?.vehicles?.total ?? 0,
      active: status?.vehicles?.active ?? 0,
      expiring: status?.vehicles?.expiring ?? 0,
      expired: status?.vehicles?.expired ?? 0,
    },
    {
      type: 'Equipment',
      total: status?.equipment?.total ?? 0,
      active: status?.equipment?.active ?? 0,
      expiring: status?.equipment?.expiring ?? 0,
      expired: status?.equipment?.expired ?? 0,
    },
  ]
}

export async function getEntityBadgeStatus(deptId: string): Promise<EntityBadgeStatus[]> {
  await assertAccessControlRole()
  return _getCachedEntityBadgeStatus(deptId)
}

/* ------------------------------------------------------------------ */
/*  4. Hourly Access Stats                                             */
/* ------------------------------------------------------------------ */

export async function getHourlyAccessStats(
  deptId: string,
  date?: string
): Promise<HourlyAccessPoint[]> {
  const { supabase } = await assertAccessControlRole()

  const targetDate = date ?? new Date().toISOString().split('T')[0]
  const start = `${targetDate}T00:00:00Z`
  const end = `${targetDate}T23:59:59Z`

  const { data: logs } = await supabase
    .from('access_logs')
    .select('scanned_at, access_granted')
    .eq('department_id', deptId)
    .gte('scanned_at', start)
    .lte('scanned_at', end)

  // Aggregate into hourly buckets
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    granted: 0,
    denied: 0,
  }))

  if (!logs) return hours

  for (const log of logs) {
    const h = new Date(log.scanned_at).getUTCHours()
    if (log.access_granted) {
      hours[h]!.granted++
    } else {
      hours[h]!.denied++
    }
  }

  return hours
}

/* ------------------------------------------------------------------ */
/*  5. Badge Status Distribution                                       */
/* ------------------------------------------------------------------ */

async function _getCachedBadgeStatusDistribution(
  deptId: string
): Promise<BadgeStatusDistribution[]> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(DEPARTMENT_CACHE_TAGS.ACCESS_CONTROL_TAG, `dept:access-control:${deptId}:distribution`)
  const payload = await getAccessControlMetricsPayload(
    deptId,
    'Failed to load badge status distribution'
  )

  const dist = payload?.badge_status_distribution as Record<string, number> | undefined

  return [
    { name: 'Active', value: dist?.active ?? 0, fill: 'var(--success)' },
    {
      name: 'Expiring Soon',
      value: dist?.expiring_soon ?? 0,
      fill: 'var(--warning)',
    },
    { name: 'Expired', value: dist?.expired ?? 0, fill: 'var(--danger)' },
    {
      name: 'Revoked',
      value: dist?.revoked ?? 0,
      fill: 'var(--muted-foreground)',
    },
  ]
}

export async function getBadgeStatusDistribution(
  deptId: string
): Promise<BadgeStatusDistribution[]> {
  await assertAccessControlRole()
  return _getCachedBadgeStatusDistribution(deptId)
}

/* ------------------------------------------------------------------ */
/*  6. Badge CRUD Actions                                              */
/* ------------------------------------------------------------------ */

export async function getBadgesForDepartment(deptId: string, page = 1, pageSize = 50) {
  const { items, totalCount } = await paginateOffset<any>(
    deptId,
    {
      table: 'badges',
      select: BADGES_SELECT,
      sortColumn: 'issued_at',
      errorLabel: 'Failed to load badges',
    },
    page,
    pageSize
  )
  return { badges: items, totalCount }
}

/**
 * Cursor-based badge fetch for forward/backward navigation.
 * Fetches limit+1 rows to detect if a next page exists.
 */
export async function getBadgesForDepartmentCursor(
  deptId: string,
  cursor?: string,
  limit = 50,
  direction: 'forward' | 'backward' = 'forward'
) {
  const { items, nextCursor, hasMore, totalCount } = await paginateCursor<any>(
    deptId,
    {
      table: 'badges',
      select: BADGES_SELECT,
      sortColumn: 'issued_at',
      errorLabel: 'Failed to load badges (cursor)',
    },
    cursor,
    limit,
    direction
  )
  return { badges: items, nextCursor, hasMore, totalCount }
}

export async function getVisitorsForDepartment(deptId: string, page = 1, pageSize = 50) {
  const { items, totalCount } = await paginateOffset<any>(
    deptId,
    {
      table: 'visitors',
      select: VISITORS_SELECT,
      sortColumn: 'check_in_time',
      errorLabel: 'Failed to load visitors',
    },
    page,
    pageSize
  )
  return { visitors: items, totalCount }
}

/**
 * Cursor-based visitor fetch for forward/backward navigation.
 */
export async function getVisitorsForDepartmentCursor(
  deptId: string,
  cursor?: string,
  limit = 50,
  direction: 'forward' | 'backward' = 'forward'
) {
  const { items, nextCursor, hasMore, totalCount } = await paginateCursor<any>(
    deptId,
    {
      table: 'visitors',
      select: VISITORS_SELECT,
      sortColumn: 'check_in_time',
      errorLabel: 'Failed to load visitors (cursor)',
    },
    cursor,
    limit,
    direction
  )
  return { visitors: items, nextCursor, hasMore, totalCount }
}

export async function registerVisitor(formData: FormData) {
  const { supabase, employee } = await assertAccessControlRole()

  const firstName = formData.get('first_name') as string
  const surname = formData.get('surname') as string
  const company = formData.get('company') as string
  const reason = formData.get('reason') as string

  const { data: visitor, error } = await supabase
    .from('visitors')
    .insert({
      first_name: firstName,
      surname,
      company,
      reason_for_entry: reason,
      department_id: employee.department_id,
      status: 'Checked In',
      check_in_time: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new DatabaseError('Failed to register visitor', {
      operation: 'insert',
      context: { error: error.message },
    })
  }

  // Also issue a temporary badge
  const qrCode = `TEMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const { error: badgeError } = await supabase.from('badges').insert({
    qr_code: qrCode,
    entity_type: 'Visitor',
    visitor_id: visitor.id,
    department_id: employee.department_id,
    is_active: true,
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
  })

  if (badgeError) {
    // Failed to issue badge, but visitor was registered.
    // In production, we should log this to a proper observability system.
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.ACCESS_CONTROL, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.ACCESS_CONTROL_TAG, 'max')
  revalidatePath('/access-control/visitors')
  return { success: true }
}

export async function getAccessLogsForDepartment(deptId: string, page = 1, pageSize = 50) {
  const { items, totalCount } = await paginateOffset<any>(
    deptId,
    {
      table: 'access_logs',
      select: ACCESS_LOGS_SELECT,
      sortColumn: 'scanned_at',
      errorLabel: 'Failed to load access logs',
    },
    page,
    pageSize
  )
  return { logs: items, totalCount }
}

/**
 * Cursor-based access log fetch for forward/backward navigation.
 */
export async function getAccessLogsForDepartmentCursor(
  deptId: string,
  cursor?: string,
  limit = 50,
  direction: 'forward' | 'backward' = 'forward'
) {
  const { items, nextCursor, hasMore, totalCount } = await paginateCursor<any>(
    deptId,
    {
      table: 'access_logs',
      select: ACCESS_LOGS_SELECT,
      sortColumn: 'scanned_at',
      errorLabel: 'Failed to load access logs (cursor)',
    },
    cursor,
    limit,
    direction
  )
  return { logs: items, nextCursor, hasMore, totalCount }
}
