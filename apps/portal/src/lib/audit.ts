'use server'

import { updateTag, revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { AuthError, DatabaseError, ForbiddenError } from '@/lib/errors/error-classes'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

type AuditAction = 'insert' | 'update' | 'delete'

export interface AuditLogInput {
  action: AuditAction
  tableName: string
  recordId?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  departmentId?: string
}

export async function logAuditEvent(input: AuditLogInput) {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new AuthError('Unauthorized: valid session required', {
      context: { operation: 'logAuditEvent' },
    })
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  await supabase.from('audit_logs').insert({
    action: input.action,
    table_name: input.tableName,
    record_id: input.recordId,
    old_data: input.oldData,
    new_data: input.newData,
    performed_by: employee?.id ?? null,
    department_id: input.departmentId ?? null,
  })

  if (input.tableName) {
    try {
      updateTag(`table:${input.tableName}`)
    } catch {
      // Ignore if not in rendering/action context
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Admin audit trail — rich, admin-scoped events (admin_audit_trail)  */
/* ------------------------------------------------------------------ */

export interface AdminAuditEventInput {
  /** Dot-namespaced action, e.g. 'user.role_changed', 'department.updated'. */
  action: string
  /** Entity kind, e.g. 'employee', 'department'. */
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
  /** Override the acting department (defaults to the caller's dept). */
  departmentId?: string
}

/**
 * Record an admin-scoped audit event into `admin_audit_trail`.
 *
 * Admin-only: resolves the caller's employee row (for `performed_by` and the
 * department scope) and inserts the event. Revalidates the admin audit cache
 * tag so the /admin/audit-trail view reflects the change immediately.
 */
export async function recordAdminAuditEvent(input: AdminAuditEventInput) {
  const { createServerSupabaseClient } = await import('@repo/supabase/server')
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new AuthError('Unauthorized: valid session required', {
      context: { operation: 'recordAdminAuditEvent' },
    })
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, role, department_id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!employee || employee.role !== 'admin') {
    throw new ForbiddenError('Only admins can record audit events', {
      resource: 'admin',
      action: 'record_audit_event',
    })
  }

  const { error } = await supabase.from('admin_audit_trail').insert({
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    details: input.details ?? null,
    performed_by: employee.id,
    department_id: input.departmentId ?? employee.department_id ?? null,
    ip_address: await resolveClientIp(),
  })

  if (error) {
    throw new DatabaseError('Failed to record audit event', {
      operation: 'insert',
      context: { error: error.message },
    })
  }

  try {
    revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_ADMIN_AUDIT, 'max')
  } catch {
    // Ignore if not in rendering/action context
  }
}

/**
 * Best-effort client IP resolution for audit records.
 *
 * Reads the standard proxy headers (`x-forwarded-for`, `x-real-ip`) via
 * `next/headers`. Falls back to `unknown` when the action runs outside a
 * request scope (e.g. tests) — mirroring the existing `getClientIp` helper in
 * `lib/api/rate-limit-middleware.ts`.
 */
async function resolveClientIp(): Promise<string> {
  try {
    const h = await headers()
    const forwarded = h.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
    return h.get('x-real-ip') ?? 'unknown'
  } catch {
    return 'unknown'
  }
}
