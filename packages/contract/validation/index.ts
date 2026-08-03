import { z } from 'zod'

/**
 * Wraps a request handler with Zod schema validation.
 * Parses the request body, validates against the schema, and passes
 * the validated data to the handler on success.
 * Uses standard Web API Response (framework-agnostic).
 *
 * @example
 * const handler = withValidation(schema, async (req, data) => {
 *   return Response.json({ ...data });
 * });
 */
export function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (req: Request, data: z.infer<T>) => Promise<Response>
) {
  return async (req: Request, _context?: unknown): Promise<Response> => {
    try {
      const body = await req.clone().json()
      const result = schema.safeParse(body)
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: 'Request body validation failed', details: result.error.issues }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return handler(req, result.data)
    } catch {
      return new Response(JSON.stringify({ error: 'Request body validation failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
