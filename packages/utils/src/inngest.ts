import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'portal',
})

// Event names as string constants for use in trigger definitions
export const syncPlaybackEvent = 'sync/playback' as const
export const generateReportEvent = 'report/generate' as const
export const aiGenerateEmbeddingEvent = 'ai/generate-embedding' as const
export const aiMemoryPersistEvent = 'ai/memory-persist' as const
