import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/api/auth'
import { repairTable } from '@/lib/api/admin-db'
import { DatabaseError } from '@/lib/errors/error-classes'

const repairTableSchema = z.object({
  tableName: z.string().min(1).max(100),
  issueCategory: z.string().min(1).max(100),
})

/* ── POST /api/ops/db/repair ────────────────────────────────── */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  try {
    const body = await request.json()
    const parsed = repairTableSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { tableName, issueCategory } = parsed.data

    const { data, error } = await repairTable(supabase, {
      p_table_name: tableName,
      p_issue_category: issueCategory,
    })

    if (error) throw new DatabaseError(error.message)

    return NextResponse.json({
      success: true,
      data: data ?? { affectedRows: 0 },
    })
  } catch (err) {
    if (err instanceof DatabaseError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
