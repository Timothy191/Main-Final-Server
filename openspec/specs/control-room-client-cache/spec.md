# control-room-client-cache Specification

## Purpose
Provides client-side caching of control-room telemetry and dashboard data to reduce redundant fetches and keep the SCADA alert feed responsive.
## Requirements
### Requirement: Cached control-room data served within TTL

The control-room client cache SHALL serve previously fetched data for a configured TTL without issuing a new fetch, and SHALL refetch once the entry has expired.

#### Scenario: Data is served from cache before expiry

- **WHEN** a control-room data key is requested twice within its TTL
- **THEN** the second request SHALL return the cached value without invoking the fetcher

#### Scenario: Expired entries are refetched

- **WHEN** a cached entry has exceeded its TTL
- **THEN** the next request SHALL invoke the fetcher and refresh the cached value

### Requirement: Tag-based cache invalidation

Control-room cache entries SHALL be evictable by tag so that stale telemetry can be cleared on demand.

#### Scenario: Invalidate entries by tag

- **WHEN** an invalidation is issued for a set of tags
- **THEN** all cached entries carrying any of those tags SHALL be removed from the cache

#### Scenario: Unrelated entries survive invalidation

- **WHEN** an invalidation is issued for a set of tags
- **THEN** cached entries carrying none of those tags SHALL remain available

### Requirement: Stable behavior with volatile fetcher parameters

The control-room cache hook SHALL tolerate fetcher functions and options that are recreated on each render without triggering infinite re-fetch or re-render loops.

#### Scenario: Volatile fetcher does not loop

- **WHEN** a component re-renders with a newly created fetcher for the same cache key
- **THEN** the hook SHALL NOT refetch the key and SHALL NOT enter an infinite render loop

