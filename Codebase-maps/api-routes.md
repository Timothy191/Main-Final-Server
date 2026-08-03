# API Routes & Gateway Endpoints Map

## 1. Overview

The **Arch Systems Portal** exposes 51 API route handlers in `apps/portal/src/app/api/` built on Next.js 16 App Router Route Handlers, alongside control-plane HTTP endpoints in `apps/ops-gateway` and GraphQL Mesh endpoints in `apps/api-gateway`.

---

## 2. Complete Index of Portal API Routes (51 Routes)

### Group A: Operational & System Health Probes (9 Routes)

| Endpoint                        | Methods | File Location                                               | Description & Behavior                                                           |
| :------------------------------ | :------ | :---------------------------------------------------------- | :------------------------------------------------------------------------------- |
| `/api/health`                   | `GET`   | `apps/portal/src/app/api/health/route.ts`                   | Comprehensive stack health check (DB, Redis, Inngest status).                    |
| `/api/health/live`              | `GET`   | `apps/portal/src/app/api/health/live/route.ts`              | Kubernetes Liveness probe — checks node process responsiveness (`status: "ok"`). |
| `/api/health/ready`             | `GET`   | `apps/portal/src/app/api/health/ready/route.ts`             | Kubernetes Readiness probe — validates PostgreSQL DB and Redis connectivity.     |
| `/api/health/cache`             | `GET`   | `apps/portal/src/app/api/health/cache/route.ts`             | Hybrid L1 memory / L2 Redis cache status and ping latency check.                 |
| `/api/health/fuxa`              | `GET`   | `apps/portal/src/app/api/health/fuxa/route.ts`              | FUXA SCADA/PLC bridge connectivity probe.                                        |
| `/api/health/redis`             | `GET`   | `apps/portal/src/app/api/health/redis/route.ts`             | Isolated Redis ping and cluster node health check.                               |
| `/api/health/supabase-realtime` | `GET`   | `apps/portal/src/app/api/health/supabase-realtime/route.ts` | WebSocket Realtime connection and channel health check.                          |
| `/api/health/warmup`            | `GET`   | `apps/portal/src/app/api/health/warmup/route.ts`            | Pre-warms L1 cache and database connection pools.                                |
| `/api/v2/health`                | `GET`   | `apps/portal/src/app/api/v2/health/route.ts`                | Versioned operational health API contract endpoint.                              |

---

### Group B: Authentication & Security (5 Routes)

| Endpoint               | Methods       | File Location                                      | Description & Behavior                                                    |
| :--------------------- | :------------ | :------------------------------------------------- | :------------------------------------------------------------------------ |
| `/api/auth/login`      | `POST`        | `apps/portal/src/app/api/auth/login/route.ts`      | User sign-in, password validation, session cookie generation.             |
| `/api/auth/logout`     | `POST`, `GET` | `apps/portal/src/app/api/auth/logout/route.ts`     | User sign-out, session invalidation, auth cookie cleanup.                 |
| `/api/auth/pin/hash`   | `POST`        | `apps/portal/src/app/api/auth/pin/hash/route.ts`   | Access card & terminal PIN bcrypt hashing utility.                        |
| `/api/auth/pin/verify` | `POST`        | `apps/portal/src/app/api/auth/pin/verify/route.ts` | Access card PIN verification for physical gate control.                   |
| `/api/csp-violations`  | `POST`        | `apps/portal/src/app/api/csp-violations/route.ts`  | Ingestion endpoint for browser Content Security Policy violation reports. |

---

### Group C: Operational Control & Maintenance (`/api/ops/*` — 12 Routes)

