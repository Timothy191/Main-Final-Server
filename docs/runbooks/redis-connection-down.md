# Runbook: Redis Connection Down

**Alert Rule:** `RedisConnectionDown` (critical)
**Source:** `ops/prometheus/alert-rules.yaml`
**Related Alerts:** `CircuitBreakerOpen`, `RedisNativeFallbackActive`
**Dashboard:** `ops/grafana/cache-handler-dashboard.json`

## Summary

The Redis connection has been down for more than 1 minute. The application has
gracefully degraded to the **native in-memory fallback** for cache operations:

- Cache reads work (in-memory) but are local to each pod
- Cache writes work (in-memory) but are NOT shared across pods
- Tag-based invalidation does NOT propagate across pods
- Circuit breaker will likely trip to OPEN after threshold failures

## Severity

| Attribute    | Value         |
| ------------ | ------------- |
| Severity     | CRITICAL      |
| Response SLA | 30 minutes    |
| Escalation   | Platform team |

## Symptoms

- **End-user impact:** Cache inconsistencies across pods (a user may see stale
  data after a write that landed on a different pod).
- **Grafana:** `arch_redis_connection_info` gauge shows `0`;
  `arch_redis_native_fallback` shows `1`.
- **Health endpoint:** `GET /api/health` → `checks.redis.status: "unhealthy"`.
  `GET /api/health/cache` → `redis.connected: false`.
- **Metrics:** `arch_redis_connection_info{status="unavailable"}` = 0

## Possible Causes

| Cause                                 | Likelihood | Indication                         |
| ------------------------------------- | ---------- | ---------------------------------- |
| Redis pod crash/restart               | High       | Redis pod status not Running       |
| Network policy blocking traffic       | Medium     | Other Redis clients also affected  |
| Redis OOM (out of memory)             | Medium     | Redis logs show OOM errors         |
| Redis config change requiring restart | Low        | Recent config changes deployed     |
| DNS resolution failure                | Low        | `REDIS_URL` hostname not resolving |

## Diagnosis Steps

### 1. Check Redis Container Status

```bash
docker-compose ps redis
# Expected: State: Up

# If not running, check logs
docker-compose logs redis --tail=100

# For production deployment:
docker-compose -f docker-compose.production.yml logs redis --tail=100
```

### 2. Check Redis Resource Usage

```bash
# Check memory usage (if Redis is responsive)
redis-cli INFO memory | grep used_memory_human

# Check container resource usage
docker stats redis --no-stream
```

### 3. Check Connectivity from App Container

```bash
# Test Redis connection from the portal container
docker-compose exec portal sh -c 'nc -zv <REDIS_HOST> <REDIS_PORT>'

# Test DNS resolution
docker-compose exec portal sh -c 'getent hosts <REDIS_HOST> || nslookup <REDIS_HOST>'
```

### 4. Check Redis Config

```bash
cat docker-compose.yml | grep -A5 redis
# Check REDIS_URL in portal env
cat docker-compose.yml | grep -A10 portal | grep REDIS
```

### 5. Check Cross-Pod Audit Log (if Redis is up but app connection is flaky)

```bash
redis-cli LRANGE arch:circuit-breaker:audit 0 -1 | tail -20
# Shows recent circuit breaker transitions
```

## Resolution Steps

### Step 1: Restart Redis (quick recovery attempt)

```bash
docker-compose restart redis

# Wait for container to be ready
docker-compose exec redis redis-cli ping
# Expected: PONG
```

### Step 2: Adjust Redis Resources (if OOM)

```bash
# Edit docker-compose.yml to increase Redis memory limit
# Then recreate the container:
docker-compose up -d --force-recreate redis
```

### Step 3: Check Docker Network

```bash
# Verify Redis is accessible from portal container
docker-compose exec portal sh -c 'nc -zv redis 6379'

# Check docker network DNS resolution
docker-compose exec portal sh -c 'getent hosts redis'
```

### Step 4: Restore from Redis Backup

If Redis data is corrupted and you need to restore from backup:

```bash
# Stop Redis, copy RDB, restart
# dump.rdb location is defined by volumes in docker-compose.yml
docker-compose stop redis
cp /path/to/backup/dump.rdb ./data/redis/dump.rdb
docker-compose start redis
```

### Step 5: Update REDIS_URL Config

If the Redis host or port changed, update the docker-compose.yml:

```bash
# Edit docker-compose.yml, then recreate the portal container:
docker-compose up -d --force-recreate portal
```

## Post-Recovery Verification

1. **Check health endpoint:** `GET /api/health` → `checks.redis.status: "healthy"`
2. **Check cache health:** `GET /api/health/cache` → `.redis.connected: true`, `.redis.status: "ready"`
3. **Check Grafana:** `arch_redis_connection_info` gauge shows `1`
4. **Check native fallback:** `arch_redis_native_fallback` shows `0`
5. **Verify cross-pod cache:** Deploy a change and verify it propagates across pods
6. **Verify circuit breaker:** If CB tripped to OPEN, it should eventually half-open and close

## Prevention

- Configure Redis with `maxmemory-policy allkeys-lru` to prevent OOM
- Set Redis resource requests = limits to prevent CPU throttling
- Use Redis Sentinel or Cluster for high availability
- Monitor Redis memory usage via Grafana and set up warning alerts at 70% usage
- Run `pnpm smoke-test` after any Redis config changes
