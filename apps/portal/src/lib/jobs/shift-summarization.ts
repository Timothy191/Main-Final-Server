/**
 * Inngest Job: Shift Auto-Summarization
 *
 * Generates a concise AI summary of shift log data using Gemini's Interactions API.
 * Triggered after shift closeout or on-demand via admin panel.
 *
 * @see https://ai.google.dev/gemini-api/docs/interactions-overview
 */

import type { InngestFunction } from 'inngest'
import { inngest, aiShiftSummarizeEvent } from '@repo/utils/inngest'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'

export const shiftSummarizeFn = inngest.createFunction(
  {
    id: 'shift-summarize',
    triggers: [{ event: aiShiftSummarizeEvent }],
  },
  async ({ event }) => {
    const { shiftId, departmentId, logEntries } = event.data
    const start = performance.now()
    let success = true

    try {
      // 1. Fetch shift logs from DB if not provided in event
      const supabase = await createServerSupabaseClient()
      let entries = logEntries as string[] | undefined

      if (!entries || entries.length === 0) {
        const { data: logs } = await supabase
          .from('control_room_logs')
          .select('content, created_at')
          .eq('shift_id', shiftId)
          .order('created_at', { ascending: true })

        entries = logs?.map((l) => l.content as string) ?? []
      }

      if (entries.length === 0) {
        return { success: true, summary: 'No log entries to summarize.' }
      }

      // 2. Generate summary via Gemini
      const { geminiChat } = await import('@/lib/ai/gemini-client')

      const logText = entries.map((e, i) => `${i + 1}. ${e}`).join('\n')

      const result = await geminiChat(
        `Summarize the following shift log entries into a concise operational summary. Include:
- Key activities and events
- Any issues or incidents
- Machine/equipment status changes
- Safety observations
- Recommendations for next shift

Shift logs:
${logText}`,
        {
          systemInstruction:
            'You are an operations summarizer for an oil & gas field portal. Be concise, factual, and focus on actionable information. Format as bullet points.',
          store: false,
        }
      )

      // 3. Store summary
      const { error } = await supabase.from('generated_reports').insert({
        report_type: 'shift_summary',
        report_data: {
          shift_id: shiftId,
          department_id: departmentId,
          summary: result.text,
          entry_count: entries.length,
          model: result.model,
          generated_at: new Date().toISOString(),
        },
      })

      if (error) {
        logError(new Error(`Failed to store shift summary: ${error.message}`), {
          context: 'shift_summarize_job',
          shiftId,
        })
      }

      return {
        success: true,
        summary: result.text,
        entryCount: entries.length,
        model: result.model,
      }
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'shift_summarize_job',
        shiftId,
        departmentId,
      })
      throw err
    } finally {
      recordJobExecution('shift-summarize', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
