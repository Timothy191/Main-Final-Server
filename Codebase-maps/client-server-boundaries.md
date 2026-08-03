# Client/Server Boundaries & Runtime Data Map

## 1. Overview

The **Arch Systems Portal** enforces strict runtime data and code boundaries between Next.js 16 Server Components (RSC), Client Components (`'use client'`), and Server Actions (`'use server'`).

---

## 2. Component & Boundary Topology

```text
[ Browser Context ]
   │
   ├── Client Components ('use client')
   │     ├── Interactive UI: LoginForm, CommandBar, GlassCard, SystemClock, DepartmentCard
   │     ├── Client Hooks: useAdaptivePerformance, useSystemMetrics, useOfflineQueue
   │     └── Client Providers: ClientProviders.tsx, SmoothScrollProvider
   │
   └── Server Action Invocation ── Calls server actions over encrypted RPC
               │
               ▼
[ Node.js Server Context ]
   │
   ├── Server Components (RSC - Default)
   │     ├── Layouts: App Layout, Department Layouts, Hub Layout
   │     ├── Pages: Dashboard pages, document viewers, static admin grids
   │     └── Data Fetching: Direct DB access, L1/L2 Cache mesh, RLS queries
   │
   ├── Server Actions ('use server')
   │     ├── User Mutations: loginAction, resetPasswordAction, updateAccessCardAction
   │     └── Ops Actions: triggerAuditAction, clearCacheAction
   │
   └── API Route Handlers (/api/*)
         └── REST JSON APIs, Prometheus scraper, Inngest job handler, Webhooks
```

---

## 3. Server Action Isolation Protocol

### Client Bundle Contamination Risk

Importing Server Actions directly from files containing heavy server-side libraries (e.g., `@react-pdf/renderer`, `inngest`, `kysely`, `@repo/database`) into Client Components triggers Turbopack bundler errors (`"module factory not available"`) or bloats client bundle size.

### Isolation Rules

1. **Dedicated Action Files**:
   - Store Server Actions in lightweight, dedicated action files (e.g., `actions.ts`, `logout-action.ts`).
   - Keep heavy server utilities (e.g., PDF generation, Inngest job definitions) in isolated server-only modules under `src/lib/` marked with `import 'server-only'`.

2. **File Structure Example**:

```text
src/
├── app/
│   └── (departments)/
│       └── access-card-actions/
│           ├── actions.ts             <-- Lightweight 'use server' file
│           ├── page.tsx                <-- Server Component (RSC)
│           └── CardActionsView.tsx     <-- Client Component ('use client')
└── lib/
    ├── pdf-generator.ts               <-- Heavy server-only module ('server-only')
    └── jobs/                          <-- Inngest background jobs
```

---

## 4. Boundary Rules & Best Practices

1. **Default to RSC**: All components in `src/app/` are React Server Components by default. Add `'use client'` only when interactive state (`useState`, `useEffect`), event handlers (`onClick`), or browser APIs are required.
2. **Prop Serialization**: Data passed from RSC to Client Components must be JSON-serializable (plain objects, strings, numbers, booleans). Do not pass database connection handles, class instances, or functions.
3. **No Secret Exposure**: Environment variables without `NEXT_PUBLIC_` prefix (e.g., `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`) must never be referenced inside `'use client'` files or sent to client bundles.
