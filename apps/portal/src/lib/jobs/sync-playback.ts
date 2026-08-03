import type { InngestFunction } from 'inngest'
import { inngest } from '@repo/utils/inngest'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'
export const syncPlaybackFn = inngest.createFunction(
  { id: 'sync-playback', triggers: [{ event: 'sync/playback' }] },
  async ({ event }) => {
    const { idempotencyKey, actionType, payload, departmentId } = event.data
    const supabase = await createServerSupabaseClient()
    const start = performance.now()
    let success = true

    try {
      if (actionType === 'ADD_BREAKDOWN') {
        const { data: existing } = await supabase
          .from('breakdowns')
          .select('id')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle()

        if (existing) return { success: true, bypassed: true }

        const { error } = await supabase.from('breakdowns').insert({
          department_id: departmentId,
          fleet_id: payload.fleetId,
          machine_type: payload.machineType,
          date_in: payload.dateIn,
          time_in: payload.timeIn || '00:00',
          reason: payload.reason,
          status: 'active',
          idempotency_key: idempotencyKey,
          sync_status: 'synced',
        })

        if (error) throw error
        revalidatePath('/[department]/breakdowns', 'page')
        return { success: true }
      }

      if (actionType === 'RESOLVE_BREAKDOWN') {
        const { error } = await supabase
          .from('breakdowns')
          .update({
            status: 'completed',
            date_out: new Date().toISOString().split('T')[0],
            time_out: new Date().toLocaleTimeString('en-US', { hour12: false }),
            sync_status: 'synced',
          })
          .eq('id', payload.id)

        if (error) throw error
        revalidatePath('/[department]/breakdowns', 'page')
        return { success: true }
      }

      if (actionType === 'ADD_SAFETY_INCIDENT') {
        const { data: existing } = await supabase
          .from('safety_incidents')
          .select('id')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle()

        if (existing) return { success: true, bypassed: true }

        const { error } = await supabase.from('safety_incidents').insert({
          department_id: departmentId,
          incident_date: payload.incidentDate,
          shift_type: payload.shiftType,
          incident_type: payload.incidentType,
          description: payload.description,
          location: payload.location,
          status: 'open',
          idempotency_key: idempotencyKey,
          sync_status: 'synced',
        })

        if (error) throw error
        revalidatePath('/[department]/safety', 'page')
        return { success: true }
      }

      if (actionType === 'ADD_DAILY_LOG') {
        const { data: existing } = await supabase
          .from('daily_logs')
          .select('id')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle()

        if (existing) return { success: true, bypassed: true }

        const { error } = await supabase.from('daily_logs').insert({
          department_id: departmentId,
          log_date: payload.logDate,
          shift: payload.shift,
          notes: payload.notes,
          idempotency_key: idempotencyKey,
          sync_status: 'synced',
        })

        if (error) throw error
        revalidatePath('/[department]/daily-log', 'page')
        return { success: true }
      }

      return { error: `Unknown action type: ${actionType}` }
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'sync_playback_job',
        actionType,
        idempotencyKey,
      })
      throw err
    } finally {
      recordJobExecution('sync-playback', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
