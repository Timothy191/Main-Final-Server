import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { detectAllPrinters } from '@/app/(departments)/access-card-actions/lib/printer-detection'
import { serverLogger } from '@repo/logger'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access_control or admin role
    const { data: employee } = await supabase
      .from('employees')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (!employee || !['admin', 'access_control'].includes(employee.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Detect all printers via CUPS + USB
    const detected = await detectAllPrinters()

    // 2. Fetch already-registered printers from DB
    const { data: registered } = await supabase
      .from('card_printers')
      .select('cups_name, id')
      .is('deleted_at', null)

    const registeredNames = new Set((registered ?? []).map((r) => r.cups_name))

    // 3. Mark each detected printer as new or existing
    const results = detected.map((printer) => ({
      ...printer,
      isRegistered: registeredNames.has(printer.cupsName),
      dbId: registered?.find((r) => r.cups_name === printer.cupsName)?.id ?? null,
    }))

    return NextResponse.json({ printers: results, count: results.length })
  } catch (error) {
    serverLogger().error('Printer scan failed:', error)
    return NextResponse.json(
      { error: 'Failed to scan printers', printers: [], count: 0 },
      { status: 500 }
    )
  }
}
