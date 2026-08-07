import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: logs, error } = await supabase
      .from('operator_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { operatorName, message } = await request.json()

    if (!operatorName || !message) {
      return NextResponse.json({ error: 'Missing operatorName or message' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Get department ID dynamically for control-room
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('slug', 'control-room')
      .single()

    const departmentId = dept?.id
    if (!departmentId) {
      return NextResponse.json({ error: 'Control room department not found' }, { status: 500 })
    }

    const { data: log, error } = await supabase
      .from('operator_logs')
      .insert({
        department_id: departmentId,
        operator_name: operatorName,
        message,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, log })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
