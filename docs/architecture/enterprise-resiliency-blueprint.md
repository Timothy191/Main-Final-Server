# Enterprise Architecture & Operational Resiliency Blueprint

This document specifies the enterprise architecture pillars for industrial metrics tracking, real-time telemetry, and resilient data flow across client, server, and database boundaries in Arch-System.

---

## 1. Robust Server-Side Data Ingestion & Resiliency

### 1.1 Background Processing Queues for Heavy Mutations

- **Async Decoupling**: Time-critical ingestion API endpoints return an immediate `202 Accepted` response with a job/event token (<50ms response latency).
- **Task Queues**: Heavy jobs (e.g. bulk CSV processing, report generation, telemetry processing) are dispatched asynchronously to Inngest / background workers.
- **Real-Time Progress**: Job status and real-time progress updates are delivered back to client dashboards via Server-Sent Events (SSE) or WebSockets (`X-Accel-Buffering: no` ensures unbuffered delivery).

### 1.2 Database Connection Pooling & Circuit Breakers

- **Transaction Pooling**: PostgreSQL is fronted by Supavisor / pgBouncer in transaction pooling mode to prevent connection exhaustion during traffic spikes.
- **Connection Sizing**: Kysely and Supabase connection pools in `@repo/supabase` and `@repo/database` maintain bounded pool sizes.
- **Circuit Breakers**: Redis and cache handlers use explicit Circuit Breakers (e.g. 5 consecutive failure threshold, 10s cooldown) to fail fast and prevent thread pool starvation.

### 1.3 Schema Guardrails & Migration Automation

- **Code First / Type Generation**: Database schema changes in `packages/supabase/migrations/` trigger automatic Kysely TypeScript type generation via `pnpm db:codegen`.
- **Zod Validation**: Input payloads are validated before database writes using shared Zod schemas from `@repo/contract`.

---

## 2. Next.js App Router Architecture & Security

### 2.1 Centralized Data Transfer Contracts (OpenAPI & Zod)

- **Single Source of Truth**: `@repo/contract` exports Zod schemas for all domain payloads.
- **OpenAPI Specs**: Automated OpenAPI 3.0 generation script (`scripts/generate-openapi-spec.js`) outputs contract specs for external integration.

### 2.2 Strict Edge Route Protection (`proxy.ts`)

- **Centralized Edge Security**: All incoming requests pass through `apps/portal/src/proxy.ts` (edge middleware).
- **Department ACL**: Department permissions and role boundaries are validated using `@repo/acl` before any Server Component execution or data fetching begins.
- **Redirect Safety**: Unauthorized or restricted route requests are sanitized and redirected to `/login`.

---

## 3. Real-Time Telemetry & Off-Grid Sync

### 3.1 Optimistic UI Updates

- Field data entry forms leverage React `useOptimistic` paired with Server Actions to update UI metrics instantly before backend persistence completes, rolling back gracefully if validation fails.

### 3.2 Offline-First Storage & Background Synchronization

- **IndexedDB Persistent Layer**: Field devices maintain local state using IndexedDB (Dexie / Fake-IndexedDB fallback).
- **Background Sync**: Service worker at `apps/portal/public/sw.js` queues pending mutation requests when offline and sequentially flushes them when network connectivity is restored.

---

## 4. Enterprise Observability & Self-Hosted Telemetry

### 4.1 Structured Logging & `X-Request-ID` Correlation

- **Structured JSON**: Shared structured logging provided by `@repo/logger`.
- **Correlation Header**: `proxy.ts` injects a unique `X-Request-ID` UUID header into every incoming request. This correlation ID is propagated across API routes, NestJS/FastAPI proxies, and Supabase calls for end-to-end tracing.

### 4.2 Health Check & Metrics Endpoints

- `/api/health` exposes comprehensive system health indicators (database ping, Redis cache availability, memory thresholds, and version info) to orchestrators and load balancers.

---

## 5. Distributed Frameworks & Optimization Methods

### 5.1 Distributed Infrastructure Alignment

- **etcd / Sidecar Orchestration**: Self-hosted Supabase Docker containers and edge field gateways leverage etcd key-value configuration state for dynamic field site toggles without service restarts.
- **Event-Driven Microservices Architecture (Dapr Model)**: Loose coupling between Next.js Edge proxy (`proxy.ts`), telemetry endpoints (`/api/v2/telemetry/push`), and background queue workers (`Inngest`) prevents compute blocking and enables satellite edge deployment.

### 5.2 Multi-Agent Mathematical Optimization

- **Consensus-Based Load Balancing (DGD & DIGing)**: Peer-to-peer field gateways in control-room operations exchange truck hauling cycle metrics to dynamically optimize pit dispatch without centralized single points of failure.
- **Decentralized ADMM (Operator Splitting)**: Multi-site wellhead pressure optimization is decomposed into local edge sub-problems computed at individual site gateways, exchanging boundary multipliers asynchronously.
