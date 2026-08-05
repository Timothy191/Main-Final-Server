# Arch System — Packages Directory Index (`packages/`)

Token-efficient map of all 12 shared monorepo packages, their role, and specification files.

## Packages Catalog

| Package Name           | Path                                          | Specification                         | Purpose / Role                                                                                         |
| :--------------------- | :-------------------------------------------- | :------------------------------------ | :----------------------------------------------------------------------------------------------------- |
| `@repo/acl`            | [`packages/acl`](./acl)                       | [`SPEC.md`](./acl/SPEC.md)            | Single source of truth for department route slugs, roles, and edge-safe permission predicates          |
| `@repo/contract`       | [`packages/contract`](./contract)             | [`SPEC.md`](./contract/SPEC.md)       | Zod schemas, infer types, mutation contracts, and Web API request validation                           |
| `@repo/database`       | [`packages/database`](./database)             | [`SPEC.md`](./database/SPEC.md)       | Kysely instance, master PostgreSQL/SQLite typings, and repository classes                              |
| `@repo/errors`         | [`packages/errors`](./errors)                 | [`SPEC.md`](./errors/SPEC.md)         | Canonical `AppError` base class, status code mappings, and error guards                                |
| `@repo/logger`         | [`packages/logger`](./logger)                 | [`SPEC.md`](./logger/SPEC.md)         | Structured JSON logging in production and human-readable dev logs                                      |
| `@repo/rate-limiter`   | [`packages/rate-limiter`](./rate-limiter)     | [`SPEC.md`](./rate-limiter/SPEC.md)   | Token bucket, fixed window, and sliding window rate limiters (Memory + Redis)                          |
| `@repo/redis`          | [`packages/redis`](./redis)                   | [`SPEC.md`](./redis/SPEC.md)          | L1 (In-Memory LRU) + L2 (Redis) caching, `CacheCategory`, and TTL registry                             |
| `@repo/supabase`       | [`packages/supabase`](./supabase)             | [`SPEC.md`](./supabase/SPEC.md)       | Client factories (`server`, `client`, `middleware`, `service-role`, `read-replica`) and migrations     |
| `@repo/theme`          | [`packages/theme`](./theme)                   | [`SPEC.md`](./theme/SPEC.md)          | 3-tier design token hierarchy, Glass UI custom properties (`--arch-glass-*`), and Tailwind preset      |
| `@repo/ui`             | [`packages/ui`](./ui)                         | [`SPEC.md`](./ui/SPEC.md)             | Accessible React primitives (`GlassCard`, `GlassButton`, `DataGrid`, `PageHeader`, `DepartmentLayout`) |
| `@repo/utils`          | [`packages/utils`](./utils)                   | [`SPEC.md`](./utils/SPEC.md)          | 3-shift mining operational time logic, Excel import/export helpers, and Inngest event constants        |
| `@repo/departments-ui` | [`packages/departments/ui`](./departments/ui) | [`SPEC.md`](./departments/ui/SPEC.md) | Barrel export and component namespace for department UI widgets                                        |

---

## Build Dependency Order

1. Foundation: `@repo/typescript-config`, `@repo/eslint-config`
2. Types & Contracts: `@repo/acl`, `@repo/contract`, `@repo/errors`
3. Data Layer: `@repo/supabase`, `@repo/database`, `@repo/redis`
4. Utilities: `@repo/utils`, `@repo/logger`, `@repo/rate-limiter`
5. UI Foundation: `@repo/theme`, `@repo/ui`
6. Application: `apps/portal`
