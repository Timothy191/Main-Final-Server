import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'portal',
})

// Event names as string constants for use in trigger definitions
export const syncPlaybackEvent = 'sync/playback' as const
export const generateReportEvent = 'report/generate' as const
export const aiGenerateEmbeddingEvent = 'ai/generate-embedding' as const
export const aiMemoryPersistEvent = 'ai/memory-persist' as const
export const aiShiftSummarizeEvent = 'ai/shift-summarize' as const
export const aiClassifyEvent = 'ai/classify-submission' as const

/** Default Inngest exponential backoff retry configuration for background tasks */
export const defaultJobRetryConfig = {
  attempts: 5,
  minTimeout: 1000,
  maxTimeout: 300000,
} as const

/** Dead-letter queue logger & auto-replay metadata helper */
export function handleJobFailureToDLQ(eventName: string, payload: unknown, error: unknown) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[DLQ] Background job failure logged for replay: ${eventName}`, {
      payload,
      error: error instanceof Error ? error.message : String(error),
      failedAt: new Date().toISOString(),
    })
  }
}
