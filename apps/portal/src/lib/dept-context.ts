import { createServerSupabaseClient } from '@repo/supabase/server'
import { cacheGet, cacheSet } from '@repo/redis/cache'
import { DEPARTMENTS } from './departments'
import { notFound } from 'next/navigation'
import { getOperationalToday } from '@repo/utils'

/**
 * Resolves department context for a server component page.
 * Validates the department slug, fetches the department UUID from Supabase,
 * and calls notFound() if the department doesn't exist.
 * Uses Redis to cache department UUID lookups.
 *
 * @returns `{ dept, deptId, supabase, today }`
 */
export async function getDepartmentContext(params: { department: string }): Promise<{
  dept: (typeof DEPARTMENTS)[number]
  deptId: string
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  today: string
}> {
  const dept = DEPARTMENTS.find((d) => d.name === params.department)
  if (!dept) notFound()

  const supabase = await createServerSupabaseClient()

  const cacheKey = `dept:uuid:${params.department}`
  let deptId = await cacheGet<string>(cacheKey)

  if (!deptId) {
    const { data: department } = await supabase
      .from('departments')
      .select('id')
      .eq('name', params.department)
      .single()

    if (!department) notFound()
    deptId = department.id
    await cacheSet(cacheKey, deptId, 3600) // 1 hour
  }

  const today = getOperationalToday()

  return {
    dept,
    deptId: deptId as string,
    supabase,
    today,
  }
}

/**
 * Checks that the current department matches one of the allowed departments.
 * Calls notFound() if the department is not in the allowed list.
 * Use this for tabs that should only be accessible by specific departments.
 */
export function requireDepartment(departmentSlug: string, allowed: string | string[]) {
  const allowedList = Array.isArray(allowed) ? allowed : [allowed]
  if (!allowedList.includes(departmentSlug)) {
    notFound()
  }
}
