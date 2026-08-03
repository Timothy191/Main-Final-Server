# Monorepo Structure Map

## Directory Layout Map

```text
/home/timothy/Projects/
├── apps/
│   ├── portal/                    # Primary Next.js 16 App Router UI application
│   │   ├── e2e/                   # Playwright visual regression and E2E tests
│   │   ├── proxy.ts               # Next.js 16 Proxy Middleware (Auth & Dept ACL)
│   │   ├── src/
│   │   │   ├── app/               # App Router pages, layouts, & API routes
│   │   │   │   ├── (auth)/        # Auth route group (login, reset, update)
│   │   │   │   ├── (departments)/ # Department route groups (drilling, safety, control-room, etc.)
│   │   │   │   ├── api/           # API Route Handlers (auth, health, metrics, webhooks)
│   │   │   │   └── layout.tsx     # Root portal layout with theme providers
│   │   │   ├── components/        # UI components & system overlays (ArchStartMenu, CommandBar)
│   │   │   ├── features/          # Feature-based domain components (hub, auth)
│   │   │   ├── hooks/             # React hooks (metrics, offline queue, performance)
│   │   │   └── lib/               # Shared portal business logic & API helpers
│   ├── ops-gateway/               # Control-plane MCP dispatcher, bridge, & event subscriber
│   └── api-gateway/               # API Gateway services
│
├── packages/                      # Framework-agnostic shared libraries
│   ├── contract/                  # Zod validation schemas & typed API contracts
│   ├── database/                  # Kysely DB access layer & migrations
│   ├── departments/               # Shared department domain definitions & UI
│   ├── errors/                    # AppError, NotFoundError, InternalError classes
│   ├── logger/                    # Structured server & client logger
│   ├── rate-limiter/              # Token bucket & sliding window rate limiting
│   ├── redis/                     # L1/L2 Redis caching library & Cache singleton
│   ├── supabase/                  # Supabase auth, server/client clients, & read-replica
│   ├── theme/                     # Tailwind design system tokens & macOS white palette
│   ├── typescript-config/         # Shared tsconfig bases
│   └── ui/                        # Shared primitive UI components (GlassCard, Button)
│
├── .agents/                       # Shared cross-agent knowledge base & skills
│   ├── knowledge/                 # Single source of truth (index.md, architecture, patterns)
│   └── skills/                    # Frontend checklist & system skills
│
├── .claude/                       # Claude Code harness rules & scripts
├── .cursor/                       # Cursor rules & hooks
├── docs/                          # Architecture guides & research documents
├── scripts/                       # Dev, smoke-test, quality, and maintenance scripts
├── turbo.json                     # Turborepo build pipeline
└── package.json                   # Root monorepo workspace configuration
```

---

## Architectural Boundary Rules

1. **Packages Never Import from Apps:** Files inside `packages/*` MUST NEVER import from `apps/*`.
2. **Product vs. Agentic AI Split:** Code under `apps/` and `packages/` represents product runtime code; `.agents/`, `.claude/`, and `.cursor/` represent agentic AI surface definitions.
3. **Spec-First Requirement:** Every multi-file feature addition requires a spec in `.kiro/specs/<feature-slug>/` before implementation.
