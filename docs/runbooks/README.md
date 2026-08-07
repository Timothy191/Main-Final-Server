# Runbooks

> [!NOTE] Neural Connections
> 🔙 **Upward Node:** [Master Map of Content](../../memory/antigravity-memory/long/MAP_OF_CONTENT.md)
> 🔀 **Lateral Nodes:** [Architecture Hub](../architecture/README.md) | [Performance Insights](../performance-insights/README.md)

Operational runbooks for responding to alerts from the monitoring stack.
Each runbook corresponds to a Prometheus alert rule defined in
[`ops/prometheus/alert-rules.yaml`](../../ops/prometheus/alert-rules.yaml).

## Critical Alerts

| Alert                 | Runbook                                                | Response SLA |
| --------------------- | ------------------------------------------------------ | ------------ |
| `CircuitBreakerOpen`  | [circuit-breaker-open.md](./circuit-breaker-open.md)   | 15 min       |
| `RedisConnectionDown` | [redis-connection-down.md](./redis-connection-down.md) | 30 min       |

## Warning Alerts

| Alert                             | Runbook                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `CircuitBreakerFlapping`          | See [circuit-breaker-open.md](./circuit-breaker-open.md) — diagnosis steps apply |
| `CircuitBreakerRejectingRequests` | See [circuit-breaker-open.md](./circuit-breaker-open.md)                         |
| `HighCacheFailureRate`            | See [redis-connection-down.md](./redis-connection-down.md)                       |
| `CacheHitRateDropped`             | See [redis-connection-down.md](./redis-connection-down.md)                       |

## Info Alerts

| Alert                       | Runbook                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `CacheRetriesElevated`      | See [circuit-breaker-open.md](./circuit-breaker-open.md)   |
| `RedisNativeFallbackActive` | See [redis-connection-down.md](./redis-connection-down.md) |

## Manual Operations (not alert-driven)

Procedures run on-demand by an operator, not in response to a Prometheus alert.

| Task                                                                                                               | Runbook                                                        |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Force the edge proxy to re-read a user's role after a role/department change (evict `arch:auth:employee:<userId>`) | [evict-employee-auth-cache.md](./evict-employee-auth-cache.md) |

## Quick Reference

### Health Endpoints

```bash
# Overall system health (all checks)
curl -s <app-url>/api/health | jq

# Cache-layer diagnostics with circuit breaker state
curl -s <app-url>/api/health/cache | jq

# Prometheus metrics endpoint (protects via scrape token)
curl -s <app-url>/api/metrics/prometheus?token=<token>
```

### Grafana Dashboard

Open the **Cache Handler — Redis & Circuit Breaker** dashboard
(`ops/grafana/cache-handler-dashboard.json`) for real-time visualization of:

- Cache hit/error rates
- Circuit breaker state transitions
- Redis connection status
- Native fallback activity

### Alertmanager

- **Config:** [`ops/alertmanager/alertmanager.yaml`](../../ops/alertmanager/alertmanager.yaml)
- **Entrypoint:** [`ops/alertmanager/entrypoint.sh`](../../ops/alertmanager/entrypoint.sh)
- **Required env vars:** `SLACK_API_URL`, `PAGERDUTY_ROUTING_KEY`
