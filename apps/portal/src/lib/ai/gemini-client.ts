/**
 * Gemini API Client — Interactions API (GA June 2026) + Sentry Agent Tracing
 *
 * Centralized client for all Gemini API interactions in the portal.
 * Uses the recommended Interactions API (`client.interactions.create()`)
 * instead of the legacy `generateContent` API.
 *
 * Integrates with Sentry Agent Tracing for observability:
 * - Tracks token usage, latency, and errors per AI call
 * - Groups multi-turn conversations via `setConversationId()`
 * - Identifies users in Sentry Conversations view
 *
 * @see https://ai.google.dev/gemini-api/docs/interactions-overview
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/agent-tracing/
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/google-genai/
 */

import { GoogleGenAI } from '@google/genai'
import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/env'

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

let _client: GoogleGenAI | null = null

/**
 * Returns a singleton GoogleGenAI client configured with the portal's API key.
 * Returns null if no GEMINI_API_KEY is configured.
 */
export function getGeminiClient(): GoogleGenAI | null {
  if (!env.GEMINI_API_KEY) return null
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
  }
  return _client
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeminiChatOptions {
  /** System instruction prepended to the conversation. */
  systemInstruction?: string
  /** Model override — defaults to env.GEMINI_MODEL (gemini-3.6-flash). */
  model?: string
  /** Previous interaction ID for multi-turn server-side state. */
  previousInteractionId?: string
  /** Whether to store the interaction (default: false for stateless portal calls). */
  store?: boolean
  /** Response format constraint — 'json' for structured output. */
  responseFormat?: 'json' | 'text'
}

export interface GeminiChatResult {
  /** The generated text output. */
  text: string
  /** The interaction ID — save this for multi-turn follow-ups. */
  interactionId: string | null
  /** Model used for generation. */
  model: string
}

// ---------------------------------------------------------------------------
// Chat (Interactions API)
// ---------------------------------------------------------------------------

/**
 * Generate a single-turn response using the Gemini Interactions API.
 * Automatically instruments Sentry Agent Tracing spans for observability.
 *
 * @example
 * ```ts
 * const result = await geminiChat('Summarize today\'s shift logs')
 * console.log(result.text)
 * ```
 */
export async function geminiChat(
  input: string,
  options: GeminiChatOptions = {}
): Promise<GeminiChatResult> {
  const client = getGeminiClient()
  if (!client) {
    throw new Error('Gemini API not configured — set GEMINI_API_KEY in .env.local')
  }

  const model = options.model ?? env.GEMINI_MODEL
  const store = options.store ?? false

  // ── Sentry Agent Tracing ─────────────────────────────────────────────
  const conversationId = options.previousInteractionId ?? `conv-${Date.now()}`

  return Sentry.startSpan(
    {
      name: `gemini.interactions.create`,
      op: 'gen_ai.create_interaction',
      attributes: {
        'gen_ai.system': 'google',
        'gen_ai.request.model': model,
        'gen_ai.request.max_tokens': 8192,
        'gen_ai.conversation.id': conversationId,
      },
    },
    async (span) => {
      const startTime = performance.now()

      try {
        const interaction = await client.interactions.create({
          model,
          input,
          ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
          ...(options.previousInteractionId
            ? { previousInteractionId: options.previousInteractionId }
            : {}),
          ...(options.responseFormat ? { responseFormat: options.responseFormat } : {}),
          store,
        })

        // Extract text from the last model_output step
        const steps = interaction.steps ?? []
        const lastOutput = steps
          .filter((s: { type: string }) => s.type === 'model_output')
          .pop() as { content?: Array<{ text?: string }> } | undefined

        const text = lastOutput?.content?.[0]?.text ?? ''
        const latencyMs = performance.now() - startTime

        // ── Sentry attributes ───────────────────────────────────────────
        span.setAttributes({
          'gen_ai.response.model': model,
          'gen_ai.usage.input_tokens': input.length, // approximate
          'gen_ai.usage.output_tokens': text.length, // approximate
          'gen_ai.response.latency_ms': latencyMs,
        })

        // ── Sentry logger ──────────────────────────────────────────────
        Sentry.logger.info('Gemini interaction completed', {
          model,
          inputLength: input.length,
          outputLength: text.length,
          latencyMs: Math.round(latencyMs),
          conversationId,
        })

        return {
          text,
          interactionId: (interaction as { id?: string }).id ?? null,
          model,
        }
      } catch (err) {
        // ── Sentry error capture ──────────────────────────────────────
        span.setStatus({ code: 2, message: 'INTERNAL_ERROR' })
        Sentry.captureException(err, {
          tags: { ai_provider: 'gemini', ai_model: model },
          extra: { conversationId, inputLength: input.length },
        })
        throw err
      }
    }
  )
}

// ---------------------------------------------------------------------------
// Embeddings (native Gemini)
// ---------------------------------------------------------------------------

export interface GeminiEmbeddingResult {
  embedding: number[]
  provider: 'gemini'
  model: string
}

/**
 * Generate a single embedding vector using Gemini's native embedding API.
 * Uses `text-embedding-004` by default (768 dimensions).
 *
 * @see https://ai.google.dev/api/embeddings
 */
export async function geminiEmbedSingle(text: string): Promise<GeminiEmbeddingResult> {
  const client = getGeminiClient()
  if (!client) {
    throw new Error('Gemini API not configured — set GEMINI_API_KEY in .env.local')
  }

  const model = env.GEMINI_EMBEDDING_MODEL

  const response = await client.models.embedContent({
    model,
    contents: text,
  })

  const values = response.embeddings?.[0]?.values
  if (!values || values.length === 0) {
    throw new Error(`Gemini embedding returned empty result for model ${model}`)
  }

  return { embedding: values, provider: 'gemini', model }
}

/**
 * Generate embeddings for a batch of texts using Gemini's native embedding API.
 * Processes sequentially to respect rate limits.
 */
export async function geminiEmbedBatch(texts: string[]): Promise<GeminiEmbeddingResult[]> {
  const results: GeminiEmbeddingResult[] = []
  for (const text of texts) {
    results.push(await geminiEmbedSingle(text))
  }
  return results
}