| Endpoint                       | Methods         | File Location                                              | Description & Behavior                                                    |
| :----------------------------- | :-------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------ |
| `/api/ops/summary`             | `GET`           | `apps/portal/src/app/api/ops/summary/route.ts`             | System-wide operational metrics and department activity overview.         |
| `/api/ops/config`              | `GET`, `POST`   | `apps/portal/src/app/api/ops/config/route.ts`              | Dynamic operational environment and threshold configurations.             |
| `/api/ops/cache/clear`         | `POST`          | `apps/portal/src/app/api/ops/cache/clear/route.ts`         | Purges L1 memory cache and invalidates Redis tag keys (`cacheTag`).       |
| `/api/ops/db/audit`            | `GET`, `POST`   | `apps/portal/src/app/api/ops/db/audit/route.ts`            | Initiates database consistency and index integrity checks.                |
| `/api/ops/db/audit/status`     | `GET`           | `apps/portal/src/app/api/ops/db/audit/status/route.ts`     | Polls current progress of active database integrity audit tasks.          |
| `/api/ops/db/query`            | `POST`          | `apps/portal/src/app/api/ops/db/query/route.ts`            | Restricted DB query analyzer endpoint for ops diagnostics.                |
| `/api/ops/db/repair`           | `POST`          | `apps/portal/src/app/api/ops/db/repair/route.ts`           | Automated schema repair and sequence syncing utility.                     |
| `/api/ops/gateway/[[...path]]` | `ALL`           | `apps/portal/src/app/api/ops/gateway/[[...path]]/route.ts` | Catch-all proxy route forwarding control-plane requests to `ops-gateway`. |
| `/api/ops/queue/action`        | `POST`          | `apps/portal/src/app/api/ops/queue/action/route.ts`        | Manually triggers retry, purge, or pause actions on job queues.           |
| `/api/ops/queue/counts`        | `GET`           | `apps/portal/src/app/api/ops/queue/counts/route.ts`        | Returns active, pending, and failed job counts across Inngest queues.     |
| `/api/ops/rate-limit`          | `GET`, `DELETE` | `apps/portal/src/app/api/ops/rate-limit/route.ts`          | Rate limiter metrics inspection and IP unblock administration.            |
| `/api/ops/trigger`             | `POST`          | `apps/portal/src/app/api/ops/trigger/route.ts`             | Programmatically dispatches operational events into event pipeline.       |

---

### Group D: Telemetry, Ingest & Job Processing (5 Routes)

| Endpoint                      | Methods              | File Location                                             | Description & Behavior                                               |
| :---------------------------- | :------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------- |
| `/api/telemetry/push`         | `POST`               | `apps/portal/src/app/api/telemetry/push/route.ts`         | High-throughput telemetry data ingestion point (Redis queue buffer). |
| `/api/plugins/rust-telemetry` | `POST`               | `apps/portal/src/app/api/plugins/rust-telemetry/route.ts` | Edge Rust agent telemetry binary protocol parser and buffer.         |
| `/api/c66`                    | `POST`, `GET`        | `apps/portal/src/app/api/c66/route.ts`                    | Heavy machinery (C66 excavator/drill) telemetry stream receiver.     |
| `/api/sync/playback`          | `GET`, `POST`        | `apps/portal/src/app/api/sync/playback/route.ts`          | Realtime machinery timeline playback and event sync route.           |
| `/api/inngest`                | `GET`, `POST`, `PUT` | `apps/portal/src/app/api/inngest/route.ts`                | Serves Inngest 4 background functions (8 async job definitions).     |

---

### Group E: Webhooks Integration (3 Routes)

| Endpoint                  | Methods                | File Location                                         | Description & Behavior                                            |
| :------------------------ | :--------------------- | :---------------------------------------------------- | :---------------------------------------------------------------- |
| `/api/webhooks`           | `GET`, `POST`          | `apps/portal/src/app/api/webhooks/route.ts`           | Listing and registration endpoint for outbound/inbound webhooks.  |
| `/api/webhooks/[id]`      | `GET`, `PUT`, `DELETE` | `apps/portal/src/app/api/webhooks/[id]/route.ts`      | Webhook subscription details management and secret rotation.      |
| `/api/webhooks/[id]/logs` | `GET`                  | `apps/portal/src/app/api/webhooks/[id]/logs/route.ts` | Delivery log history and payload inspection for specific webhook. |

---

### Group F: Printing & Peripheral Hardware (3 Routes)

