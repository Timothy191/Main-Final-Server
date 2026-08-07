# Indexed Codebase Map

High-level visual flow of a request through the Arch-System monorepo, inspired by node-based flow tools like Red-Node and N8n.

```mermaid
flowchart LR
    %% Define node styles
    classDef user fill:#f97316,stroke:#ea580c,stroke-width:2px,color:#fff;
    classDef browser fill:#fb923c,stroke:#fd7e14,stroke-width:2px,color:#fff;
    classDef app fill:#60a5fa,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef proxy fill:#a78bfa,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef acl fill:#34d399,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef api fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#111;
    classDef server fill:#fbbf24,stroke:#f5e0b,stroke-width:2px,color:#111;
    classDef cache fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff;
    classDef db fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff;
    classDef postgres fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff;

    %% Nodes
    User[User]:::user
    Browser[Browser]:::browser
    NextJS[Next.js App<br/>(apps/portal)]:::app
    EdgeProxy[Edge Proxy<br/>(apps/portal/src/proxy.ts)]:::proxy
    ACL[ACL<br/>(@repo/acl)]:::acl
    APIRoutes[API Routes<br/>(apps/portal/app/api/*)]:::api
    ServerComp[Server Components/Actions<br/>(apps/portal/app/**)]:::server
    Cache[Redis Cache<br/>(@repo/redis)]:::cache
    DBLayer[Database Layer<br/>(@repo/supabase, @repo/database)]:::db
    PostgreSQL[PostgreSQL + RLS<br/>(Self-Hosted Docker)]:::postgres

    %% Flow
    User --> Browser
    Browser --> NextJS
    NextJS --> EdgeProxy
    EdgeProxy --> ACL
    ACL -->|Authenticated & Authorized| APIRoutes
    ACL -->|Authenticated & Authorized| ServerComp
    APIRoutes --> Cache
    ServerComp --> Cache
    Cache -->|Hit| APIRoutes
    Cache -->|Hit| ServerComp
    Cache -->|Miss| DBLayer
    DBLayer --> PostgreSQL
    PostgreSQL -->|Data| DBLayer
    DBLayer -->|Data| Cache
    Cache -->|Data| APIRoutes
    Cache -->|Data| ServerComp
    APIRoutes -->|Response| NextJS
    ServerComp -->|Response| NextJS
    NextJS --> Browser
    Browser --> User

    %% Styling for labels (optional, Mermaid doesn't support direct label styling in flowchart)
    %% But we can use HTML-like labels in the node definitions above.
```

## �� 📦 Key Packages by Layer

| Layer                 | Packages                                                              |
| --------------------- | --------------------------------------------------------------------- |
| **Foundation**        | `@repo/typescript-config`, `@repo/eslint-config`, `@repo/jest-config` |
| **Types & Contracts** | `@repo/acl`, `@repo/contract`, `@repo/errors`                         |
| **Data Layer**        | `@repo/supabase`, `@repo/database`, `@repo/redis`                     |
| **Utilities**         | `@repo/utils`, `@repo/logger`, `@repo/rate-limiter`                   |
| **UI Foundation**     | `@repo/theme`, `@repo/ui`, `@repo/departments/ui`                     |
| **Tooling**           | `tools/` (guards, scripts), `scripts/`, `.agents/`, `.claude/`        |

## �� 🗺��️ Related Visual Maps

- [Detailed Architecture Map](./docs/ARCHITECTURE-MAP.md) - Layered view with Mermaid diagrams
- [Codebase Maps Collection](./docs/codebase-maps/README.md) - 7 specialized Mermaid maps (architecture, request flow, package deps, etc.)
- [WAYFINDER.md](./docs/WAYFINDER.md) - Navigation guide to all documentation

## �� 💡 How to Read This Map

- **Nodes** represent major components or layers
- **Arrows** show the flow of a request (solid lines) and data/cache flow (dashed lines where implied)
- **Colors** indicate functional layers:
  - Orange: User/Browser interaction
  - Blue: Application framework (Next.js)
  - Purple: Proxy and security layers
  - Green: Access control and routing
  - Yellow: API and server logic
  - Pink: Caching layer
  - Violet: Database and persistence
- **Text inside nodes** shows the component name and its primary location in the codebase

> _This map provides a high-level flow overview. For detailed package dependencies, layer interactions, and specific implementation points, refer to the linked maps above._
