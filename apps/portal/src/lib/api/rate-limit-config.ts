/**
 * Rate limiting configuration for different API endpoint types
 */

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const RATE_LIMIT_CONFIGS = {
  // AI endpoints - most restrictive
  ai: {
    windowMs: 60_000, // 1 minute
    maxRequests: 30,
  } as RateLimitConfig,

  // Authentication endpoints - restrictive to prevent brute force
  auth: {
    windowMs: 15 * 60_000, // 15 minutes
    maxRequests: 10,
  } as RateLimitConfig,

  // Data export endpoints - moderate restriction
  export: {
    windowMs: 60_000, // 1 minute
    maxRequests: 20,
  } as RateLimitConfig,

  // Admin operations - moderate restriction
  admin: {
    windowMs: 60_000, // 1 minute
    maxRequests: 100,
  } as RateLimitConfig,

  // Webhook endpoints - higher limit for external services
  webhooks: {
    windowMs: 60_000, // 1 minute
    maxRequests: 200,
  } as RateLimitConfig,

  // General API endpoints - permissive default
  general: {
    windowMs: 60_000, // 1 minute
    maxRequests: 1000,
  } as RateLimitConfig,

  // Hardware API endpoints (c66) - very permissive for high-frequency data
  hardware: {
    windowMs: 60_000, // 1 minute
    maxRequests: 10000,
  } as RateLimitConfig,
} as const

type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS

/**
 * Determine rate limit type based on API route path
 */
function getRateLimitType(path: string): RateLimitType {
  if (path.startsWith('/api/ai/')) return 'ai'
  if (path.startsWith('/api/auth/') || path.includes('/login') || path.includes('/reset-password'))
    return 'auth'
  if (path.startsWith('/api/export/')) return 'export'
  if (path.startsWith('/api/admin/')) return 'admin'
  if (path.startsWith('/api/webhooks/')) return 'webhooks'
  if (path.startsWith('/api/c66')) return 'hardware'
  return 'general'
}

/**
 * Get rate limit configuration for a specific path
 */
export function getRateLimitConfig(path: string): RateLimitConfig {
  const type = getRateLimitType(path)
  return RATE_LIMIT_CONFIGS[type]
}
