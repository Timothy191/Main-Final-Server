# @repo/redis Package Guidelines

**Purpose:** Redis client configuration and L1/L2 caching layer — the caching foundation for the portal.

## Package Overview

This package provides a Redis client with a two-layer caching strategy:
- **L1 Cache:** In-memory RAM cache (15s TTL)
- **L2 Cache:** Redis cluster cache (longer TTL)

It provides a simple API for cache operations: `cacheGet`, `cacheSet`, `cacheDelete`.

## Cache API

```typescript
// Get value from cache (checks L1, then L2)
export const cacheGet = async (key: string): Promise<string | null>;

// Set value in both L1 and L2
export const cacheSet = async (
  key: string,
  value: string,
  ttl?: number
): Promise<void>;

// Delete value from both L1 and L2
export const cacheDelete = async (key: string): Promise<void>;

// Clear all caches
export const cacheClear = async (): Promise<void>;
```

## Critical Rules

### 1. Cache Key Strategy
- **USE** consistent key prefixes: `auth:${userId}`, `dept:${deptId}`, `user:${userId}`
- **NEVER** use arbitrary keys without namespace prefix
- **INCLUDE** context in keys to avoid collisions
- **KEEP** keys readable and debuggable

### 2. Cache Invalidation
- **INVALIDATE** cache on data changes
- **USE** cache tags for related data: `cacheTag('users', userId)`
- **DELETE** specific keys when possible, avoid full cache clears
- **CONSIDER** time-based invalidation for rarely-changing data

### 3. Cache Usage Patterns
- **CACHE** read-heavy operations (user profiles, department configs)
- **DON'T cache** write operations or sensitive data
- **USE** appropriate TTL values based on data volatility
- **AVOID** caching large objects (>1MB)

### 4. Error Handling
- **GRACEFULLY DEGRADE** when Redis is unavailable
- **LOG** cache failures but don't break application flow
- **FALLBACK** to direct database access on cache failures
- **NEVER** throw errors from cache operations in user-facing code

## Change Impact

When changing cache logic:
- **HIGH IMPACT:** Cache key changes affect cache hit rates
- **MEDIUM IMPACT:** TTL changes affect cache freshness
- **LOW IMPACT:** Error handling changes affect resilience

### Cross-Package Dependencies
This package is consumed by:
- `apps/portal/src/lib/` - Business logic caching
- `apps/portal/src/features/` - Feature-specific caching
- `apps/portal/src/proxy.ts` - Auth session caching
- Any package that needs caching

## Testing

```bash
# Type checking
pnpm --filter @repo/redis type-check

# No unit tests currently - consider adding:
# - Cache hit/miss tests
# - L1/L2 fallback tests
# - Error handling tests
# - TTL expiration tests
```

## Common Patterns

### Basic caching
```typescript
import { cacheGet, cacheSet } from '@repo/redis';

const getUser = async (userId: string) => {
  const cacheKey = `user:${userId}`;
  const cached = await cacheGet(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const user = await db.user.findUnique({ where: { id: userId } });
  await cacheSet(cacheKey, JSON.stringify(user), 300); // 5 minutes
  
  return user;
};
```

### Cache with tags (for invalidation)
```typescript
import { cacheGet, cacheSet, cacheTag } from '@repo/redis';

const getDepartmentUsers = async (deptId: string) => {
  const cacheKey = `dept:${deptId}:users`;
  const cached = await cacheGet(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const users = await db.user.findMany({ where: { departmentId: deptId } });
  await cacheSet(cacheKey, JSON.stringify(users), 600);
  await cacheTag('departments', deptId); // Tag for invalidation
  
  return users;
};

// Invalidate all department-related cache
const invalidateDepartmentCache = async (deptId: string) => {
  await cacheDelete(`dept:${deptId}:users`);
  await cacheDelete(`dept:${deptId}:config`);
  // Or use tag-based invalidation if implemented
};
```

### Error handling with fallback
```typescript
import { cacheGet, cacheSet } from '@repo/redis';

const getConfig = async (key: string) => {
  try {
    const cached = await cacheGet(`config:${key}`);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    // Log but don't fail - fallback to DB
    console.error('Cache get failed:', error);
  }
  
  // Fallback to database
  const config = await db.config.findUnique({ where: { key } });
  
  try {
    await cacheSet(`config:${key}`, JSON.stringify(config), 3600);
  } catch (error) {
    // Log but don't fail - config is still returned
    console.error('Cache set failed:', error);
  }
  
  return config;
};
```

## Cache Key Guidelines

### Key Structure
```
{namespace}:{identifier}:{optional-context}
```

### Common Namespaces
- `auth:` - Authentication sessions
- `user:` - User profiles and data
- `dept:` - Department configurations
- `config:` - Application configuration
- `session:` - User session data

### Examples
```typescript
// Good
`user:${userId}`
`user:${userId}:profile`
`dept:${deptId}:members`
`auth:${sessionId}`
`config:feature_flags`

// Bad - no namespace
`${userId}`
`user_data`
`cache_key_123`
```

## TTL Guidelines

```typescript
// Short TTL (seconds)
30   // Frequently changing data
60   // Session data
300  // User profiles (5 minutes)

// Medium TTL (seconds)
600  // Department configs (10 minutes)
1800 // Feature flags (30 minutes)

// Long TTL (seconds)
3600 // Static configuration (1 hour)
86400 // Rarely changing data (24 hours)
```

## Change Checklist

Before declaring done with cache changes:
- [x] Updated cache key strategy if needed
- [x] Adjusted TTL values appropriately
- [x] Added error handling for cache failures
- [x] Tested cache hit/miss scenarios
- [x] Verified cache invalidation on data changes
- [x] Added entry to `docs/REPO-CHANGE-INDEX.md`
- [x] Ran `pnpm --filter @repo/redis type-check`

## Common Pitfalls

### 1. Missing cache invalidation
```typescript
// Don't do this - cache stays stale
await updateUser(userId, data);
// Cache not invalidated

// Do this instead
await updateUser(userId, data);
await cacheDelete(`user:${userId}`);
```

### 2. Throwing on cache failures
```typescript
// Don't do this - breaks app when Redis is down
const cached = await cacheGet(key);
if (!cached) throw new Error('Cache miss');

// Do this instead - graceful fallback
const cached = await cacheGet(key);
if (cached) return JSON.parse(cached);
// Fallback to database
```

### 3. Poor key structure
```typescript
// Don't do this - collisions likely
const key = `${userId}`;

// Do this instead - namespaced
const key = `user:${userId}`;
```

## Redis Connection

### Local Development
The package expects Redis to be available via the `REDIS_URL` environment variable.

Start Redis locally:
```bash
# Via dev script
pnpm dev  # Starts Redis automatically

# Or manually
docker run -p 6379:6379 redis:alpine
```

### Connection Configuration
The package uses environment variables:
- `REDIS_URL` - Redis connection string
- `REDIS_TLS` - Enable TLS (for production)

## Monitoring

Consider adding cache metrics:
- Cache hit rate
- Cache miss rate
- Average response time
- Error rate

These help identify cache performance issues.
