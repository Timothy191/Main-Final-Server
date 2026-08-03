import { trace, Span, SpanStatusCode } from '@opentelemetry/api'

/**
 * Wrap a function in an OpenTelemetry span.
 *
 * Usage:
 * ```ts
 * const result = await withSpan("ai.llm.generate", async () => {
 *   return await streamText({ model, system, messages });
 * }, { provider: "groq", model: "llama-3.1-8b-instant" });
 * ```
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = trace.getTracer('arch-portal')
  return tracer.startActiveSpan(name, async (span: Span) => {
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value)
      })
    }
    try {
      const result = await fn()
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      })
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  })
}
