#!/usr/bin/env npx tsx
/**
 * Embedding Backfill Script
 *
 * Re-embeds all existing memory_embeddings records using the configured
 * embedding provider (Gemini text-embedding-004 by default).
 *
 * Usage:
 *   npx tsx src/lib/ai/scripts/backfill-embeddings.ts [--batch-size=10] [--dry-run]
 *
 * @see https://ai.google.dev/api/embeddings
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const BATCH_SIZE = parseInt(
  process.argv.find((a) => a.startsWith('--batch-size='))?.split('=')[1] ?? '10',
  10
)
const DRY_RUN = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log(`\n🔄 Embedding Backfill — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`   Batch size: ${BATCH_SIZE}`)
  console.log(`   Provider: ${process.env.AI_EMBEDDING_PROVIDER ?? 'local'}`)
  console.log(`   Model: ${process.env.GEMINI_EMBEDDING_MODEL ?? 'text-embedding-004'}\n`)

  // Count total records
  const { count } = await supabase
    .from('memory_embeddings')
    .select('*', { count: 'exact', head: true })

  console.log(`   Total records: ${count ?? 0}\n`)

  if (!count || count === 0) {
    console.log('   No records to backfill. Done.')
    return
  }

  // Dynamic import to avoid module resolution issues
  const { getEmbedding } = await import('../embedding-provider')

  let offset = 0
  let processed = 0
  let failed = 0

  while (offset < count) {
    const { data: records, error } = await supabase
      .from('memory_embeddings')
      .select('id, content')
      .range(offset, offset + BATCH_SIZE - 1)

    if (error || !records) {
      console.error(`   ❌ Failed to fetch batch at offset ${offset}:`, error?.message)
      break
    }

    for (const record of records) {
      try {
        const { embedding, provider } = await getEmbedding(record.content)

        if (!DRY_RUN) {
          const { error: updateError } = await supabase
            .from('memory_embeddings')
            .update({ embedding: embedding as unknown as string })
            .eq('id', record.id)

          if (updateError) {
            console.error(`   ❌ Failed to update ${record.id}:`, updateError.message)
            failed++
            continue
          }
        }

        processed++
        process.stdout.write(`\r   ✅ ${processed}/${count} (${provider})`)
      } catch (err) {
        console.error(
          `\n   ❌ Failed to embed ${record.id}:`,
          err instanceof Error ? err.message : err
        )
        failed++
      }
    }

    offset += BATCH_SIZE
  }

  console.log(`\n\n   Done! Processed: ${processed}, Failed: ${failed}`)
}

main().catch(console.error)
