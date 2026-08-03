'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

export interface AdminAuditEntry {
  id: string
  action: string
  entityType: string
  details: string | null
  createdAt: string
}

export interface AdminAuditMetrics {
  total: number
  userCreated: number
  roleChanges: number
  deactivations: number
}

async function _getCachedAuditMetrics(deptId: string): Promise<AdminAuditMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(DEPARTMENT_CACHE_TAGS.TABLE_ADMIN_AUDIT, `dept:admin:${deptId}`)

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [
    { count: total },
    { count: userCreated },
    { count: roleChanges },
    { count: deactivations },
  ] = await Promise.all([
    supabase
      .from('admin_audit_trail')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId),
    supabase
      .from('admin_audit_trail')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('action', 'user.created'),
    supabase
      .from('admin_audit_trail')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('action', 'user.role_changed'),
    supabase
      .from('admin_audit_trail')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', deptId)
      .eq('action', 'user.deactivated'),
  ])

  return {
    total: total ?? 0,
    userCreated: userCreated ?? 0,
    roleChanges: roleChanges ?? 0,
    deactivations: deactivations ?? 0,
  }
}

export async function getAuditMetrics(deptId: string): Promise<AdminAuditMetrics> {
  await assertAdminRole()
  return _getCachedAuditMetrics(deptId)
}

async function assertAdminRole() {
  return assertDeptRole(['admin'], 'admin')
}

export async function getAuditTrail(deptId: string, limit = 100): Promise<AdminAuditEntry[]> {
  await assertAdminRole()

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('admin_audit_trail')
    .select('id, action, entity_type, details, created_at')
    .eq('department_id', deptId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new DatabaseError('Failed to load audit trail', {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (
    (data ?? []) as {
      id: string
      action: string
      entity_type: string
      details: unknown
      created_at: string
    }[]
  ).map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    details: row.details ? JSON.stringify(row.details) : null,
    createdAt: row.created_at,
  }))
}
