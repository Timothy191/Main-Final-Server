import { unstable_cache } from 'next/cache'

/**
 * Next.js unstable_cache wrapper for React Server Component reads.
 * Integrates directly with Next.js's Data Cache and supports tags-based
 * revalidation via revalidateTag().
 *
 * @param keyParts Unique cache keys to distinguish data queries
 * @param fn The async fetch operation to execute and cache
 * @param options Cache parameters including revalidate TTL and tags
 */
export function cachedRSC<T>(
  keyParts: string[],
  fn: () => Promise<T>,
  options?: {
    revalidate?: number
    tags?: string[]
  }
): Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate: options?.revalidate,
    tags: options?.tags,
  })()
}
