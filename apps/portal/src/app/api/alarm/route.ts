import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@repo/supabase/server'
import { publishAlarm } from '@repo/redis'

export async function GET(_request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: alarms, error } = await supabase
      .from('alarm_events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ alarms })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { equipmentId, severity, message, value } = await request.json()

    if (!equipmentId || !severity || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Fetch department ID dynamically for control-room
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('slug', 'control-room')
      .single()

    const departmentId = dept?.id
    if (!departmentId) {
      return NextResponse.json({ error: 'Control room department not found' }, { status: 500 })
    }

    // Insert into alarm_events
    const { data: alarm, error } = await supabase
      .from('alarm_events')
      .insert({
        department_id: departmentId,
        equipment_id: equipmentId,
        severity,
        message,
        value,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Publish via Redis Pub/Sub for real-time dashboard notifications
    await publishAlarm({
      id: alarm.id,
      equipmentId: alarm.equipment_id,
      severity: alarm.severity as 'critical' | 'high' | 'warning',
      message: alarm.message,
      value: alarm.value ? Number(alarm.value) : undefined,
      timestamp: alarm.created_at,
    })

    return NextResponse.json({ success: true, alarm })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { alarmId, action, employeeId } = await request.json()

    if (!alarmId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    let updateFields: Record<string, unknown> = {}
    if (action === 'acknowledge') {
      updateFields = {
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: employeeId || null,
      }
    } else if (action === 'resolve') {
      updateFields = {
        status: 'resolved',
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: alarm, error } = await supabase
      .from('alarm_events')
      .update(updateFields)
      .eq('id', alarmId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, alarm })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
