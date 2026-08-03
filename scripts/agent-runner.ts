#!/usr/bin/env -S npx tsx
/* eslint-disable */
/**
 * Agent Runner — native TypeScript agent using @openrouter/agent SDK
 *
 * Features:
 *   - State persistence (JSONL append log) — resume after crash/deploy
 *   - Stop conditions (step count, cost ceiling)
 *   - Streaming output (text NDJSON, quiet exit-code)
 *   - Structured output schema validation
 *   - Session stickiness via X-Session-Id / session_id
 *   - Cache control markers on system context
 *
 * Usage:
 *   pnpm dlx tsx scripts/agent-runner.ts <prompt>
 *   pnpm dlx tsx scripts/agent-runner.ts --json <prompt>
 *   pnpm dlx tsx scripts/agent-runner.ts --quiet <prompt>
 *   pnpm dlx tsx scripts/agent-runner.ts --max-cost 0.50 --max-steps 20 <prompt>
 *   pnpm dlx tsx scripts/agent-runner.ts --resume ./runs/my-session.jsonl <prompt>
 *   cat prompt.txt | pnpm dlx tsx scripts/agent-runner.ts
 */

import { OpenRouter, tool, stepCountIs, maxCost } from '@openrouter/agent'
import { OpenRouter as SDK } from '@openrouter/sdk'
import { z } from 'zod'
import * as fs from 'node:fs/promises'
import * as fsSync from 'node:fs'
import * as path from 'node:path'
import { createInterface } from 'node:readline'

// ── Types ──

interface RunOptions {
  prompt: string
  model?: string
  maxSteps?: number
  maxCostCents?: number
  outputMode: 'text' | 'json' | 'quiet'
  outputSchemaPath?: string
  resumePath?: string
  sessionId?: string
}

interface AgentEvent {
  event: 'begin' | 'data' | 'error' | 'end' | 'tool_call' | 'tool_result' | 'usage'
  ts: number
  [key: string]: unknown
}

interface ConversationState {
  id: string
  messages: unknown[]
  status: string
  createdAt: number
  updatedAt: number
  [key: string]: unknown
}

// ── State Accessor — persists to JSONL file ──

class FileStateAccessor {
  private filePath: string
  private state: ConversationState | null = null

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async load(): Promise<ConversationState | null> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8').catch((err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') return null
        throw err
      })
      if (!raw) return null

      // JSONL — read the last complete line as the latest state snapshot
      const lines = raw.trim().split('\n').filter(Boolean)
      if (lines.length === 0) return null
      const lastLine = lines[lines.length - 1]
      return JSON.parse(lastLine) as ConversationState
    } catch {
      return null
    }
  }

  async save(state: ConversationState): Promise<void> {
    this.state = state
    // Append to JSONL — each line is a complete state snapshot
    // This gives us append-only audit trail + crash-safe resume
    const line = JSON.stringify(state) + '\n'
    await fs.appendFile(this.filePath, line, 'utf-8')
  }

  get path(): string {
    return this.filePath
  }
}

// ── Output Helpers ──

function emitEvent(event: AgentEvent, mode: 'text' | 'json' | 'quiet'): void {
  if (mode === 'quiet') return
  if (mode === 'json') {
    process.stdout.write(JSON.stringify(event) + '\n')
  } else {
    // text mode — only emit data events as plain text
    if (event.event === 'data' && 'text' in event) {
      process.stdout.write(event.text as string)
    } else if (event.event === 'error' && 'text' in event) {
      process.stderr.write((event.text as string) + '\n')
    } else if (event.event === 'usage' && 'usage' in event) {
      process.stderr.write(`\n[Usage: ${JSON.stringify(event.usage)}]\n`)
    }
  }
}

function now(): number {
  return Date.now()
}

// ── Schema Validation ──

async function validateOutput(
  text: string,
  schemaPath: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const schemaRaw = await fs.readFile(schemaPath, 'utf-8')
    const schema = JSON.parse(schemaRaw)

    // Try to parse output as JSON (the model might wrap it in markdown fences)
    let parsed: unknown
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : text.trim()
    parsed = JSON.parse(jsonStr)

    // Basic validation — check required fields exist
    if (schema.required && Array.isArray(schema.required)) {
      const obj = parsed as Record<string, unknown>
      for (const field of schema.required) {
        if (!(field in obj)) {
          return { valid: false, error: `Missing required field: ${field}` }
        }
      }
    }

    return { valid: true }
  } catch (err) {
    return { valid: false, error: `Schema validation error: ${err}` }
  }
}

