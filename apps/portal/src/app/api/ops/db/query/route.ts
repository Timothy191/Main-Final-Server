import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { execAdminSql } from '@/lib/api/admin-db'
import { DatabaseError } from '@/lib/errors/error-classes'

const SAFE_QUERY_MAX_ROWS = 500

/** Zod schema for the request body */
const dbQuerySchema = z.object({
  sql: z.string().min(1, 'sql is required').max(10000, 'sql is too long'),
})

/**
 * Reject dangerous SQL patterns beyond the basic SELECT-only check.
 * Blocks: semicolons (stacked queries), UNION, SQL comments (--/\/\*),
 * control characters, INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/TRUNCATE.
 */
function validateReadOnlySql(sql: string): string | null {
  // Reject control characters (except \n, \r, \t which are valid SQL whitespace)
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(sql)) {
    return 'SQL contains invalid control characters'
  }

  // Reject semicolons (prevents stacked queries)
  if (sql.includes(';')) {
    return 'SQL must not contain semicolons'
  }

  // Reject SQL comment sequences
  if (sql.includes('--') || sql.includes('/*')) {
    return 'SQL must not contain comment sequences'
  }

  // Must be a SELECT query
  if (!/^\s*SELECT\s+/i.test(sql)) {
    return 'Only SELECT queries are allowed'
  }

  // Reject UNION (prevents union-based injection)
  if (/\bUNION\b/i.test(sql)) {
    return 'UNION queries are not allowed'
  }

  // Reject data modification keywords
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/i.test(sql)) {
    return 'Data modification statements are not allowed'
  }

  return null
}

/* ── POST /api/ops/db/query ─────────────────────────────────── */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()
  if (employee?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Validate request body with Zod
    const body = await request.json()
    const parsed = dbQuerySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { sql } = parsed.data

    // Validate SQL is safe read-only
    const sqlError = validateReadOnlySql(sql)
    if (sqlError) {
      return NextResponse.json({ error: sqlError }, { status: 400 })
    }

    // Execute safe read-only query via typed admin wrapper
    const limitedSql = `SELECT * FROM (${sql}) AS _sub LIMIT ${SAFE_QUERY_MAX_ROWS + 1}`
    const { data, error } = await execAdminSql(supabase, limitedSql)

    if (error) throw new DatabaseError(error.message)

    const rows = (data as Record<string, unknown>[]) ?? []
    const truncated = rows.length > SAFE_QUERY_MAX_ROWS
    if (truncated) rows.length = SAFE_QUERY_MAX_ROWS
    const columns = rows.length > 0 ? Object.keys(rows[0]!) : []

    return NextResponse.json({
      success: true,
      data: { columns, rows, rowCount: rows.length, truncated },
    })
  } catch (err) {
    if (err instanceof DatabaseError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
