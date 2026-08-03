import type { InngestFunction } from 'inngest'
import { inngest, aiGenerateEmbeddingEvent } from '@repo/utils/inngest'
import { createServerSupabaseClient } from '@repo/supabase/server'
import crypto from 'crypto'
import { getEmbedding, getBatchEmbeddings } from '@/lib/ai/embedding-provider'
import { logError } from '@/lib/errors/error-logger'
import { recordJobExecution } from '@/lib/observability/metrics'

async function generateEmbedding(text: string, userId: string): Promise<void> {
  const textHash = crypto.createHash('sha256').update(text).digest('hex')
  const { embedding } = await getEmbedding(text)

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('embedding_cache').insert({
    text_hash: textHash,
    user_id: userId,
    embedding: embedding,
  })

  if (error) {
    throw new Error(`Failed to insert embedding into cache: ${error.message}`)
  }
}

async function batchGenerateEmbeddings(texts: string[], userId: string): Promise<void> {
  if (texts.length === 0) return

  const results = await getBatchEmbeddings(texts)

  const rows = texts.map((text, i) => {
    const textHash = crypto.createHash('sha256').update(text).digest('hex')
    const result = results[i]
    if (!result?.embedding) {
      throw new Error(`No embedding generated for index ${i}`)
    }
    return {
      text_hash: textHash,
      user_id: userId,
      embedding: result.embedding,
    }
  })

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('embedding_cache').insert(rows)

  if (error) {
    throw new Error(`Failed to batch insert embeddings into cache: ${error.message}`)
  }
}

export const generateEmbeddingFn = inngest.createFunction(
  { id: 'generate-embedding', triggers: [{ event: aiGenerateEmbeddingEvent }] },
  async ({ event }) => {
    const { text, texts, userId } = event.data
    const start = performance.now()
    let success = true

    try {
      if (Array.isArray(texts)) {
        await batchGenerateEmbeddings(texts, userId)
      } else if (typeof text === 'string' && text.trim() !== '') {
        await generateEmbedding(text, userId)
      }
      return { success: true }
    } catch (err) {
      success = false
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: 'generate_embedding_job',
        userId,
        hasText: !!text,
        hasTexts: !!texts,
      })
      throw err
    } finally {
      recordJobExecution('generate-embedding', performance.now() - start, success)
    }
  }
) as unknown as InngestFunction.Any
