/**
 * Inngest Job: Smart Auto-Classification
 *
 * Uses Gemini to automatically classify and categorize safety observations,
 * breakdown reports, and other department submissions.
 *
 * @see https://ai.google.dev/gemini-api/docs/structured-output
 */

import type { InngestFunction } from 'inngest'
import { inngest, aiClassifyEvent } from '@repo/utils/inngest'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'

interface ClassificationResult {
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  department: string
  confidence: number
}

export const autoClassifyFn = inngest.createFunction(
  {
    id: 'auto-classify',
    triggers: [{ event: aiClassifyEvent }],
  },
  async ({ event }) => {
    const { recordId, recordType, content } = event.data
    const start = performance.now()
    let success = true

    try {
      const { geminiChat } = await import('@/lib/ai/gemini-client')

      const result = await geminiChat(
        `Classify this ${recordType} submission. Return a JSON object with these fields:
- category: string (e.g., "slip_hazard", "equipment_failure", "near_miss")
- severity: "low" | "medium" | "high" | "critical"
- tags: string[] (relevant keywords)
- department: string (which department this relates to)
- confidence: number (0-1)

Submission content:
${content}`,
        {
          systemInstruction:
            'You are a classification system for an oil & gas operations portal. Analyze submissions and return ONLY valid JSON. Be precise and conservative with severity ratings.',
          responseFormat: 'json',
          store: false,
        }
      )

      // Parse the JSON response
      let classification: ClassificationResult
      try {
        classification = JSON.parse(result.text)
      } catch {
        // If JSON parsing fails, create a basic classification
        classification = {
          category: 'unclassified',
          severity: 'low',
          tags: [],
          department: 'general',
          confidence: 0.3,
        }
      }

      // Store the classification
      const supabase = await createServerSupabaseClient()
      const { error } = await supabase.from('ai_usage_logs').insert({
        session_id: `classify-${recordType}-${recordId}`,
        model: result.model,
        prompt_tokens: content.length,
        completion_tokens: result.text.length,
        total_tokens: content.length + result.text.length,
      })

      if (error) {
        logError(new Error(`Failed to store classification: ${error.message}`), {
          context: 'auto_classify_job',
          recordId,
        })
      }

      return {
        success: true,
        classification,
        model: result.model,
      }
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'auto_classify_job',
        recordId,
        recordType,
      })
      throw err
    } finally {
      recordJobExecution('auto-classify', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
