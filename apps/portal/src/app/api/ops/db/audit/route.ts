import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'
import { runDbAudit } from '@/lib/api/admin-db'
import { DatabaseError } from '@/lib/errors/error-classes'

/* ── POST /api/ops/db/audit ─────────────────────────────────── */
export async function POST() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  try {
    const { data, error } = await runDbAudit(supabase)
    if (error) throw new DatabaseError(error.message)

    return NextResponse.json({ success: true, data: data ?? {} })
  } catch (err) {
    if (err instanceof DatabaseError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
