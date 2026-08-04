import { serve } from 'inngest/next'
import { inngest } from '@repo/utils/inngest'
import { syncPlaybackFn } from '@/lib/jobs/sync-playback'
import { generateReportFn } from '@/lib/jobs/report-generation'
import { generateEmbeddingFn } from '@/lib/jobs/embedding-generation'
import { memoryPersistFn } from '@/lib/jobs/memory-persist'
import { shiftCompletenessCheckFn } from '@/lib/jobs/shift-completeness-check'
import { orphanedRecordDetectionFn } from '@/lib/jobs/orphaned-record-detection'
import { shiftIntegrityReportFn } from '@/lib/reports/shift-integrity'
import { automatedAuditFn } from '@/lib/jobs/automated-audit'
import { cacheCleanupFn } from '@/lib/jobs/cache-cleanup'
import { shiftSummarizeFn } from '@/lib/jobs/shift-summarization'
import { autoClassifyFn } from '@/lib/jobs/auto-classification'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncPlaybackFn,
    generateReportFn,
    generateEmbeddingFn,
    memoryPersistFn,
    shiftCompletenessCheckFn,
    orphanedRecordDetectionFn,
    shiftIntegrityReportFn,
    automatedAuditFn,
    cacheCleanupFn,
    shiftSummarizeFn,
    autoClassifyFn,
  ],
})