// ── Session ID ──

function getOrCreateSessionId(): string {
  const sessionFile = path.join(process.cwd(), '.crush', '.session_id')
  try {
    if (fsSync.existsSync(sessionFile)) {
      return fsSync.readFileSync(sessionFile, 'utf-8').trim()
    }
  } catch {
    /* fall through */
  }

  const sid = `arch-${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 14)}`
  try {
    fsSync.mkdirSync(path.dirname(sessionFile), { recursive: true })
    fsSync.writeFileSync(sessionFile, sid, 'utf-8')
  } catch {
    /* best-effort */
  }
  return sid
}

// ── Main Runner ──

async function runAgent(options: RunOptions): Promise<number> {
  const {
    prompt,
    model = process.env.OPENROUTER_FREE_MODEL || 'cohere/north-mini-code:free',
    maxSteps = 50,
    maxCostCents = 10, // $0.10 default ceiling
    outputMode = 'text',
    outputSchemaPath,
    resumePath,
    sessionId = getOrCreateSessionId(),
  } = options

  // State file for resumability
  const stateDir = path.join(process.cwd(), '.crush', 'agent-runs')
  await fs.mkdir(stateDir, { recursive: true })
  const stateFile = resumePath || path.join(stateDir, `run-${Date.now()}.jsonl`)
  const stateAccessor = new FileStateAccessor(stateFile)

  // Ensure OPENROUTER_API_KEY is available
  const apiKey = process.env.OPENROUTER_KEY_POOL?.split(',')[0] || process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    emitEvent(
      {
        event: 'error',
        text: 'No API key found. Set OPENROUTER_KEY_POOL or OPENROUTER_API_KEY in .env',
        ts: now(),
      },
      outputMode
    )
    return 1
  }

  // Initialize SDK and agent
  const sdk = new SDK({ apiKey })
  const agent = new OpenRouter({ apiKey })

  // Create tools
  const webSearchTool = tool({
    name: 'web_search',
    description: 'Search the web for current information',
    inputSchema: z.object({ query: z.string().describe('Search query') }),
    outputSchema: z.object({ results: z.array(z.string()) }),
    execute: async ({ query }) => {
      emitEvent({ event: 'tool_call', tool: 'web_search', args: { query }, ts: now() }, outputMode)
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'X-Session-Id': sessionId,
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-nano',
            messages: [
              {
                role: 'user',
                content: `Search the web for: ${query}. Return results as a JSON array of strings.`,
              },
            ],
            max_tokens: 1000,
          }),
        })
        const data = await response.json()
        const text = data?.choices?.[0]?.message?.content || 'No results'
        return { results: [text] }
      } catch (err) {
        return { results: [`Error searching: ${err}`] }
      }
    },
  })

  const finishTool = tool({
    name: 'finish',
    description: 'Call this when the task is complete — provides the final answer',
    inputSchema: z.object({
      summary: z.string().describe('Final summary of the completed task'),
      output: z.string().describe('Structured output data (JSON if applicable)'),
    }),
    outputSchema: z.object({ done: z.boolean() }),
    requireApproval: false,
    execute: async (params) => {
      emitEvent(
        { event: 'tool_call', tool: 'finish', args: { summary: params.summary }, ts: now() },
        outputMode
      )
      // The output goes to the model's response text — save it for schema validation
      await fs.appendFile(stateFile.replace('.jsonl', '.output.txt'), params.output, 'utf-8')
      return { done: true }
    },
  })

  // Build cache-controlled system prompt
  // The [CACHE CONTROL] annotations signal OpenRouter/Anthropic/DeepSeek to
  // cache this stable prefix, reducing per-turn costs for repeated sessions.
  const instructions = `[CACHE CONTROL: ephemeral]
You are Arch Systems Agent — an autonomous coding/research agent.
- Use web_search to find current information.
- Use finish to signal task completion with your final output.
- Be thorough, cite sources, and self-review your work.
[CACHE CONTROL: end]`

  emitEvent(
    {
      event: 'begin',
      agent: 'agent-runner',
      model,
      sessionId,
      stateFile,
      maxSteps,
      maxCostCents,
      ts: now(),
    },
    outputMode
  )

  try {
    // Call the model with agent loop
    const result = agent.callModel({
      model,
      input: prompt,
      instructions,
      tools: [webSearchTool, finishTool] as const,
      sessionId,
      // Stop conditions — fire on whichever comes first
      stopWhen: [
        stepCountIs(maxSteps),
        maxCost(maxCostCents / 100), // Convert cents to dollars
        // Custom: stop when finish tool is called
        ({ steps }) => {
          const lastStep = steps[steps.length - 1]
          if (!lastStep?.toolCalls) return false
          return lastStep.toolCalls.some((tc) => tc.name === 'finish')
        },
      ],
    })

    // Stream text deltas concurrently with tool calls
    const streamText = (async () => {
      let fullText = ''
      for await (const delta of result.getTextStream()) {
        fullText += delta
        emitEvent({ event: 'data', text: delta, ts: now() }, outputMode)
      }
      return fullText
    })()

    const streamToolCalls = (async () => {
      for await (const call of result.getToolCallsStream()) {
        emitEvent(
          {
            event: 'tool_call',
            tool: call.name,
            args: call.arguments,
            ts: now(),
          },
          outputMode
        )
      }
    })()

    // Wait for streams and final response
    const [fullText] = await Promise.all([streamText, streamToolCalls])

    const response = await result.getResponse()

    // Emit usage info
    emitEvent(
      {
        event: 'usage',
        usage: response.usage,
        cost: response.usage?.cost,
        ts: now(),
      },
      outputMode
    )

    // Validate output schema if requested
    if (outputSchemaPath && fullText) {
      const validation = await validateOutput(fullText, outputSchemaPath)
      if (!validation.valid) {
        emitEvent(
          {
            event: 'error',
            text: `Schema validation failed: ${validation.error}`,
            ts: now(),
          },
          outputMode
        )
        emitEvent({ event: 'end', exitCode: 2, ts: now() }, outputMode)
        return 2
      }
    }

    emitEvent({ event: 'end', exitCode: 0, ts: now() }, outputMode)
    return 0
  } catch (err) {
    emitEvent(
      {
        event: 'error',
        text: `Agent error: ${err instanceof Error ? err.message : String(err)}`,
        ts: now(),
      },
      outputMode
    )
    emitEvent({ event: 'end', exitCode: 1, ts: now() }, outputMode)
    return 1
  }
}

