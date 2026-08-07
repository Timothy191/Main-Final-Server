## 1. Caching capability

- [x] 1.1 Implement `useControlRoomCache` hook with TTL expiry and tag metadata
- [x] 1.2 Implement `invalidateClientCacheByTags` tag-based eviction
- [x] 1.3 Stabilize volatile fetcher/options with refs to prevent render loops
- [x] 1.4 Add unit tests covering TTL, tag invalidation, and loop protection

## 2. Department finalization

- [x] 2.1 Wire `SCADAAlertFeed` to the client cache
- [x] 2.2 Scope `hooks/` ignore rule to `.claude/hooks/` in both ignore files
- [x] 2.3 Align `calculateSmrMetrics` to the async action flow and update tests
- [x] 2.4 Verify: portal type-check, lint, full test suite (569/569), ignore-sync guard
