/**
 * @module redis/registry
 * Cache category registry — single source of truth for TTL policies and
 * category identifiers used across the entire @repo/redis API.
 *
 * Use {@link buildCacheKey} to construct consistent namespaced cache keys
 * and {@link CACHE_TTL_REGISTRY} to look up the recommended L1/L2 TTLs.
 *
 * AGENT-TRACE: Previously duplicated in index.ts — consolidated here so all
 * callers import from one authoritative location. index.ts re-exports from here.
 */

/**
 * Well-known cache category identifiers (merged from registry.ts + index.ts).
 * Each category maps to a predefined L1/L2 TTL pair in {@link CACHE_TTL_REGISTRY}.
 */
export const CacheCategory = {
  // Department-level categories
  ACCESS_CONTROL: 'access_control',
  CONTROL_ROOM: 'control_room',
  DRILLING: 'drilling',
  PRODUCTION: 'production',
  SAFETY: 'safety',
  SATELLITE: 'satellite',
  ENVIRONMENT: 'environment',
  LOGISTICS: 'logistics',
  GEOLOGY: 'geology',
  HUB: 'hub',
  TRAINING: 'training',
  DEPARTMENT: 'dept',
  EQUIPMENT: 'equipment',
  // System-level categories
  AUTH: 'auth',
  METRICS: 'metrics',
  SHIFT: 'shift',
  AI_MEMORY: 'ai_memory',
} as const

/** String literal union derived from {@link CacheCategory} values. */
// eslint-disable-next-line no-redeclare
export type CacheCategory = (typeof CacheCategory)[keyof typeof CacheCategory]

/** Per-category TTL configuration for L1 (memory) and L2 (Redis) cache layers. */
export interface CacheTtlConfig {
  l1Seconds: number
  l2Seconds: number
}

/**
 * Default TTL registry — maps each {@link CacheCategory} to its L1/L2 TTL pair.
 *
 * Guidelines:
 *  - L1 (in-memory): short (10–60s) — latency-sensitive hot path
 *  - L2 (Redis): longer (60s–1h) — cross-pod shared state
 */
export const CACHE_TTL_REGISTRY: Record<CacheCategory, CacheTtlConfig> = {
  [CacheCategory.AUTH]: { l1Seconds: 60, l2Seconds: 3600 },
  [CacheCategory.METRICS]: { l1Seconds: 15, l2Seconds: 300 },
  [CacheCategory.SHIFT]: { l1Seconds: 30, l2Seconds: 120 },
  [CacheCategory.AI_MEMORY]: { l1Seconds: 10, l2Seconds: 60 },
  [CacheCategory.DEPARTMENT]: { l1Seconds: 60, l2Seconds: 3600 },
  [CacheCategory.EQUIPMENT]: { l1Seconds: 30, l2Seconds: 300 },
  [CacheCategory.ACCESS_CONTROL]: { l1Seconds: 60, l2Seconds: 3600 },
  [CacheCategory.CONTROL_ROOM]: { l1Seconds: 15, l2Seconds: 300 },
  [CacheCategory.DRILLING]: { l1Seconds: 30, l2Seconds: 600 },
  [CacheCategory.PRODUCTION]: { l1Seconds: 30, l2Seconds: 600 },
  [CacheCategory.SAFETY]: { l1Seconds: 30, l2Seconds: 600 },
  [CacheCategory.SATELLITE]: { l1Seconds: 60, l2Seconds: 1800 },
  [CacheCategory.ENVIRONMENT]: { l1Seconds: 30, l2Seconds: 600 },
  [CacheCategory.LOGISTICS]: { l1Seconds: 30, l2Seconds: 600 },
  [CacheCategory.GEOLOGY]: { l1Seconds: 60, l2Seconds: 1800 },
  [CacheCategory.HUB]: { l1Seconds: 30, l2Seconds: 300 },
  [CacheCategory.TRAINING]: { l1Seconds: 60, l2Seconds: 1800 },
}

/**
 * Build a namespaced cache key from a category and path parts.
 *
 * @example
 * ```ts
 * buildCacheKey("auth", "user", "123") // => "arch:auth:user:123"
 * buildCacheKey(CacheCategory.DRILLING, "well", wellId)
 * ```
 */
export function buildCacheKey(
  category: CacheCategory,
  ...parts: (string | number | undefined)[]
): string {
  const clean = parts.filter((p): p is string | number => p !== undefined)
  return `arch:${category}:${clean.join(':')}`
}
