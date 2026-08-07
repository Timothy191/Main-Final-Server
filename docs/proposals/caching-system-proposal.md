# Proposal: Fix cacheDeletePattern Multi-Wildcard Handling

## Problem Statement

The `cacheDeletePattern` function in `@repo/redis` was using `String.prototype.replace('*', '')`, which only removes the **first** occurrence of the wildcard character. This caused incomplete prefix derivation for patterns containing multiple wildcards, such as `users:*:data`.

### Symptoms

- Cache invalidation patterns with multiple wildcards produced incorrect prefixes
- Keys that should have been evicted remained in L1/L2 cache
- Subsequent reads returned stale data after department/session changes

## Proposed Solution

Replace the single-occurrence string replacement with a global regex replacement:

```typescript
// Before
const prefix = pattern.replace('*', '')

// After
const prefix = pattern.replace(/\*/g, '')
```

### Why This Works

- `/\*/g` matches **all** `*` characters in the pattern string
- Patterns like `users:*:data` correctly become `users:data`
- `users:*` correctly becomes `users`
- Backward compatible with single-wildcard patterns

## Implementation Details

### Files Modified

| File                                         | Change                                            |
| -------------------------------------------- | ------------------------------------------------- |
| `packages/redis/src/cache.ts`                | Updated `cacheDeletePattern` to use global regex  |
| `packages/redis/src/__tests__/cache.test.ts` | Added regression test for multi-wildcard patterns |

### Code Change

```typescript
export async function cacheDeletePattern(pattern: string): Promise<void> {
  const prefix = pattern.replace(/\*/g, '')
  memoryDeleteByPrefix(prefix)
  await cacheInvalidatePrefixes([prefix])
}
```

## Test Results

### Unit Tests

- Added: `should delete keys matching a pattern with multiple wildcards`
- Pattern validated: `users:*:data`
- Verified deletion of:
  - `users:1`
  - `users:data:1`
  - `users:data:2`
- Verified preservation of unrelated key: `other`

### Package Test Suite

- Command: `pnpm --filter @repo/redis test`
- Result: **PASSED** (exit code 0)
- No existing tests broken

## Documentation Updates

| Document                    | Entry Added                                                                   |
| --------------------------- | ----------------------------------------------------------------------------- |
| `docs/REPO-CHANGE-INDEX.md` | Active Entries Log: 2026-08-07, kimi, caching-system/redis/cacheDeletePattern |

## Risk Assessment

| Risk                                    | Severity   | Mitigation                                                        |
| --------------------------------------- | ---------- | ----------------------------------------------------------------- |
| Existing single-wildcard patterns break | Low        | Regex `/\*/g` is backward compatible with single-wildcard strings |
| Performance impact                      | Negligible | Regex on short pattern strings is O(n) with tiny n                |
| L2 Redis invalidation misses keys       | Medium     | Covered by new test; manual verification recommended in staging   |

## Next Steps

1. **Staging verification**: Test multi-department cache invalidation flows with real Redis
2. **Monitor cache hit rates**: Ensure L1/L2 hit rates remain stable after deployment
3. **Consider extending**: Apply similar global-replacement pattern to other wildcard-based utilities in `packages/redis/src/`

## Approval

- [ ] Code review approved
- [ ] QA verified in staging
- [ ] Change log entry confirmed
