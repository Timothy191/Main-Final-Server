import { serve } from 'https://deno.land/x/sift@0.2.1/serve.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { equipmentId, host, port, registers } = await req.json()

    if (!equipmentId || !host || !port) {
      throw new Error('Missing equipmentId, host, or port')
    }

    // Retrieve Supabase config dynamically
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Query department ID dynamically for control-room
    const deptRes = await fetch(
      `${supabaseUrl}/rest/v1/departments?slug=eq.control-room&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!deptRes.ok) {
      throw new Error('Failed to retrieve control-room department ID')
    }

    const depts = await deptRes.json()
    const departmentId = depts?.[0]?.id

    if (!departmentId) {
      throw new Error('Control room department not found')
    }

    // Simulate Modbus TCP reading of registers
    let telemetryRegisters: Record<number, number> = {}
    if (registers && Array.isArray(registers)) {
      registers.forEach((addr: number) => {
        if (addr === 30001) {
          // Hydraulic Temp
          telemetryRegisters[addr] = Math.round(70 + Math.random() * 20)
        } else if (addr === 30002) {
          // Fuel level
          telemetryRegisters[addr] = Math.round(10 + Math.random() * 80)
        } else if (addr === 30003) {
          // Hydraulic pressure
          telemetryRegisters[addr] = Math.round(100 + Math.random() * 50)
        } else {
          telemetryRegisters[addr] = Math.round(Math.random() * 100)
        }
      })
    } else {
      // Default standard registers: 30001 (Temp), 30002 (Fuel), 30003 (Pressure)
      telemetryRegisters = {
        30001: Math.round(70 + Math.random() * 20),
        30002: Math.round(10 + Math.random() * 80),
        30003: Math.round(100 + Math.random() * 50),
      }
    }

    // Write to modbus_telemetry
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/modbus_telemetry`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        department_id: departmentId,
        equipment_id: equipmentId,
        registers: telemetryRegisters,
        status: 'connected',
      }),
    })

    if (!dbResponse.ok) {
      const errText = await dbResponse.text()
      throw new Error(`Failed to write telemetry to database: ${errText}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        equipmentId,
        registers: telemetryRegisters,
        status: 'connected',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
