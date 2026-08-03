# Runbook: Circuit Breaker Open

**Alert Rule:** `CircuitBreakerOpen` (critical)
**Source:** `ops/prometheus/alert-rules.yaml`
**Dashboard:** `ops/grafana/cache-handler-dashboard.json`

## Summary

The cache layer circuit breaker has been in **OPEN** state for more than 5 minutes.
All cache requests (get/set/updateTags) are being fast-rejected without hitting Redis.
The application continues to function — missing cache data is fetched from the origin —
but with degraded performance and increased origin load.

## Severity

| Attribute    | Value         |
| ------------ | ------------- |
| Severity     | CRITICAL      |
| Response SLA | 15 minutes    |
| Escalation   | Platform team |

## Symptoms

- **End-user impact:** Pages may load slower (origin fetch instead of cache hit).
  No complete outage.
- **Grafana:** Circuit breaker panels show OPEN state; `arch_cache_circuit_breaker_events_total{transition="open"}` > close counter.
- **Health endpoint:** `GET /api/health/cache` returns `status: "degraded"` and
  `circuitBreaker.state: "OPEN"`.
- **Metrics:** `rate(arch_cache_circuit_breaker_events_total{transition="reject"}[1m]) > 0`

## Possible Causes

| Cause                                   | Likelihood | Indication                         |
| --------------------------------------- | ---------- | ---------------------------------- |
| Redis connection lost                   | High       | `RedisConnectionDown` also firing  |
| Redis overload (slow commands)          | Medium     | `HighCacheFailureRate` also firing |
| Network partition between app and Redis | Low        | Other services also affected       |
| Circuit breaker config too sensitive    | Low        | Check `CIRCUIT_BREAKER_THRESHOLD`  |

## Diagnosis Steps

### 1. Check Redis Connectivity

```bash
redis-cli -h <REDIS_HOST> -p <REDIS_PORT> ping
# Expected: PONG

# Check Redis info for connected clients
redis-cli INFO clients
```

### 2. Check Cache Health Endpoint

```bash
curl -s <app-url>/api/health/cache | jq
```

Key fields:

- `.status` — Should be `"degraded"`
- `.circuitBreaker.state` — Should be `"OPEN"`
- `.circuitBreaker.opens` — Number of times opened
- `.circuitBreaker.rejects` — Number of rejected requests
- `.redis.connected` — Whether Redis is reachable
- `.auditEvents` — Recent breaker transitions with timestamps

### 3. Check Redis Latency

```bash
redis-cli --latency -h <REDIS_HOST> -p <REDIS_PORT>
# Normal: < 5ms. Elevated: > 50ms
```

### 4. Check Cache Handler Logs

```bash
# Look for circuit breaker state transitions and Redis errors
docker-compose logs portal --tail=100 | grep -i 'circuit\|breaker\|redis\|cache'
# Or if using production compose:
docker-compose -f docker-compose.production.yml logs portal --tail=100 | grep -i ...
```

## Resolution Steps

### Step 1: Restore Redis Connection (if connection lost)

```bash
# Restart Redis container
docker-compose restart redis

# Or check Redis container logs
docker-compose logs redis --tail=50

# For production deployment:
docker-compose -f docker-compose.production.yml restart redis
```

### Step 2: Force Close the Circuit Breaker

If the underlying issue is resolved but the breaker hasn't half-opened yet,
force-close it:

```bash
# Trigger half-open via health endpoint (resets failure count)
curl -X POST <app-url>/api/health/cache/force-half-open

# Or restart the portal container to reset in-memory state
docker-compose restart portal
```

### Step 3: Tune Circuit Breaker Thresholds

If the breaker is tripping too easily (false positives), adjust in
`apps/portal/src/lib/next-cache-handler.ts`:

```typescript
const CIRCUIT_BREAKER_THRESHOLD = 10 // Increase from 5
const CIRCUIT_BREAKER_HALF_OPEN_MAX = 3 // Requests allowed in half-open
```

## Verification

After resolution:

1. **Check health endpoint:** `GET /api/health/cache` → `status: "healthy"`,
   `circuitBreaker.state: "CLOSED"`
2. **Check Grafana:** Circuit breaker panel shows CLOSED state
3. **Check metrics:** `arch_cache_circuit_breaker_events_total{transition="close"}` incremented
4. **Smoke test cache:** Verify cache operations succeed:
   ```bash
   curl -s <app-url>/api/health/cache | jq .status
   # Expected: "healthy"
   ```

## Prevention

- Ensure Redis connection retry strategy uses exponential backoff
- Monitor cache hit rate via Grafana — drops may precede breaker trips
- Set up Redis resource requests/limits to prevent CPU throttling
- Run `pnpm ai check` after any circuit breaker config changes
