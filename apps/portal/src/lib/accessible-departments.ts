/**
 * Resolve department slugs the employee may open (hub + BottomNav).
 * AGENT-TRACE: Union of home department_id + accessible_departments UUIDs → names.
 * Hub always shows the full catalog; `accessible` marks open vs no-entry.
 */
import 'server-only'

import { createReadReplicaClient } from '@repo/supabase/read-replica'
import { isDeptAllowedForRole } from '@/lib/dept-access'
import { DEPARTMENTS } from '@/lib/departments'
import type { Department } from '@/lib/departments'

export type HubDepartment = Department & { accessible: boolean }

export async function resolveAccessibleDepartmentNames(
  userId: string
): Promise<{ role: string; names: string[] }> {
  const db = await createReadReplicaClient()

  const { data: empData } = await db
    .from('employees')
    .select('role, department_id, accessible_departments')
    .eq('auth_id', userId)
    .single()

  const role =
    typeof empData?.role === 'string' && empData.role.length > 0 ? empData.role : 'operator'

  // AGENT-TRACE: Admins always receive the full catalog names so hub + nav unlock.
  if (role === 'admin') {
    return { role, names: DEPARTMENTS.map((d) => d.name) }
  }

  const uuidSet = new Set<string>()
  if (empData?.department_id) {
    uuidSet.add(empData.department_id)
  }
  for (const id of empData?.accessible_departments ?? []) {
    if (typeof id === 'string' && id.length > 0) {
      uuidSet.add(id)
    }
  }

  if (uuidSet.size === 0) {
    return { role, names: [] }
  }

  const { data: deptData } = await db
    .from('departments')
    .select('name')
    .in('id', [...uuidSet])

  const names = (deptData ?? [])
    .map((d) => d.name)
    .filter((n): n is string => typeof n === 'string' && n.length > 0)

  return { role, names }
}

/**
 * Hub cards: always the full catalog. `accessible` = ACL ∩ role gate.
 * AGENT-TRACE: Never hide departments — unauthorized show no-entry cursor in UI.
 */
export function departmentsForHub(accessibleNames: string[], role: string): HubDepartment[] {
  const acl = new Set(accessibleNames)
  return DEPARTMENTS.map((d) => ({
    ...d,
    accessible: acl.has(d.name) && isDeptAllowedForRole(d.name, role),
  }))
}
