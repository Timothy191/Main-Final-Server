// withCache is a no-op passthrough — Redis-backed caching is handled by @repo/redis
// directly via cacheWrap() in server components and API routes.
export function withCache<T>(fn: () => T, _options?: unknown): T {
  return fn()
}
