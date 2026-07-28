import type { NextRequest } from 'next/server'

/**
 * Validate that a mutating request originated from the configured app origin.
 *
 * In production this checks the Origin or Referer headers against
 * `NEXT_PUBLIC_APP_URL`.  When `NEXT_PUBLIC_APP_URL` is not set, the request
 * is allowed (useful for local testing and health probes).  In non-production
 * environments the check is skipped so that curl / direct API calls work.
 *
 * @returns `true` if the request passes origin validation, `false` otherwise.
 */
export function isValidRequestOrigin(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return true
  }

  let appOrigin: string
  try {
    appOrigin = new URL(appUrl).origin
  } catch {
    // Misconfigured app URL — fail closed.
    return false
  }

  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  const allowedOrigins = new Set([appOrigin])
  if (host) {
    allowedOrigins.add(`http://${host}`)
    allowedOrigins.add(`https://${host}`)
  }

  if (origin) {
    return allowedOrigins.has(origin)
  }

  if (referer) {
    try {
      return allowedOrigins.has(new URL(referer).origin)
    } catch {
      return false
    }
  }

  // Mutating requests must carry Origin or Referer in production.
  return false
}
