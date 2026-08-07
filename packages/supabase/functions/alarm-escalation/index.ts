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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // 1. Fetch active alarms
    const alarmsRes = await fetch(`${supabaseUrl}/rest/v1/alarm_events?status=eq.active`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!alarmsRes.ok) {
      throw new Error('Failed to fetch active alarms')
    }

    const activeAlarms = await alarmsRes.json()

    // 2. Fetch escalation policies
    const policiesRes = await fetch(`${supabaseUrl}/rest/v1/alarm_escalation_policy`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })

    if (!policiesRes.ok) {
      throw new Error('Failed to fetch escalation policies')
    }

    const policies = await policiesRes.json()
    const policyMap = new Map(policies.map((p: any) => [p.severity, p.delay_seconds]))

    const escalated: string[] = []

    for (const alarm of activeAlarms) {
      const delaySeconds = policyMap.get(alarm.severity) || 60
      const createdAt = new Date(alarm.created_at).getTime()
      const now = Date.now()
      const elapsedSeconds = (now - createdAt) / 1000

      if (elapsedSeconds > delaySeconds && !alarm.message.includes('ESCALATED')) {
        // Escalate the alarm by updating its message details
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/alarm_events?id=eq.${alarm.id}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            message: `${alarm.message} [ESCALATED - UNACKNOWLEDGED]`,
          }),
        })

        if (updateRes.ok) {
          escalated.push(alarm.id)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: activeAlarms.length,
        escalated,
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
