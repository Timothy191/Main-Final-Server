# NestJS → Next.js Migration Plan

## Overview

Migrate all 20 NestJS modules from `apps/api/` into Next.js App Router API routes under `apps/portal/src/app/api/v2/`.

**Target prefix:** `/api/v2/*` (allows gradual client migration)

## Endpoint Map

### Simple Modules (Phase 1 — no external deps)

| NestJS Route             | Method | Next.js Route                   | Files                                |
| ------------------------ | ------ | ------------------------------- | ------------------------------------ |
| GET /api/weather         | GET    | /api/v2/weather/route.ts        | weather.service → lib/api/weather.ts |
| GET /api/tools/status    | GET    | /api/v2/tools/status/route.ts   | tools.service → lib/api/tools.ts     |
| POST /api/csp-violations | POST   | /api/v2/csp-violations/route.ts | security.controller → route.ts       |

### Auth Module (Phase 2 — critical path)

| NestJS Route              | Method | Next.js Route                    | Files        |
| ------------------------- | ------ | -------------------------------- | ------------ |
| POST /api/auth/login      | POST   | /api/v2/auth/login/route.ts      | auth.service |
| POST /api/auth/pin/hash   | POST   | /api/v2/auth/pin/hash/route.ts   | auth.service |
| POST /api/auth/pin/verify | POST   | /api/v2/auth/pin/verify/route.ts | auth.service |

### Access Control (Phase 2)

| NestJS Route  | Method | Next.js Route        | Files                  |
| ------------- | ------ | -------------------- | ---------------------- |
| POST /api/c66 | POST   | /api/v2/c66/route.ts | access-control.service |

### Admin (Phase 2)

| NestJS Route                  | Method | Next.js Route                       | Files         |
| ----------------------------- | ------ | ----------------------------------- | ------------- |
| GET /api/admin/data/:table    | GET    | /api/v2/admin/data/[table]/route.ts | admin.service |
| PUT /api/admin/data/:table    | PUT    | /api/v2/admin/data/[table]/route.ts | admin.service |
| DELETE /api/admin/data/:table | DELETE | /api/v2/admin/data/[table]/route.ts | admin.service |

### Control Room (Phase 2)

| NestJS Route                             | Method | Next.js Route                                    | Files                |
| ---------------------------------------- | ------ | ------------------------------------------------ | -------------------- |
| GET /api/control-room/shift-completeness | GET    | /api/v2/control-room/shift-completeness/route.ts | control-room.service |

### Exports (Phase 3)

| NestJS Route                     | Method | Next.js Route                            | Files           |
| -------------------------------- | ------ | ---------------------------------------- | --------------- |
| GET /api/export/fuel-logs        | GET    | /api/v2/export/fuel-logs/route.ts        | exports.service |
| GET /api/export/machines         | GET    | /api/v2/export/machines/route.ts         | exports.service |
| GET /api/export/production       | GET    | /api/v2/export/production/route.ts       | exports.service |
| GET /api/export/safety-incidents | GET    | /api/v2/export/safety-incidents/route.ts | exports.service |
| POST /api/export/monthly-report  | POST   | /api/v2/export/monthly-report/route.ts   | exports.service |

### Telemetry (Phase 3)

| NestJS Route                     | Method | Next.js Route                           | Files             |
| -------------------------------- | ------ | --------------------------------------- | ----------------- |
| POST /api/telemetry/push         | POST   | /api/v2/telemetry/push/route.ts         | telemetry.service |
| POST /api/plugins/rust-telemetry | POST   | /api/v2/plugins/rust-telemetry/route.ts | telemetry.service |
| POST /api/sync/playback          | POST   | /api/v2/sync/playback/route.ts          | ecc.service       |

### AI (Phase 4 — complex)

