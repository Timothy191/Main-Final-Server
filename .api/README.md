# .api/ — Internal API Surface Reference (Agent Context Only)

> **⚠ Agent context only.** This directory is NOT runtime code.
> It is a machine-readable index of internal API routes and contracts for AI agent discovery.
> Product code MUST NOT import from this directory.

## What's here

| File           | Format      | Purpose                                         |
| -------------- | ----------- | ----------------------------------------------- |
| `routes.json`  | JSON        | Structured index of all `/api/*` route handlers |
| `openapi.yaml` | OpenAPI 3.1 | Partial OpenAPI spec for key internal endpoints |

## Full OpenAPI Spec

A more complete OpenAPI spec (generated from `@repo/contract` Zod schemas) lives at:

```
docs/openapi/internal.yaml   ← full spec (to be generated)
```

## API Route Index Summary

The portal exposes 25 top-level `/api/*` route groups:

| Route Group           | Purpose                                           | Auth Required  |
| --------------------- | ------------------------------------------------- | -------------- |
| `/api/admin`          | Admin user + role management                      | Admin          |
| `/api/ai`             | AI inference endpoints                            | Employee       |
| `/api/auth`           | Auth callback, session management                 | Public/Session |
| `/api/cache`          | Cache invalidation (`POST /api/cache/invalidate`) | Admin          |
| `/api/c66`            | C66 SCADA integration                             | Department     |
| `/api/cleanup`        | Data cleanup utilities                            | Admin          |
| `/api/control-room`   | Control room machine data                         | Department     |
| `/api/csp-violations` | Content Security Policy reports                   | Public         |
| `/api/doc`            | Documentation endpoint                            | Employee       |
| `/api/export`         | Data export (CSV/PDF)                             | Department     |
| `/api/feedback`       | User feedback submission                          | Employee       |
| `/api/health`         | Health check (no auth required)                   | Public         |
| `/api/inngest`        | Inngest background job webhooks                   | Inngest-signed |
| `/api/log`            | Structured log ingestion                          | Employee       |
| `/api/metrics`        | Application metrics                               | Admin          |
| `/api/modbus-ingest`  | Modbus SCADA data ingestion                       | Service        |
| `/api/ops`            | Operations endpoints                              | Admin          |
| `/api/plugins`        | Plugin management                                 | Admin          |
| `/api/printers`       | Print queue management                            | Department     |
| `/api/sync`           | Data sync triggers                                | Admin          |
| `/api/telemetry`      | OpenTelemetry trace ingestion                     | Service        |
| `/api/tools`          | Internal tool endpoints                           | Admin          |
| `/api/v2`             | v2 API surface                                    | Varies         |
| `/api/weather`        | Weather data proxy                                | Department     |
| `/api/webhooks`       | Incoming webhook handlers                         | Webhook-signed |

## Key Architectural Rules (for agents touching API routes)

1. All routes are protected by `apps/portal/src/proxy.ts` (edge) — never duplicate ACL inline.
2. Use `@repo/contract` Zod schemas for request/response validation.
3. Throw `AppError` subclasses from `@repo/errors` — never plain `Error`.
4. Rate limiting via `apps/portal/src/lib/api/rate-limit-middleware.ts`.
5. Backend proxy to `API_BASE_URL` → `http://localhost:3004/api` via `/api/backend/*`.
6. There is NO `middleware.ts` — edge proxy is in `proxy.ts` (enforced by `next-backend-guard`).
