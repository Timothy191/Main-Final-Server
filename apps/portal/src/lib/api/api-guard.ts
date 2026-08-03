import type { NextRequest } from 'next/server'
import { checkRateLimit } from './rate-limit-middleware'
import { checkSSRF } from './ssrf-guard'
import { AppError } from '@repo/errors'

export async function runApiGuards(req: NextRequest) {
  // 1. Rate Limit
  const config = { windowMs: 60000, maxRequests: 100 } // Default config
  const result = await checkRateLimit('api-guard-id', config, req.nextUrl.pathname)
  if (!result.allowed) {
    throw new AppError({
      code: 'RATE_LIMITED',
      message: 'Too Many Requests',
      status: 429,
    })
  }

  // 2. SSRF Guard
  const ssrfResult = checkSSRF(req.url)
  if (!ssrfResult.success) {
    throw new AppError({
      code: 'FORBIDDEN',
      message: 'Forbidden: SSRF attempt detected',
      status: 403,
    })
  }
}
