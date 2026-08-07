import fs from 'fs'
import path from 'path'
import { geminiChat } from './gemini-client'
import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/env'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Safely parses LLM JSON outputs by stripping markdown blocks (e.g. ```json ... ```)
 */
function parseSafeJson<T>(text: string, fallback: T): T {
  try {
    const stripped = text
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim()
    return JSON.parse(stripped) as T
  } catch {
    return fallback
  }
}

// ---------------------------------------------------------------------------
// Node 1: Decision
// ---------------------------------------------------------------------------

async function decideRetrieval(
  query: string
): Promise<{ needsWiki: boolean; searchTerms: string[] }> {
  return Sentry.startSpan(
    { name: 'node: decideRetrieval', op: 'gen_ai.graph_rag.node' },
    async (span) => {
      const systemInstruction = `You are an AI router. Decide if the user's query requires looking up internal architectural rules, guidelines, or FUXA/Node-RED data from the company wiki.
If yes, extract 1-3 concise search terms.
Respond EXACTLY in this JSON format: {"needsWiki": boolean, "searchTerms": ["term1", "term2"]}`

      try {
        const result = await geminiChat(query, {
          systemInstruction,
          responseFormat: 'json',
        })

        const parsed = parseSafeJson(result.text, { needsWiki: false, searchTerms: [] })
        span.setAttribute('decision.needs_wiki', parsed.needsWiki)

        return {
          needsWiki: !!parsed.needsWiki,
          searchTerms: Array.isArray(parsed.searchTerms) ? parsed.searchTerms : [],
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { node: 'decideRetrieval' } })
        return { needsWiki: false, searchTerms: [] } // Fallback to parametric
      }
    }
  )
}

// ---------------------------------------------------------------------------
// Node 2: Retrieval (Local Markdown Search)
// ---------------------------------------------------------------------------

async function retrieveWiki(terms: string[]): Promise<string> {
  return Sentry.startSpan(
    { name: 'node: retrieveWiki', op: 'gen_ai.graph_rag.node' },
    async (span) => {
      if (terms.length === 0) return ''

      // Standardize path resolution from monorepo root
      const memoryDir = path.resolve(process.cwd(), '../../memory/antigravity-memory/long')

      try {
        try {
          await fs.promises.access(memoryDir)
        } catch {
          return '' // Directory does not exist
        }

        const files = await fs.promises.readdir(memoryDir)
        const mdFiles = files.filter((f) => f.endsWith('.md'))

        // Concurrently read all files (non-blocking)
        const fileContents = await Promise.all(
          mdFiles.map(async (file) => {
            const content = await fs.promises.readFile(path.join(memoryDir, file), 'utf-8')
            return { file, content, lowerContent: content.toLowerCase() }
          })
        )

        let context = ''
        for (const { file, content, lowerContent } of fileContents) {
          // Simple full-text heuristic: if the file contains any search term
          const matches = terms.some((term) => lowerContent.includes(term.toLowerCase()))
          if (matches) {
            context += `\n\n--- Source: ${file} ---\n${content.substring(0, 1500)}...` // limit chunk size
          }
        }

        span.setAttribute('retrieval.context_length', context.trim().length)
        return context.trim()
      } catch (err) {
        Sentry.captureException(err, { tags: { node: 'retrieveWiki' } })
        return ''
      }
    }
  )
}

// ---------------------------------------------------------------------------
// Node 3: Draft Generation
// ---------------------------------------------------------------------------

async function generateDraft(
  query: string,
  context: string,
  systemInstruction?: string
): Promise<string> {
  return Sentry.startSpan(
    { name: 'node: generateDraft', op: 'gen_ai.graph_rag.node' },
    async () => {
      const instruction = systemInstruction
        ? `${systemInstruction}\n\nUse the following wiki context to answer if relevant:\n${context}`
        : `Use the following wiki context to answer if relevant:\n${context}`

      const result = await geminiChat(query, { systemInstruction: instruction })
      return result.text
    }
  )
}

// ---------------------------------------------------------------------------
// Node 4: Verification Loop
// ---------------------------------------------------------------------------

async function verifyAnswer(
  draft: string,
  context: string
): Promise<{ isAccurate: boolean; feedback: string }> {
  return Sentry.startSpan(
    { name: 'node: verifyAnswer', op: 'gen_ai.graph_rag.node' },
    async (span) => {
      const prompt = `Review this AI generated draft against the provided ground-truth wiki context.
Draft: """${draft}"""
Context: """${context}"""

Is the draft factually accurate according to the context? Does it hallucinate?
Respond EXACTLY in this JSON format: {"isAccurate": boolean, "feedback": "string explaining what to fix or 'All good'"}`

      try {
        const result = await geminiChat(prompt, { responseFormat: 'json' })
        const parsed = parseSafeJson(result.text, { isAccurate: true, feedback: '' })

        span.setAttribute('verification.is_accurate', !!parsed.isAccurate)

        return {
          isAccurate: !!parsed.isAccurate,
          feedback: parsed.feedback || '',
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { node: 'verifyAnswer' } })
        return { isAccurate: true, feedback: '' } // Fallback to accepting the draft
      }
    }
  )
}

// ---------------------------------------------------------------------------
// Graph RAG Execution Engine
// ---------------------------------------------------------------------------

export async function executeGraphRagFlow(
  query: string,
  systemInstruction?: string
): Promise<{ text: string; interactionId: string | null; model: string }> {
  return Sentry.startSpan(
    { name: 'pipeline: executeGraphRagFlow', op: 'gen_ai.graph_rag.pipeline' },
    async (span) => {
      // Step 1: Decide
      const decision = await decideRetrieval(query)
      span.setAttribute('pipeline.needs_wiki', decision.needsWiki)

      if (!decision.needsWiki) {
        // Parametric shortcut
        return geminiChat(query, { systemInstruction })
      }

      // Step 2: Retrieve
      const context = await retrieveWiki(decision.searchTerms)

      if (!context) {
        return geminiChat(query, { systemInstruction }) // No docs found
      }

      // Step 3: Draft
      const answer = await generateDraft(query, context, systemInstruction)

      // Step 4: Verify
      const verification = await verifyAnswer(answer, context)
      span.setAttribute('pipeline.is_accurate', verification.isAccurate)

      // Step 5: Self-Correcting Loop (1 retry max for latency)
      if (!verification.isAccurate) {
        return Sentry.startSpan(
          { name: 'node: correctDraft', op: 'gen_ai.graph_rag.node' },
          async () => {
            const correctionInstruction = `You provided an inaccurate draft. Fix it based on this feedback: ${verification.feedback}\n\nContext:\n${context}`
            const correction = await geminiChat(query, { systemInstruction: correctionInstruction })

            return {
              text: correction.text,
              interactionId: null, // Stateless
              model: env.GEMINI_MODEL || 'gemini-3.6-flash',
            }
          }
        )
      }

      return {
        text: answer,
        interactionId: null, // Stateless
        model: env.GEMINI_MODEL || 'gemini-3.6-flash',
      }
    }
  )
}
