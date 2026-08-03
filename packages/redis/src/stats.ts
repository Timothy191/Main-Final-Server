/**
 * @module redis/stats
 * Cache statistics tracking — records hits, misses, latencies, and Redis errors.
 *
 * Stats are stored both in-process (for low-latency reads) and in Redis
 * (for cross-pod aggregation under `stats:cache` and `stats:latencies`).
 */

import { getRedisClient, getClientIfOpen } from "@repo/redis/client";

/** Point-in-time snapshot of cache performance counters. */
interface CacheStatsSnapshot {
  hits: number;
  misses: number;
  l1Hits: number;
  l2Hits: number;
  redisErrors: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
}

const globalObj = globalThis as any;
globalObj.__cacheStats = globalObj.__cacheStats || {
  hits: 0,
  misses: 0,
  l1Hits: 0,
  l2Hits: 0,
  redisErrors: 0,
};
globalObj.__cacheLatencies = globalObj.__cacheLatencies || [];

const stats = globalObj.__cacheStats;
const latencies = globalObj.__cacheLatencies;

const LATENCY_BUFFER_SIZE = 1000;

function addLatency(latencyMs: number): void {
  if (latencies.length >= LATENCY_BUFFER_SIZE) {
    latencies.shift();
  }
  latencies.push(latencyMs);
}

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)] ?? 0;
}

function buildSnapshot(): CacheStatsSnapshot {
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.length > 0 ? sorted.reduce((sum, v) => sum + v, 0) / sorted.length : 0;

  return {
    hits: stats.hits,
    misses: stats.misses,
    l1Hits: stats.l1Hits,
    l2Hits: stats.l2Hits,
    redisErrors: stats.redisErrors,
    avgLatencyMs: Math.round(avg * 100) / 100,
    p95LatencyMs: Math.round(computePercentile(sorted, 95) * 100) / 100,
  };
}

/** Record a cache hit from the specified layer with its latency. */
export function recordCacheHit(source: "l1" | "l2", latencyMs: number): void {
  // 1. Local update
  stats.hits++;
  if (source === "l1") stats.l1Hits++;
  else stats.l2Hits++;
  addLatency(latencyMs);

  // 2. Redis sync (fire-and-forget, only if already connected)
  const redis = getClientIfOpen();
  if (redis) {
    redis.hincrby("stats:cache", "hits", 1).catch(() => {});
    redis.hincrby("stats:cache", source === "l1" ? "l1Hits" : "l2Hits", 1).catch(() => {});
    redis
      .lpush("stats:latencies", latencyMs.toString())
      .then(() => {
        redis.ltrim("stats:latencies", 0, 999).catch(() => {});
      })
      .catch(() => {});
  }
}

/** Record a cache miss with its latency. */
export function recordCacheMiss(latencyMs: number): void {
  // 1. Local update
  stats.misses++;
  addLatency(latencyMs);

  // 2. Redis sync (fire-and-forget, only if already connected)
  const redis = getClientIfOpen();
  if (redis) {
    redis.hincrby("stats:cache", "misses", 1).catch(() => {});
    redis
      .lpush("stats:latencies", latencyMs.toString())
      .then(() => {
        redis.ltrim("stats:latencies", 0, 999).catch(() => {});
      })
      .catch(() => {});
  }
}

/** Increment the Redis error counter (local + remote). */
export function recordRedisError(): void {
  // 1. Local update
  stats.redisErrors++;

  // 2. Redis sync (fire-and-forget, only if already connected)
  const redis = getClientIfOpen();
  if (redis) {
    redis.hincrby("stats:cache", "redisErrors", 1).catch(() => {});
  }
}

/**
 * Retrieve the aggregated cache statistics snapshot.
 * Prefers Redis-backed data; falls back to the in-process counters on failure.
 */
export async function getCacheStats(): Promise<CacheStatsSnapshot> {
  try {
    const redis = await getRedisClient();
    if (redis?.status === "ready") {
      const data = await redis.hgetall("stats:cache");
      const latencyStrs = await redis.lrange("stats:latencies", 0, 999);
      const sorted = latencyStrs
        .map(Number)
        .filter((v: number) => !isNaN(v))
        .sort((a: number, b: number) => a - b);

      const avg =
        sorted.length > 0
          ? sorted.reduce((sum: number, v: number) => sum + v, 0) / sorted.length
          : 0;

      return {
        hits: parseInt(data.hits || "0", 10),
        misses: parseInt(data.misses || "0", 10),
        l1Hits: parseInt(data.l1Hits || "0", 10),
        l2Hits: parseInt(data.l2Hits || "0", 10),
        redisErrors: parseInt(data.redisErrors || "0", 10),
        avgLatencyMs: Math.round(avg * 100) / 100,
        p95LatencyMs: Math.round(computePercentile(sorted, 95) * 100) / 100,
      };
    }
  } catch {
    // ignore and fallback to local buildSnapshot
  }
  return buildSnapshot();
}

/** Reset all local and Redis-backed cache statistics. */
export function resetCacheStats(): void {
  stats.hits = 0;
  stats.misses = 0;
  stats.l1Hits = 0;
  stats.l2Hits = 0;
  stats.redisErrors = 0;
  latencies.length = 0;

  getRedisClient()
    .then((redis) => {
      if (redis?.status === "ready") {
        redis.del("stats:cache").catch(() => {});
        redis.del("stats:latencies").catch(() => {});
      }
    })
    .catch(() => {});
}
