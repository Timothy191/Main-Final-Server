# Dataflow & Processing Pipelines Map

## 1. Executive Summary

This map details the asynchronous, real-time, and background data processing pipelines across **Arch Systems Portal**. It encompasses high-frequency telemetry ingestion, background job execution via **Inngest 4**, webhook lifecycle management, and control-plane event dispatching.

---

## 2. Telemetry Ingestion Pipeline

High-frequency telemetry from drilling rigs, excavators (C66), and field sensors follows an event-driven buffering pipeline to protect the primary database:

```text
[ Rig / Edge Sensor / Rust Agent ]
               │
               ▼
   [ Portal Telemetry Endpoint ]
     ├── /api/telemetry/push
     ├── /api/plugins/rust-telemetry
     └── /api/c66
               │
               ▼
     [ Payload Validation ]
       ├── Schema check via @repo/contract
       └── Rate limit check via @repo/rate-limiter
               │
               ▼
     [ L1/L2 Redis Ingestion Buffer ]
       ├── L1: Fast memory write
       └── L2: Redis Stream / PubSub topic: telemetry:events
               │
               ▼
    [ Inngest Batching Processor ]
      (syncPlaybackFn)
               │
               ▼
    [ Supabase PostgreSQL Telemetry Log ]
```

---

## 3. Inngest Background Job Pipeline

Async jobs are orchestrated via **Inngest 4** through the portal route handler at `apps/portal/src/app/api/inngest/route.ts`. The system defines **8 core background functions**:

```text
                                  +-----------------------+
                                  |   /api/inngest Route  |
                                  +-----------+-----------+
                                              |
      +-------------------+-------------------+-------------------+-------------------+
      |                   |                   |                   |                   |
      v                   v                   v                   v                   v
[syncPlaybackFn]   [generateReportFn] [generateEmbeddingFn] [memoryPersistFn] [shiftCompletenessCheckFn]
   (Telemetry          (PDF/CSV          (pgvector AI          (Session AI          (Shift Integrity
    Syncing)          Generation)          Embeddings)         Memory Store)            Audit)
      |                   |                   |                   |                   |
      +-------------------+-------------------+-------------------+-------------------+
                                              |
      +---------------------------------------+---------------------------------------+
      |                                       |                                       |
      v                                       v                                       v
[orphanedRecordDetectionFn]        [shiftIntegrityReportFn]               [automatedAuditFn]
 (Database Orphan Repair)          (Scheduled Shift Report)               (System Consistency)
```

### Job Catalog

1. **`syncPlaybackFn`**: Periodically syncs buffered telemetry playback points into chronological time-series tables.
2. **`generateReportFn`**: Asynchronously renders heavy PDF reports (`@react-pdf/renderer`) and exports CSV datasets without blocking request threads.
3. **`generateEmbeddingFn`**: Computes text vector embeddings via the portal embedding provider (`@/lib/ai/embedding-provider`, routing Ollama / OpenAI / router) and writes them to the Supabase `embedding_cache` table.
4. **`memoryPersistFn`**: Flushes agent conversation logs and operational memory into database table `ai_memory`.
5. **`shiftCompletenessCheckFn`**: Evaluates active shifts for missing supervisor sign-offs, unassigned machines, or missing log entries.
6. **`orphanedRecordDetectionFn`**: Identifies and re-links dangling foreign keys or unindexed records across department tables.
7. **`shiftIntegrityReportFn`**: Generates daily shift compliance digests and sends notifications to department leads.
8. **`automatedAuditFn`**: Executes scheduled system-wide database consistency checks (`/api/ops/db/audit`).

---

## 4. Webhooks Lifecycle & Dispatch Pipeline

Inbound and outbound webhooks rely on schema validation via `@repo/contract` and delivery logging:

```text
[ Outbound Event Trigger ]
           │
           ▼
[ @repo/contract Validation ] ── Validates payload structure against Zod schema
           │
           ▼
[ Webhook Dispatcher ]
   ├── Fetches active subscriptions from Supabase
   ├── Computes HMAC signature header (`X-Arch-Signature`)
   └── Executes HTTP POST delivery with exponential backoff retry
           │
           ▼
[ Delivery Audit Log ] ── Written to /api/webhooks/[id]/logs
```
