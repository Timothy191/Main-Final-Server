# Arch System Monorepo Architecture Map

Visual layer overview of the **Arch-System** monorepo. For a concise map, see [`docs/codebase-maps/architecture-map.md`](./codebase-maps/architecture-map.md).

```mermaid
graph TD
    classDef frontend fill:#0f172a,stroke:#0ea5e9,stroke-width:2px,color:#fff;
    classDef backend fill:#0f172a,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef data fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef config fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#94a3b8;

    subgraph Frontend ["🎨 Frontend Layer"]
        Portal["apps/portal<br/>Next.js 16 • App Router • Turbopack"]:::frontend
        UI["packages/ui<br/>React Primitive Glass Components"]:::frontend
        Theme["packages/theme<br/>Design Tokens • Tailwind Preset"]:::frontend
        DeptUI["packages/departments/ui<br/>Shared Department Widgets"]:::frontend
    end

    subgraph Backend ["⚙️ Backend / BFF Layer"]
        EdgeProxy["apps/portal/src/proxy.ts<br/>Edge Middleware Auth"]:::backend
        ACL["packages/acl<br/>SSOT Route & Department Slugs"]:::backend
        Contract["packages/contract<br/>Zod Validation Schemas"]:::backend
        Redis["packages/redis<br/>L1/L2 Redis & LRU Cache"]:::backend
        RateLimiter["packages/rate-limiter<br/>Sliding Window Rate Limiting"]:::backend
        Scraper["packages/scraper<br/>Playwright Web Scraper API"]:::backend
        Errors["packages/errors<br/>Canonical AppError Base Classes"]:::backend
        Logger["packages/logger<br/>Structured Winston/Pino Logger"]:::backend
        Utils["packages/utils<br/>3-Shift Operations & Inngest Utils"]:::backend
    end

    subgraph Data ["🗄️ Data Layer"]
        Postgres["PostgreSQL + RLS<br/>Supabase Stack (Self-Hosted Docker)"]:::data
        Kysely["packages/database<br/>Kysely Query Builder & Types"]:::data
        SupabaseClient["packages/supabase<br/>Auth Clients • Migrations • Seeds"]:::data
    end

    Portal --> UI
    Portal --> Theme
    Portal --> DeptUI
    Portal --> EdgeProxy
    EdgeProxy --> ACL
    Portal --> Contract
    Portal --> Redis
    Portal --> RateLimiter
    Portal --> Kysely
    Kysely --> SupabaseClient
    SupabaseClient --> Postgres
```

---

## 🏗️ Architectural Layers

| Layer             | Purpose                                    | Key Packages                                                                                                                                                           |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | UI components, design system, portal app   | `apps/portal`, `packages/ui`, `packages/theme`, `packages/departments/ui`                                                                                              |
| **Backend / BFF** | Auth proxy, validation, caching, utilities | `proxy.ts`, `packages/acl`, `packages/contract`, `packages/redis`, `packages/rate-limiter`, `packages/scraper`, `packages/errors`, `packages/logger`, `packages/utils` |
| **Data**          | Database clients, types, migrations, RLS   | `packages/supabase`, `packages/database`, PostgreSQL + RLS                                                                                                             |

---

## ⚡ Key Architectural Invariants

```mermaid
flowchart LR
    subgraph Invariants ["🔒 Core Invariants"]
        Auth["Auth at Edge<br/>proxy.ts gates every request"]
        ACL["ACL as SSOT<br/>Single source of truth for roles"]
        Cache["Un-cached Auth<br/>Cached Data"]
        Kysely["Kysely = Types Only<br/>Runtime = Supabase Clients"]
        Agent["Agent Infra Out-of-Band<br/>.cursor, .agents, .claude"]
    end
```

| Invariant                       | Description                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Auth at Edge**                | Every request passes `proxy.ts` which imports ACL from `@repo/acl` — never redefine ACL logic inline                   |
| **ACL as SSOT**                 | Department slugs and roles defined once in `@repo/acl`                                                                 |
| **Un-cached Auth, Cached Data** | Validate auth in un-cached outer function; fetch data in inner cached function with `createAdminClient()` + `cacheTag` |
| **Kysely = Types Only**         | `@repo/database` generates types; runtime DB access goes through `@repo/supabase` clients                              |
| **Agent Infra Out-of-Band**     | `.cursor/`, `.agents/`, `.claude/` are never runtime dependencies of product code                                      |

---

## 🔗 Dependency Order (Build Sequence)

```mermaid
graph LR
    classDef base fill:#0f172a,stroke:#94a3b8,stroke-width:1px,color:#e2e8f0;
    classDef contract fill:#0f172a,stroke:#0ea5e9,stroke-width:2px,color:#fff;
    classDef data fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef util fill:#0f172a,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef ui fill:#0f172a,stroke:#a855f7,stroke-width:2px,color:#fff;

    TSC["@repo/typescript-config"]:::base
    ESC["@repo/eslint-config"]:::base
    JEST["@repo/jest-config"]:::base

    ACL["@repo/acl"]:::contract
    CON["@repo/contract"]:::contract
    ERR["@repo/errors"]:::contract

    SUP["@repo/supabase"]:::data
    DB["@repo/database"]:::data
    RED["@repo/redis"]:::data

    UTIL["@repo/utils"]:::util
    LOG["@repo/logger"]:::util
    RL["@repo/rate-limiter"]:::util

    THEME["@repo/theme"]:::ui
    UI["@repo/ui"]:::ui
    DEPTUI["@repo/departments/ui"]:::ui

    PORTAL["apps/portal"]:::ui

    TSC --> ACL & CON & DB & THEME
    ESC --> LOG
    JEST --> UI

    ACL --> SUP & PORTAL
    CON --> SUP & PORTAL
    ERR --> PORTAL

    SUP --> DB & PORTAL
    RED --> PORTAL

    UTIL --> LOG & RL & PORTAL
    LOG --> PORTAL
    RL --> PORTAL

    THEME --> UI
    UI --> DEPTUI & PORTAL
    DEPTUI --> PORTAL
```

**Canonical Build Order:**

1. **Foundation:** `@repo/typescript-config`, `@repo/eslint-config`, `@repo/jest-config`
2. **Types & Contracts:** `@repo/acl`, `@repo/contract`, `@repo/errors`
3. **Data Layer:** `@repo/supabase`, `@repo/database`, `@repo/redis`
4. **Utilities:** `@repo/utils`, `@repo/logger`, `@repo/rate-limiter`
5. **UI Foundation:** `@repo/theme`, `@repo/ui`, `@repo/departments/ui`
6. **App:** `apps/portal`

---

## ✅ Pre-Merge Quality Gates

```bash
# 1. Type Check and Lint (forced to bypass turbo cache)
pnpm exec turbo run lint type-check test --force

# 2. Full CI Gate Suite (13 checks)
pnpm gates
```

See [`docs/codebase-maps/ci-gates-map.md`](./codebase-maps/ci-gates-map.md) for the complete gate visualization.
