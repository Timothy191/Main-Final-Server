import { NextResponse } from 'next/server'
import { createAdminClient } from '@repo/supabase/server'
import { publishAlarm } from '@repo/redis'

export async function POST(request: Request) {
  try {
    const { operatorId: _operatorId } = await request.json()

    const supabase = await createAdminClient()

    // 1. Get Control Room department
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('slug', 'control-room')
      .single()

    const departmentId = dept?.id
    if (!departmentId) {
      return NextResponse.json({ error: 'Control room department not found' }, { status: 500 })
    }

    // 2. Halt all modbus connections (set status to 'error')
    // In our migration, equipment_id is a foreign key on alarm_events.
    // So we first check if there are any connections.
    const { data: connections } = await supabase
      .from('modbus_connections')
      .select('equipment_id')
      .limit(1)

    const equipmentId = connections?.[0]?.equipment_id || null

    const { error: connError } = await supabase
      .from('modbus_connections')
      .update({ status: 'error' })
      .eq('department_id', departmentId)

    if (connError) {
      return NextResponse.json({ error: connError.message }, { status: 500 })
    }

    // 3. Log emergency stop alarm event
    if (equipmentId) {
      const { data: alarm, error: alarmError } = await supabase
        .from('alarm_events')
        .insert({
          department_id: departmentId,
          equipment_id: equipmentId,
          severity: 'critical',
          message: 'EMERGENCY STOP BUTTON PRESSED - ALL MACHINES HALTED!',
          value: 0,
          status: 'active',
        })
        .select()
        .single()

      if (alarmError) {
        return NextResponse.json({ error: alarmError.message }, { status: 500 })
      }

      // 4. Publish emergency alarm to Redis Pub/Sub
      await publishAlarm({
        id: alarm.id,
        equipmentId,
        severity: 'critical',
        message: alarm.message,
        value: 0,
        timestamp: alarm.created_at,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Emergency stop activated. All systems halted.',
    })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
