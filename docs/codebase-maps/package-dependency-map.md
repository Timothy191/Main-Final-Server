# Package Dependency Map

Build / test dependency order across the monorepo. Test a package only after
its dependencies are built: `pnpm build --filter <dep>` first.

```mermaid
graph LR
    classDef base fill:#1e293b,stroke:#94a3b8,stroke-width:1px,color:#e2e8f0;
    classDef contract fill:#1e293b,stroke:#0ea5e9,stroke-width:2px,color:#fff;
    classDef data fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef util fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef ui fill:#1e293b,stroke:#a855f7,stroke-width:2px,color:#fff;

    TSC["@repo/typescript-config"]:::base
    ESC["@repo/eslint-config"]:::base
    JEST["@repo/jest-config"]:::base

    ACL["@repo/acl"]:::contract
    CON["@repo/contract"]:::contract
    ERR["@repo/errors"]:::contract

    SUP["@repo/supabase"]:::data
    DB["@repo/database (Kysely types)"]:::data
    RED["@repo/redis"]:::data

    UTIL["@repo/utils"]:::util
    LOG["@repo/logger"]:::util
    RL["@repo/rate-limiter"]:::util

    THEME["@repo/theme"]:::ui
    UI["@repo/ui"]:::ui
    DEPTUI["@repo/departments/ui"]:::ui

    PORTAL["apps/portal (Next.js 16)"]

    TSC --> ACL
    TSC --> CON
    TSC --> DB
    TSC --> THEME
    ESC --> LOG
    JEST --> UI

    ACL --> SUP
    ACL --> PORTAL
    CON --> SUP
    CON --> PORTAL
    ERR --> PORTAL

    SUP --> DB
    SUP --> PORTAL
    RED --> PORTAL

    UTIL --> LOG
    UTIL --> RL
    UTIL --> PORTAL
    LOG --> PORTAL
    RL --> PORTAL

    THEME --> UI
    UI --> DEPTUI
    UI --> PORTAL
    DEPTUI --> PORTAL
```

## Canonical order

1. Foundation: `@repo/typescript-config`, `@repo/eslint-config`, `@repo/jest-config`
2. Types & contracts: `@repo/acl`, `@repo/contract`, `@repo/errors`
3. Data layer: `@repo/supabase`, `@repo/database`, `@repo/redis`
4. Utilities: `@repo/utils`, `@repo/logger`, `@repo/rate-limiter`
5. UI foundation: `@repo/theme`, `@repo/ui`, `@repo/departments/ui`
6. App: `apps/portal`

After a package change: `pnpm --filter <package> type-check && pnpm --filter <package> test`, then `pnpm exec turbo run type-check --filter ...^<package>`.