| NestJS Route            | Method | Next.js Route                   | Files                 |
| ----------------------- | ------ | ------------------------------- | --------------------- |
| POST /api/ai/trigger    | POST   | /api/v2/ai/trigger/route.ts     | agent-trigger.service |
| GET /api/ai/status      | GET    | /api/v2/ai/status/route.ts      | ai-gateway.service    |
| GET /api/ai/invocations | GET    | /api/v2/ai/invocations/route.ts | ai-features.service   |

### Ops (Phase 4 — complex)

| NestJS Route                 | Method | Next.js Route                        | Files            |
| ---------------------------- | ------ | ------------------------------------ | ---------------- |
| POST /api/ops/cache/clear    | POST   | /api/v2/ops/cache/clear/route.ts     | ops.service      |
| GET /api/ops/queue/counts    | GET    | /api/v2/ops/queue/counts/route.ts    | ops.service      |
| POST /api/ops/queue/action   | POST   | /api/v2/ops/queue/action/route.ts    | ops.service      |
| POST /api/ops/rate-limit     | POST   | /api/v2/ops/rate-limit/route.ts      | ops.service      |
| POST /api/ops/config         | POST   | /api/v2/ops/config/route.ts          | ops.service      |
| GET /api/ops/summary         | GET    | /api/v2/ops/summary/route.ts         | ops.service      |
| POST /api/ops/trigger        | POST   | /api/v2/ops/trigger/route.ts         | ops.service      |
| POST /api/ops/db/audit       | POST   | /api/v2/ops/db/audit/route.ts        | db-audit.service |
| GET /api/ops/db/audit/status | GET    | /api/v2/ops/db/audit/status/route.ts | db-audit.service |
| POST /api/ops/db/repair      | POST   | /api/v2/ops/db/repair/route.ts       | db-audit.service |
| POST /api/ops/db/query       | POST   | /api/v2/ops/db/query/route.ts        | db-audit.service |

### Webhooks (Phase 4)

| NestJS Route               | Method | Next.js Route                       | Files            |
| -------------------------- | ------ | ----------------------------------- | ---------------- |
| GET /api/webhooks          | GET    | /api/v2/webhooks/route.ts           | webhooks.service |
| POST /api/webhooks         | POST   | /api/v2/webhooks/route.ts           | webhooks.service |
| PUT /api/webhooks/:id      | PUT    | /api/v2/webhooks/[id]/route.ts      | webhooks.service |
| DELETE /api/webhooks/:id   | DELETE | /api/v2/webhooks/[id]/route.ts      | webhooks.service |
| GET /api/webhooks/:id/logs | GET    | /api/v2/webhooks/[id]/logs/route.ts | webhooks.service |

### Jobs/Inngest (Phase 4)

| NestJS Route              | Method | Next.js Route                      | Files           |
| ------------------------- | ------ | ---------------------------------- | --------------- |
| POST /api/inngest/*       | POST   | /api/v2/inngest/[...path]/route.ts | inngest.service |
| POST /api/jobs/embeddings | POST   | /api/v2/jobs/embeddings/route.ts   | inngest.service |

## Shared Infrastructure

| NestJS Module   | Next.js Equivalent     | Location              |
| --------------- | ---------------------- | --------------------- |
| RedisModule     | @repo/redis            | packages/redis        |
| SupabaseModule  | @repo/supabase         | packages/supabase     |
| ThrottlerModule | @repo/rate-limiter     | packages/rate-limiter |
| ConfigModule    | env vars directly      | process.env           |
| Auth Guard      | Supabase server client | lib/auth.ts           |

## Migration Strategy

1. **Service layer:** Convert NestJS `@Injectable()` services to plain TypeScript modules in `apps/portal/src/lib/api/`
2. **Route handlers:** Create Next.js App Router `route.ts` files that call the service layer
3. **Guards:** Convert NestJS guards to middleware or server-side checks
4. **DTOs:** Convert class-validator DTOs to Zod schemas
5. **Tests:** Port service spec files to Jest tests

## Safety

- NestJS API keeps running on :3001 during migration
- Client can gradually switch from `/api/*` to `/api/v2/*`
- Rollback: revert client URLs to point at :3001
