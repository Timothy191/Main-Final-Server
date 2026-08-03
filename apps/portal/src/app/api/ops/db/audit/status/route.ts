import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'
import { queryAuditLogs } from '@/lib/api/admin-db'
import { DatabaseError } from '@/lib/errors/error-classes'

/* ── GET /api/ops/db/audit/status ───────────────────────────── */
export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  try {
    const { data, error } = await queryAuditLogs(supabase).limit(1)

    if (error) throw new DatabaseError(error.message)

    return NextResponse.json({
      success: true,
      data: data?.[0] ?? null,
    })
  } catch (err) {
    if (err instanceof DatabaseError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
