# Arch System — Memory & Historical Insights Index

This directory captures durable architectural learnings, historical audit findings, and migration reference maps extracted from legacy/temporary documentation files prior to cleanup.

---

## 1. Monorepo Best Practices & Compliance

_Source: `MONOREPO_AUDIT.md` (2026-08-04)_

- **Package Boundary Rules:**
  - Product code lives exclusively in `apps/` and `packages/`.
  - Agent and tooling configurations (`.cursor/`, `.agents/`, `.claude/`, `.continue/`) must **never** become runtime dependencies.
  - Core shared packages (`@repo/acl`, `@repo/contract`, `@repo/ui`, `@repo/supabase`, `@repo/redis`) must maintain standalone `AGENTS.md` and `SPEC.md` files defining their exported types and change checklist.
- **Dependency Build Order:**
  1. Foundation: `@repo/typescript-config`, `@repo/eslint-config`
  2. Types & Contracts: `@repo/acl`, `@repo/contract`, `@repo/errors`
  3. Data Layer: `@repo/supabase`, `@repo/database`, `@repo/redis`
  4. Utilities: `@repo/utils`, `@repo/logger`, `@repo/rate-limiter`
  5. UI Foundation: `@repo/theme`, `@repo/ui`
  6. Application: `apps/portal`

---

## 2. Refactoring Lessons & Auth Consolidation

_Source: `docs/audits/duplication-audit.md`_

- **Department Auth Helper Pattern:**
  - Legacy inline role assertion helpers (`assertAccessCardActionsRole`, `assertControlRoomRole`, etc.) were consolidated into `assertDeptRole` in `@repo/acl` and `apps/portal/src/lib/dept-access.ts`.
  - Edge middleware (`apps/portal/src/proxy.ts`) gates requests using edge-safe `isRestrictedRouteAllowed` from `@repo/acl`.

---

## 3. NestJS to Next.js App Router API v2 Migration Reference Map

_Source: `docs/migration/nestjs-to-nextjs-migration.md`_

All 20 legacy NestJS backend modules mapping to Next.js 16 App Router `/api/v2/*`:

| Domain              | NestJS Origin         | Next.js 16 Target Route     | Package / Service                                |
| :------------------ | :-------------------- | :-------------------------- | :----------------------------------------------- |
| **Auth**            | `/api/auth/*`         | `/api/v2/auth/*`            | `@repo/supabase` / `proxy.ts`                    |
| **Access Control**  | `/api/c66`            | `/api/v2/c66`               | `@repo/acl`                                      |
| **Control Room**    | `/api/control-room/*` | `/api/v2/control-room/*`    | `apps/portal/src/app/(departments)/control-room` |
| **Telemetry**       | `/api/telemetry/push` | `/api/v2/telemetry/push`    | `@repo/contract` (`telemetryPushSchema`)         |
| **Exports**         | `/api/export/*`       | `/api/v2/export/*`          | `@repo/utils` (`excel.ts`)                       |
| **Ops & Cache**     | `/api/ops/*`          | `/api/v2/ops/*`             | `@repo/redis` / `@repo/rate-limiter`             |
| **Webhooks**        | `/api/webhooks/*`     | `/api/v2/webhooks/*`        | `@repo/contract` (`createWebhookSchema`)         |
| **Background Jobs** | `/api/inngest/*`      | `/api/v2/inngest/[...path]` | `@repo/utils` (`inngest.ts`)                     |

---

## 4. Performance Optimization Principles

_Source: `docs/performance/` and `docs/caching/`_

- **L1/L2 Cache Coherence:**
  - Fast read path utilizes in-memory LRU (`@repo/redis` L1) backed by Redis L2.
  - Edge proxy auth checks use Redis L2 with 300s TTL; user logout triggers `/api/cache/invalidate` with `userId` prefix eviction.
- **CSS Selector Costs:**
  - Avoid deeply nested class selectors or wildcards (`*`) in theme custom properties. Rely on utility classes safelisted in `@repo/theme`.
