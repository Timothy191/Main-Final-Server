import { NextResponse } from 'next/server'
import type { z } from 'zod'

export async function validateBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | NextResponse> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      const errorMsg = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(', ')
        .toLowerCase()
      return NextResponse.json(
        {
          error: `invalid request body: ${errorMsg}`,
          details: result.error.issues,
        },
        { status: 400 }
      )
    }
    return { data: result.data }
  } catch {
    return NextResponse.json({ error: 'invalid json in request body' }, { status: 400 })
  }
}
