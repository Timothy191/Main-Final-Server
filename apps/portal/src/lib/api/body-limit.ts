import { NextResponse } from 'next/server'

export async function withBodyLimit(
  request: Request,
  handler: () => Promise<NextResponse>,
  options: { maxSize?: number } = {}
): Promise<NextResponse> {
  const maxSize = options.maxSize ?? 1024 * 1024 // 1 MB default
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }
  return handler()
}
