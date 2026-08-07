/**
 * POST /api/ai/chat
 *
 * Gemini-powered chat endpoint for the Arch Systems portal.
 * Uses the Interactions API (GA June 2026) for single-turn or multi-turn conversations.
 *
 * Request body:
 *   { message: string, systemInstruction?: string, previousInteractionId?: string }
 *
 * Response:
 *   { text: string, interactionId: string | null, model: string }
 *
 * @see https://ai.google.dev/gemini-api/docs/interactions-overview
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { requireAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit-middleware'
import { logError } from '@/lib/errors/error-logger'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(8000, 'Message too long'),
  systemInstruction: z.string().max(4000).optional(),
  previousInteractionId: z.string().optional(),
})

type ChatRequest = z.infer<typeof ChatRequestSchema>

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handleChat(request: NextRequest): Promise<NextResponse> {
  // 1. Auth check
  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  // ── Sentry Agent Tracing — identify user in Conversations view ──────
  Sentry.setUser({ id: auth.user.id })

  // 2. Parse & validate body
  let body: ChatRequest
  try {
    const raw = await request.json()
    const parsed = ChatRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // 3. Check Gemini is configured
  const { env } = await import('@/lib/env')
  if (!env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  // 4. Call Gemini Graph RAG Flow
  try {
    const { executeGraphRagFlow } = await import('@/lib/ai/graph-rag')

    const result = await executeGraphRagFlow(body.message, body.systemInstruction)

    // 5. Log usage (fire-and-forget)
    try {
      const supabase = auth.supabase
      await supabase.from('ai_usage_logs').insert({
        session_id: `chat-${auth.user.id}-${Date.now()}`,
        user_id: auth.user.id,
        model: result.model,
        prompt_tokens: body.message.length, // approximate
        completion_tokens: result.text.length, // approximate
        total_tokens: body.message.length + result.text.length,
      })
    } catch {
      // Non-critical — don't fail the request
    }

    return NextResponse.json({
      text: result.text,
      interactionId: result.interactionId,
      model: result.model,
    })
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: 'ai_chat_endpoint',
      userId: auth.user.id,
    })

    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('not configured') ? 503 : 500

    return NextResponse.json({ error: message }, { status })
  }
}

// ---------------------------------------------------------------------------
// Export with rate limiting
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  return withRateLimit(request, () => handleChat(request))
}
