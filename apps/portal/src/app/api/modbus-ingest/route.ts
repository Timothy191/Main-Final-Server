import { NextResponse } from 'next/server'
import { getModbusManager } from '@/lib/modbus-client'
import { createServerSupabaseClient } from '@repo/supabase/server'

interface RegisterConfig {
  address: number
  count?: number
  name?: string
}

export async function POST(request: Request) {
  try {
    const { equipmentId, host, port, unitId, registers, interval } = await request.json()

    // Validate required fields
    if (!equipmentId || !host || !port || unitId === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: equipmentId, host, port, unitId' },
        { status: 400 }
      )
    }

    const manager = getModbusManager()

    // Configure connection
    const config = {
      host,
      port,
      unitId: Number(unitId),
      timeout: 25000,
      retryStrategy: {
        maxRetries: 10,
        baseDelay: 1000,
        maxDelay: 30000,
      },
    }

    // Connect to equipment
    const connected = await manager.connect(equipmentId, config)
    if (!connected) {
      return NextResponse.json({ error: 'Failed to establish Modbus connection' }, { status: 500 })
    }

    // If registers specified, start reading
    if (registers && Array.isArray(registers) && registers.length > 0) {
      const registerConfigs = registers.map((reg: RegisterConfig) => ({
        address: reg.address,
        count: reg.count || 1,
        name: reg.name || `reg_${reg.address}`,
      }))

      // Start periodic reading
      manager.startReading(
        equipmentId,
        registerConfigs,
        interval || 5000, // 5 second default interval
        (reading) => {
          // Store telemetry data (implemented in separate function)
          storeTelemetryData(reading)
        },
        (error) => {
          console.error('[Modbus] Reading error:', error)
          // Error handling is built into the manager
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Modbus connection established for ${equipmentId}`,
      equipmentId,
      config,
    })
  } catch (error) {
    console.error('[Modbus Ingest] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

async function storeTelemetryData(reading: {
  equipmentId: string
  timestamp: Date
  registers: Record<number, number>
  status: string
}) {
  try {
    const supabase = await createServerSupabaseClient()

    // Store in modbus_telemetry table
    const { error } = await supabase.from('modbus_telemetry').insert({
      equipment_id: reading.equipmentId,
      timestamp: reading.timestamp.toISOString(),
      registers: reading.registers,
      status: reading.status,
    })

    if (error) {
      console.error('[Modbus] Failed to store telemetry:', error)
    }
  } catch (error) {
    console.error('[Modbus] Storage error:', error)
  }
}

// Handle DELETE for disconnecting equipment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get('equipmentId')

    if (!equipmentId) {
      return NextResponse.json({ error: 'equipmentId parameter required' }, { status: 400 })
    }

    const manager = getModbusManager()
    await manager.disconnect(equipmentId)

    return NextResponse.json({
      success: true,
      message: `Disconnected from ${equipmentId}`,
    })
  } catch (error) {
    console.error('[Modbus Disconnect] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET for connection status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get('equipmentId')

    const manager = getModbusManager()

    if (equipmentId) {
      const status = manager.getStatus(equipmentId)
      if (!status) {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
      }
      return NextResponse.json({ equipmentId, ...status })
    } else {
      // Return all statuses
      const allStatuses = manager.getAllStatuses()
      return NextResponse.json({ connections: allStatuses })
    }
  } catch (error) {
    console.error('[Modbus Status] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
