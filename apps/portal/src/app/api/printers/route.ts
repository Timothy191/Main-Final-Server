import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
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
    const { data, error } = await supabase
      .from('card_printers')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ printers: data ?? [] })
  } catch (error) {
    serverLogger().error('Failed to list printers:', error)
    return NextResponse.json({ error: 'Failed to list printers', printers: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { cups_name, name, model, connection_type, vendor_id, product_id, device_path } = body

    if (!cups_name || !name) {
      return NextResponse.json({ error: 'cups_name and name are required' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('card_printers')
      .insert({
        cups_name,
        name,
        model: model ?? 'Neo Magic 300',
        connection_type: connection_type ?? 'usb',
        vendor_id: vendor_id ?? null,
        product_id: product_id ?? null,
        device_path: device_path ?? null,
        status: 'online',
        last_online_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A printer with this CUPS name is already registered' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ printer: data }, { status: 201 })
  } catch (error) {
    serverLogger().error('Failed to register printer:', error)
    return NextResponse.json({ error: 'Failed to register printer' }, { status: 500 })
  }
}