| Endpoint             | Methods         | File Location                                    | Description & Behavior                                                |
| :------------------- | :-------------- | :----------------------------------------------- | :-------------------------------------------------------------------- |
| `/api/printers`      | `GET`, `POST`   | `apps/portal/src/app/api/printers/route.ts`      | List registered card printers (Magicard, Zebra) and queue print jobs. |
| `/api/printers/[id]` | `GET`, `DELETE` | `apps/portal/src/app/api/printers/[id]/route.ts` | Printer status inspection, ribbon check, and printer management.      |
| `/api/printers/scan` | `POST`          | `apps/portal/src/app/api/printers/scan/route.ts` | Scans local network / USB ports for attached card printing hardware.  |

---

### Group G: Data Export & Reports (5 Routes)

| Endpoint                       | Methods | File Location                                              | Description & Behavior                                            |
| :----------------------------- | :------ | :--------------------------------------------------------- | :---------------------------------------------------------------- |
| `/api/export/fuel-logs`        | `GET`   | `apps/portal/src/app/api/export/fuel-logs/route.ts`        | CSV/PDF export of diesel consumption and fueling logs.            |
| `/api/export/machines`         | `GET`   | `apps/portal/src/app/api/export/machines/route.ts`         | Export machine inventory, operating hours, and maintenance state. |
| `/api/export/monthly-report`   | `GET`   | `apps/portal/src/app/api/export/monthly-report/route.ts`   | Generates aggregated monthly site activity and shift report PDF.  |
| `/api/export/production`       | `GET`   | `apps/portal/src/app/api/export/production/route.ts`       | Generates production tonnage and shift output data export files.  |
| `/api/export/safety-incidents` | `GET`   | `apps/portal/src/app/api/export/safety-incidents/route.ts` | Safety compliance export for OSHA / regulatory reporting.         |

---

### Group H: Metrics, Documentation & Admin Utilities (9 Routes)

| Endpoint                               | Methods                        | File Location                                                      | Description & Behavior                                          |
| :------------------------------------- | :----------------------------- | :----------------------------------------------------------------- | :-------------------------------------------------------------- |
| `/api/metrics`                         | `GET`                          | `apps/portal/src/app/api/metrics/route.ts`                         | Operational metrics JSON API for internal dashboards.           |
| `/api/metrics/prometheus`              | `GET`                          | `apps/portal/src/app/api/metrics/prometheus/route.ts`              | OpenMetrics / Prometheus formatted text metrics scraper route.  |
| `/api/admin/data/[table]`              | `GET`, `POST`, `PUT`, `DELETE` | `apps/portal/src/app/api/admin/data/[table]/route.ts`              | Dynamic admin data grid access handler with strict role checks. |
| `/api/control-room/shift-completeness` | `GET`                          | `apps/portal/src/app/api/control-room/shift-completeness/route.ts` | Realtime shift log completeness calculator.                     |
| `/api/doc`                             | `GET`                          | `apps/portal/src/app/api/doc/route.ts`                             | Generates OpenAPI / Swagger UI specification JSON.              |
| `/api/feedback`                        | `POST`                         | `apps/portal/src/app/api/feedback/route.ts`                        | In-app user feedback submission handler.                        |
| `/api/log`                             | `POST`                         | `apps/portal/src/app/api/log/route.ts`                             | Client-side error and diagnostic log collector route.           |
| `/api/tools/status`                    | `GET`                          | `apps/portal/src/app/api/tools/status/route.ts`                    | MCP tool execution status and health inspector.                 |
| `/api/weather`                         | `GET`                          | `apps/portal/src/app/api/weather/route.ts`                         | Site weather station telemetry and ambient condition route.     |

---

## 3. Gateway Endpoints (`apps/ops-gateway` & `apps/api-gateway`)

| Service           | Port        | Endpoint       | Protocol / Implementation                | Purpose                                                          |
| :---------------- | :---------- | :------------- | :--------------------------------------- | :--------------------------------------------------------------- |
| **`ops-gateway`** | 3001 / 3002 | `/health`      | HTTP GET (`http-server.ts`)              | Control plane health probe returning gateway online status.      |
| **`ops-gateway`** | 3001        | MCP STDIO/HTTP | Model Context Protocol (`mcp/server.ts`) | MCP tool registration, execution, and AI agent dispatching.      |
| **`api-gateway`** | 4000        | `/graphql`     | GraphQL Mesh (`.meshrc.yaml`)            | Unified GraphQL API endpoint aggregating REST & OpenAPI sources. |
