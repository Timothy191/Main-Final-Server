# NestJS to Next.js Migration Guide

**Status:** Migration in progress  
**Date:** 2026-08-06

---

## Overview

This document describes the migration of backend services from NestJS to Next.js App Router API routes. The goal is to consolidate all backend logic into the `apps/portal` Next.js application, eliminating the separate NestJS API layer.

## Current State

| Aspect         | Before                   | After                                           |
| -------------- | ------------------------ | ----------------------------------------------- |
| API framework  | NestJS (`apps/api/`)     | Next.js App Router (`apps/portal/src/app/api/`) |
| Modules        | 20 NestJS modules        | Next.js route handlers + Server Actions         |
| Auth           | NestJS guards + Passport | Edge middleware (`proxy.ts`) + Supabase Auth    |
| Validation     | NestJS class-validator   | Zod schemas (`@repo/contract`)                  |
| Error handling | NestJS exceptions filter | Typed `AppError` (`@repo/errors`)               |

## Migration Phases

### Phase 1: Simple Modules (No External Dependencies)

- Weather API
- Tools status
- CSP violations
- Health checks

**Risk:** Low  
**Approach:** Direct port of business logic to route handlers.

### Phase 2: Auth & Admin (Critical Path)

- Authentication flows
- Admin user management
- Role-based access control

**Risk:** Medium  
**Approach:** Reuse existing `@repo/supabase` clients; migrate guards to edge middleware.

### Phase 3: Data-Intensive Modules

- Telemetry ingestion
- Modbus data processing
- Report generation

**Risk:** Medium-High  
**Approach:** Keep long-running work in Server Actions; use `cacheTag` for invalidation.

### Phase 4: External Integrations

- SharePoint sync
- AI providers (Gemini/Ollama)
- Email/webhook delivery

**Risk:** High  
**Approach:** Wrap external calls in `runApiGuards`; add circuit breaker + retry logic.

## Key Principles

1. **Thin routes, fat features** — App Router pages delegate to `src/features/`
2. **Shared contracts** — Zod schemas live in `@repo/contract`
3. **Typed errors** — Throw `AppError` subclasses from `@repo/errors`
4. **Cache at the edge** — Use Next.js `"use cache"` + Redis L1/L2
5. **No BFF proxy** — Portal reaches data directly through `@repo/supabase`

## Checklist

- [ ] Phase 1 modules migrated
- [ ] Phase 2 auth/admin migrated
- [ ] Phase 3 data modules migrated
- [ ] Phase 4 external integrations migrated
- [ ] NestJS repo archived
- [ ] CI/CD updated (no more `apps/api` build)
- [ ] Monitoring migrated to portal metrics

## References

- [`docs/deployment/deployment.md`](./deployment.md) — deployment overview
- [`docs/architecture/enterprise-resiliency-blueprint.md`](./architecture/enterprise-resiliency-blueprint.md) — resiliency patterns
- [`docs/caching/caching-strategy-research.md`](./caching/caching-strategy-research.md) — caching architecture
