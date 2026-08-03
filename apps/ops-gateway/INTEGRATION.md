# Ops-Gateway: Integration Points & Expansion Guide

## Architecture Summary

```
┌──────────────┐      stdio MCP      ┌──────────────────────┐
│  TUI Agent    │◄──────────────────►│  ops-gateway:3100     │
│  (Claude Code)│     (12 tools)     │  (Control Plane)     │
└──────────────┘                     └───────┬──────────────┘
                                             │ HTTP (x-ops-secret)
                                             ▼
                                    ┌──────────────────────┐
                                    │  NestJS API:3001     │
                                    │  (Data Plane)        │
                                    │  OpsModule           │
                                    └──────────────────────┘
```

## Current MCP Tools (12)

| #   | Name                    | Purpose                     | Destructive?     | Gated?            |
| --- | ----------------------- | --------------------------- | ---------------- | ----------------- |
| 1   | `ops-system-summary`    | Aggregate backend health    | No               | —                 |
| 2   | `ops-clear-cache`       | Clear Redis keys by pattern | Yes (cache loss) | No                |
| 3   | `ops-queue-status`      | BullMQ queue counts         | No               | —                 |
| 4   | `ops-rate-limit-adjust` | Change global rate limit    | Yes (throttling) | No                |
| 5   | `ops-read-config`       | Read safe env vars          | No               | —                 |
| 6   | `ops-trigger-agent`     | Push event to Redis stream  | No               | —                 |
| 7   | `ops-get-metrics`       | Fetch Prometheus metrics    | No               | —                 |
| 8   | `ops-health-check`      | Run full health probe       | No               | —                 |
| 9   | `db-audit-run`          | Full DB integrity audit     | No               | —                 |
| 10  | `db-audit-report`       | Last audit results          | No               | —                 |
| 11  | `db-repair`             | Auto-repair DB issues       | **Yes**          | ✅ `confirm=true` |
| 12  | `db-query`              | Safe SELECT query           | Read-only        | ✅ Validation     |

## Expansion Opportunities

### 1. Feature Flag Management

- **Hook**: OpsService reads `ENABLE_LOAD_ADAPTIVE_TEST` and `DISABLE_RATE_LIMIT` from env
- **Add**: `POST /api/ops/config` endpoint to write `ops:*` Redis keys for toggling features at runtime
- **MCP tool**: `ops-toggle-feature(name, enabled)` — toggle boolean feature flags
- **No risk**: Existing `ALLOWED_PUBLIC_CONFIG_KEYS` pattern already exists; extend to writable keys

### 2. Maintenance Mode

- **Hook**: None yet — needs new Redis key (`ops:maintenance:true`)
- **Add**: `POST /api/ops/maintenance` — sets a Redis key, NestJS reads via an interceptor
- **Guard action**: GlobalExceptionFilter or middleware checks key and returns 503
- **MCP tool**: `ops-maintenance-mode(action: "enable"|"disable"|"status")`

### 3. Rate Limit Visibility

- **Hook**: OpsService already writes `ops:rate-limit-override` to Redis (line 89)
- **Add**: `GET /api/ops/rate-limit` returns current effective limit (default 100 or override)
- **MCP tool**: `ops-rate-limit-status` — read current limit without changing it
- **No risk**: Read-only addition

### 4. Cache Statistics

- **Hook**: Redis `INFO` command returns `used_memory`, `keyspace_hits`, `keyspace_misses`
- **Add**: `GET /api/ops/cache/stats` — returns hit rate, memory usage, key count
- **MCP tool**: `ops-cache-stats` — inspect cache health before deciding to clear it
- **No risk**: Read-only, uses existing redisClient via `ops:info` command

### 5. Approval Gating for ops-clear-cache and ops-rate-limit-adjust

- **Hook**: Same pattern as `db-repair` — add `confirm` param
- **Effect**: Consistent UX across all destructive MCP tools
- **MCP change**: Add optional `confirm: boolean` param, return preview when absent

