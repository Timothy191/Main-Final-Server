import type { InngestFunction } from 'inngest'
import { inngest, aiMemoryPersistEvent } from '@repo/utils/inngest'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'
/**
 * Durable fallback for saving assistant memory after a chat stream completes.
 *
 * Triggered when the primary `waitUntil` / fire-and-forget path is unable to
 * persist the assistant response (e.g., serverless runtime was terminated early).
 *
 * Strategy:
 *   1. Check if the assistant response was already stored (idempotency).
 *   2. If missing, query the memory_embeddings table for the last user message
 *      in this session — it should exist because `loadMemoryNode` stores it
 *      inline during graph execution.
 *   3. We can't reconstruct the assistant text (it was only in the stream), so
 *      we mark the conversation as "incomplete" — the next user request's
 *      `loadMemoryNode` will still retrieve the user message for context.
 */
export const memoryPersistFn = inngest.createFunction(
  {
    id: 'memory-persist',
    triggers: [{ event: aiMemoryPersistEvent }],
    concurrency: { limit: 5 },
  },
  async ({ event }) => {
    const { sessionId, userId, assistantResponseStored } = event.data
    const start = performance.now()
    let success = true

    try {
      // If already stored, nothing to do
      if (assistantResponseStored) {
        return { success: true, skipped: 'already_stored' }
      }

      const supabase = await createServerSupabaseClient()

      // Check the last memory entries to verify state
      const { data: recentMemories, error: queryError } = await supabase
        .from('memory_embeddings')
        .select('id, content, memory_type, created_at')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (queryError) {
        throw new Error(`Failed to query session memories: ${queryError.message}`)
      }

      // The user message was already stored by loadMemoryNode.
      // The assistant response is what we're recovering.
      const assistantMemories = recentMemories?.filter(
        (m) => m.memory_type === 'episodic' && m.content.startsWith('Assistant:')
      )

      if (!assistantMemories || assistantMemories.length === 0) {
        // Assistant response wasn't persisted — log a warning.
        // This is informational; the next user request will still have
        // the user message in context via loadMemoryNode.
        logError(
          new Error('Assistant response not persisted — stream may have been terminated early'),
          {
            context: 'memory_persist_job',
            sessionId,
            userId,
          }
        )
        return { success: true, recovered: false }
      }

      return {
        success: true,
        recovered: true,
        count: assistantMemories.length,
      }
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'memory_persist_job',
        sessionId,
        userId,
      })
      throw err
    } finally {
      recordJobExecution('memory-persist', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