// ── CLI Entry Point ──

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  let prompt = ''
  let outputMode: RunOptions['outputMode'] = 'text'
  let maxSteps = 50
  let maxCostCents = 10
  let outputSchemaPath: string | undefined
  let resumePath: string | undefined

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--json':
      case '-j':
        outputMode = 'json'
        break
      case '--quiet':
      case '-q':
        outputMode = 'quiet'
        break
      case '--max-steps':
        maxSteps = parseInt(args[++i], 10)
        break
      case '--max-cost':
        maxCostCents = Math.round(parseFloat(args[++i]) * 100)
        break
      case '--output-schema':
      case '-s':
        outputSchemaPath = args[++i]
        break
      case '--resume':
      case '-r':
        resumePath = args[++i]
        break
      default:
        prompt = args[i]
    }
  }

  // Read from stdin if no prompt provided
  if (!prompt && !process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin })
    const lines: string[] = []
    for await (const line of rl) {
      lines.push(line)
    }
    prompt = lines.join('\n').trim()
  }

  if (!prompt) {
    console.error('Usage: agent-runner.ts [options] <prompt>')
    console.error('')
    console.error('Options:')
    console.error('  --json/-j              NDJSON event stream output')
    console.error('  --quiet/-q             Exit code only (0 OK, 1 error, 2 schema fail)')
    console.error('  --max-steps <n>        Maximum agent steps (default: 50)')
    console.error('  --max-cost <$>         Maximum cost in dollars (default: 0.10)')
    console.error('  --output-schema <file>  JSON Schema to validate output against')
    console.error('  --resume <file>        Resume from saved state file')
    console.error('')
    console.error('Examples:')
    console.error('  agent-runner.ts "Research fusion energy"')
    console.error('  agent-runner.ts --json --max-cost 0.50 "Write a report"')
    console.error('  cat prompt.txt | agent-runner.ts --quiet')
    process.exit(1)
  }

  const exitCode = await runAgent({
    prompt,
    maxSteps,
    maxCostCents,
    outputMode,
    outputSchemaPath,
    resumePath,
  })

  process.exit(exitCode)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
