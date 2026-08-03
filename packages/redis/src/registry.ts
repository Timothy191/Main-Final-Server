/**
 * @module redis/registry
 * Cache category registry — defines TTL policies per logical cache domain.
 *
 * Use {@link buildCacheKey} to construct consistent namespaced cache keys
 * and {@link CACHE_TTL_REGISTRY} to look up the recommended L1/L2 TTLs.
 */

/**
 * Well-known cache category identifiers.
 * Each category maps to a predefined L1/L2 TTL pair in {@link CACHE_TTL_REGISTRY}.
 */
export const CacheCategory = {
  AUTH: "auth",
  METRICS: "metrics",
  SHIFT: "shift",
  AI_MEMORY: "ai_memory",
  DEPARTMENT: "dept",
  EQUIPMENT: "equipment",
} as const;

/** String literal union derived from {@link CacheCategory} values. */
// eslint-disable-next-line no-redeclare
export type CacheCategory = (typeof CacheCategory)[keyof typeof CacheCategory];

/** Per-category TTL configuration for L1 (memory) and L2 (Redis) cache layers. */
export interface CacheTtlConfig {
  l1Seconds: number;
  l2Seconds: number;
}

/** Default TTL registry — maps each {@link CacheCategory} to its L1/L2 TTL pair. */
export const CACHE_TTL_REGISTRY: Record<CacheCategory, CacheTtlConfig> = {
  [CacheCategory.AUTH]: { l1Seconds: 60, l2Seconds: 3600 },
  [CacheCategory.METRICS]: { l1Seconds: 15, l2Seconds: 300 },
  [CacheCategory.SHIFT]: { l1Seconds: 30, l2Seconds: 120 },
  [CacheCategory.AI_MEMORY]: { l1Seconds: 10, l2Seconds: 60 },
  [CacheCategory.DEPARTMENT]: { l1Seconds: 60, l2Seconds: 3600 },
  [CacheCategory.EQUIPMENT]: { l1Seconds: 30, l2Seconds: 300 },
};

/**
 * Build a namespaced cache key from a category and path parts.
 *
 * @example
 * ```ts
 * buildCacheKey("auth", "user", "123") // => "arch:auth:user:123"
 * ```
 */
export function buildCacheKey(
  category: CacheCategory,
  ...parts: (string | number | undefined)[]
): string {
  const clean = parts.filter((p): p is string | number => p !== undefined);
  return `arch:${category}:${clean.join(":")}`;
}
