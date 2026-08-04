// L1 in-memory cache with TTL + LRU eviction and a tag index so
// tag/prefix invalidation can evict local entries immediately.
//
// Industry-verified pattern: LRU (Least Recently Used) eviction is superior to
// FIFO for hot-key workloads. Implemented via Map's insertion-order guarantee —
// on every GET we delete and re-insert the key to move it to the tail ("MRU end").
// On eviction we delete from the head ("LRU end") via Map.keys().next().

const L1_MAX_ENTRIES = 1000;

interface MemoryEntry {
  value: string;
  expires: number;
}

// AGENT-TRACE: Map preserves insertion order — head = LRU, tail = MRU.
// l1Get promotes accessed keys to the tail; eviction removes from the head.
const memoryCache = new Map<string, MemoryEntry>();
const tagIndex = new Map<string, Set<string>>();

export function l1Get<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    memoryCache.delete(key);
    return null;
  }
  // LRU promotion: move to tail (most-recently-used end)
  memoryCache.delete(key);
  memoryCache.set(key, item);
  return JSON.parse(item.value) as T;
}

export function l1Set<T>(key: string, value: T, ttlSeconds: number): void {
  // If already present, delete first so the re-insert lands at the tail
  if (memoryCache.has(key)) {
    memoryCache.delete(key);
  } else if (memoryCache.size >= L1_MAX_ENTRIES) {
    // LRU eviction: remove the oldest (head) entry
    const firstKey = memoryCache.keys().next().value;
    if (firstKey !== undefined) {
      memoryCache.delete(firstKey);
    }
  }

  memoryCache.set(key, {
    value: JSON.stringify(value),
    expires: Date.now() + ttlSeconds * 1000,
  });
}

export function l1Delete(key: string): void {
  memoryCache.delete(key);
}

export function l1DeleteByPrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export function l1IndexTags(key: string, tags: string[]): void {
  for (const tag of tags) {
    let keys = tagIndex.get(tag);
    if (!keys) {
      keys = new Set();
      tagIndex.set(tag, keys);
    }
    keys.add(key);
  }
}

export function l1EvictByTags(tags: string[]): number {
  let evicted = 0;
  for (const tag of tags) {
    const keys = tagIndex.get(tag);
    if (!keys) continue;
    for (const key of keys) {
      if (memoryCache.delete(key)) {
        evicted++;
      }
    }
    tagIndex.delete(tag);
  }
  return evicted;
}

export function l1Clear(): void {
  memoryCache.clear();
  tagIndex.clear();
}