### 6. Scheduled/Periodic DB Repair

- **Hook**: Audit poller already runs every cycle; auto-mitigation repairs `orphaned_rows` + `stale_data`
- **Add**: MCP tool `db-schedule-repair(table, category, cron?)` — persist schedule in Redis
- **MCP tool**: `db-repair-status` — show pending/scheduled repairs
- **Low risk**: Complements existing auto-mitigation

### 7. eve Framework Migration Path

- **Reference**: Vercel's eve framework (filesystem-first durable backend agents)
- **Benefit**: Could replace custom polling with `'use step'` durability, eliminate `x-ops-secret` via Vercel Connect
- **Migration**: Move ops-gateway tool definitions to eve `*.agent.ts` files; adopt `needsApproval` framework-native gating
- **Prerequisite**: Vercel deployment with eve SDK available

### 8. Distributed Tracing Propagation

- **Hook**: NestJS ObservabilityModule already sets up OpenTelemetry
- **Add**: ops-gateway generates `traceparent` header on every opsFetch call; NestJS OpsController reads it
- **No risk**: W3C trace context standard; backward-compatible (missing header = no tracing)

## Validation Layer Summary

### MCP Handler-Level Defenses (implemented)

| Tool        | Check                                    | Rejects                          |
| ----------- | ---------------------------------------- | -------------------------------- |
| `db-repair` | `confirm === true` gate                  | Without confirm: returns preview |
| `db-query`  | `sql.toUpperCase().startsWith("SELECT")` | Non-SELECT queries               |
| `db-query`  | `sql.length > 2000`                      | Oversized queries                |
| `db-query`  | `sql.length < 4`                         | Trivially short queries          |

### NestJS-Level Defenses (unchanged)

| Endpoint     | Check                                     | Mechanism                      |
| ------------ | ----------------------------------------- | ------------------------------ |
| `/db/repair` | Zod schema: `/api/src/ops/dto/ops.dto.ts` | Validates table, category enum |
| `/db/query`  | Zod schema: safeQuerySchema               | Validates SQL length 4-2000    |
| `/db/audit`  | SELECT-only enforcement in DbAuditService | `ALLOWED_QUERY_PATTERNS` regex |
| All `/ops/*` | `OpsInternalGuard`                        | `x-ops-secret` header check    |

## Incident & Auto-Mitigation Engine

| Incident Type          | Trigger                                 | Auto-Mitigation                                 |
| ---------------------- | --------------------------------------- | ----------------------------------------------- |
| `BACKEND_UNREACHABLE`  | Health poller: status === "unreachable" | None (wait for recovery)                        |
| `HIGH_ERROR_RATE`      | Metrics poller: 5xx count > threshold   | None (alert only)                               |
| `SERVER_CRASH`         | GlobalExceptionFilter → Redis stream    | Reduce rate limit to 50 req/min                 |
| `HIGH_MEMORY`          | Metrics poller: RSS > 512MB             | Clear `cache:*` keys                            |
| `DATA_INTEGRITY_ISSUE` | Audit poller: errorCount > 0            | Repair `orphaned_rows` + `stale_data` per-table |

## Edge Cases & Failure Modes

| Scenario                             | Behavior                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| NestJS backend down during startup   | Ops-gateway starts, logs unreachable, polls until recovery                                  |
| Redis unreachable                    | Ops-gateway starts with degraded incident engine; Redis subscriber reconnects automatically |
| Audit poll fails (DB unreachable)    | Skipped, retries next cycle (every 15s)                                                     |
| Auto-repair partial failure          | Per-table best-effort; one failing table doesn't block others                               |
| Empty tablesByIssue categories       | Auto-mitigation skips categories with no tables — `tables.length === 0` guard               |
| Duplicate `confirm` param from model | Explicit `=== true` check; any truthy/falsy edge value returns preview                      |
