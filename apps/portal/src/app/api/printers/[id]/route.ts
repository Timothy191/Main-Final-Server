import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { serverLogger } from '@repo/logger'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Soft delete
    const { error } = await supabase
      .from('card_printers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    serverLogger().error('Failed to delete printer:', error)
    return NextResponse.json({ error: 'Failed to delete printer' }, { status: 500 })
  }
}
