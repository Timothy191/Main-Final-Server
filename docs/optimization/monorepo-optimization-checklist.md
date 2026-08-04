# Next.js 16+ & Turborepo Monorepo Optimization Guide

This guide details the complete optimization architecture and developer/agent checklist for Arch-System—a Next.js 16+ App Router application running inside a pnpm 9 workspace with Turborepo.

---

## 1. Build & Development Speed (Monorepo-wide)

### 1.1 Turborepo Caching & Parallelisation

- **Task Pipeline (`turbo.json`)**: All tasks (`build`, `dev`, `lint`, `type-check`, `test`, `quality`) are defined in `turbo.json`.
- **Inputs & Outputs**: Builds output `.next/**` and `dist/**` while excluding `.next/cache/**` from output archives.
- **Cache Invalidation**: `globalDependencies` includes `.env*`, `tsconfig.json`, `AGENTS.md`, and all package `AGENTS.md` files.
- **Filtered CI Runs**: Execute `pnpm exec turbo run build --filter=[HEAD^1]` or `--filter=portal` to only build affected packages.

### 1.2 pnpm Workspace Protocols & Strictness

- **`workspace:*` Protocol**: Internal dependencies between `@repo/*` packages and `apps/portal` use the `workspace:*` protocol.
- **Strict `.npmrc` Settings**:
  ```ini
  shamefully-hoist=false
  strict-peer-dependencies=true
  auto-install-peers=true
  public-hoist-pattern[]=*eslint*
  ```
- **Targeted Filtering**: Use `pnpm --filter <package> <command>` (e.g. `pnpm --filter portal test`) for fast feedback loops.

### 1.3 Shared Tooling Configs

- **Central Config Packages**: Shared base configs live in:
  - `packages/typescript-config`: TS presets (`base.json`, `nextjs.json`, `react-library.json`).
  - `packages/eslint-config`: Shared ESLint rules.
  - `packages/theme`: Shared design tokens & Tailwind presets.
- **Next.js Config Merging**: Base Next.js config in `apps/portal/next.config.mjs` configures image patterns, headers, transpilePackages, and experimental features.

---

## 2. Next.js 16+ App Router Performance

### 2.1 React Server Components (RSC) by Default

- Keep components server-side unless interactivity (`useState`, `useEffect`, browser events) is strictly required.
- Place `'use client'` directives only at the leaf nodes of component trees.

### 2.2 Streaming & Suspense Boundaries

- Wrap expensive data-fetching components in `<Suspense fallback={<Skeleton />}>` to enable chunked HTML streaming.
- Use route-segment `loading.tsx` files for instant page shell delivery.
- Set `X-Accel-Buffering: no` in server response headers so Nginx/proxies don't buffer SSE/RSC streaming chunks.

### 2.3 Partial Prerendering (PPR)

- Enabled in `next.config.mjs`: `experimental.ppr = true`.
- Prerenders static shells at build time and streams dynamic holes on request.

### 2.4 Images & Fonts

- **`next/image`**: Configured with AVIF and WebP formats (`formats: ['image/avif', 'image/webp']`) and whitelisted `remotePatterns`.
- **`next/font`**: Inter, Roboto Mono, and Outfit configured with `display: 'swap'` and subset support.

### 2.5 Route Handlers & Middleware

- Edge middleware in `apps/portal/src/proxy.ts` handles light ACL & session validation.
- Heavy business logic stays in Node.js Route Handlers (`/api/...`) or Server Actions.

---

## 3. Data Fetching & Caching Strategy

### 3.1 React `cache()` and `fetch()` Deduplication

- `fetch()` requests within the same render pass are automatically deduplicated.
- Database & Kysely queries are wrapped with `import { cache } from 'react'` in server files.

### 3.2 Incremental Static Regeneration (ISR) with Tags

- Use Next.js cache tags (`cacheTag`, `cacheLife`) alongside `@repo/redis` L1 (RAM) + L2 (Redis) caching.
- Mutating Server Actions call `revalidateTag(...)` or `revalidatePath(...)` immediately to keep caches fresh.

### 3.3 Server Actions Optimisation

- Server actions reside in `actions.ts` files and are imported into client components.
- Validate inputs using Zod schemas from `@repo/contract`.

---

## 4. Bundle Size & Code Optimisation

### 4.1 Tree-shaking & Barrel File Discipline

- Avoid blanket imports from root index barrel files. Import components from specific files:
  `import { Button } from '@repo/ui/components/ui/button'`
- Package dependencies specify `"sideEffects": false` where applicable.

### 4.2 Modular Imports & Dynamic Loading

- Configure `experimental.optimizePackageImports` in `next.config.mjs` for heavy libraries:
  `["framer-motion", "lucide-react", "date-fns", "recharts"]`
- Use `next/dynamic` for heavy client-side-only components.

### 4.3 Bundle Analysis

- Integrated `@next/bundle-analyzer` in `apps/portal/next.config.mjs` with `experimental.webVitalsAttribution: ["CLS", "LCP", "FCP", "TTFB", "INP"]`.
- Run `pnpm analyze` (or `pnpm --filter portal build:analyze`) to build and launch interactive visualizations (`client.html` and `server.html`).
- Use `client.html` to locate oversized client dependencies and replace or dynamically load them using `next/dynamic`.

### 4.4 Targeted Low INP (Interaction to Next Paint) Techniques ($\le 200\text{ ms}$)

1. **Defer Non-Urgent Work (`startTransition` / `useTransition`)**:
   - Wrap expensive visual/data filtering in React's `startTransition` to yield the main thread while updating input fields immediately.
2. **Yield Main Thread (`yieldToMain`)**:
   - Helper utility exported from `@repo/utils` (`yieldToMain`) that uses `window.scheduler.yield()` (with `setTimeout(0)` fallback) to split long CPU tasks into <50ms chunks.
3. **Move Heavy Third-Party Work**:
   - Use Next.js `<Script strategy="lazyOnload">` or worker-offloading (`partytown` / Web Workers) for heavy analytics and background scripts.
4. **DOM Virtualization & Deferred Layout**:
   - Use `@tanstack/react-virtual` for huge tables/lists.
   - Apply `.lazy-section` (`content-visibility: auto; contain-intrinsic-size: 1px 500px;`) to off-screen sections to skip layout calculations until scrolled into view.

---

## 5. Monorepo-Specific Next.js Optimisations

### 5.1 Transpile Internal Packages

- `next.config.mjs` transpiles internal packages:
  ```js
  transpilePackages: [
    '@repo/ui',
    '@repo/supabase',
    '@repo/utils',
    '@repo/theme',
    '@repo/rate-limiter',
    '@repo/logger',
    '@repo/contract',
    '@repo/database',
  ]
  ```

### 5.2 Workspace Type Checking

- Run `pnpm exec turbo run type-check --force` across all workspace packages.
- Shared `tsconfig.json` extends base presets with strict type enforcement.

### 5.3 Shared Environment Variables

- Root `.env` / `.env.production` define monorepo-wide environment keys (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, etc.).
- Marked under `globalEnv` and `globalDependencies` in `turbo.json`.

---

## 6. Deployment & CI/CD

### 6.1 Turborepo Remote Caching

- Connect CI to Vercel Remote Cache or S3 backend.
- Use `turbo prune --scope=portal` to produce isolated build artifacts.

### 6.2 Incremental Builds

- Build portal using `pnpm build --filter=portal`.

### 6.3 Runtime Environments

- Route handlers specify runtime (`export const runtime = 'edge'` or `'nodejs'`) based on workload needs.

---

## 7. Developer Experience & AI Agent Integration

### 7.1 Agent Rules & Conventions (`AGENTS.md` / `CLAUDE.md`)

- Always use `next/image` and `next/font`.
- Keep components server-side unless client state/events are required.
- Direct import from specific UI components instead of barrel files.
- Run `pnpm exec turbo run lint type-check test --force` and `pnpm format:check` before completing tasks.

### 7.2 Verification & Traceability

- Maintain `.agents/AGENT_TRACER.md` and `apps/portal/AGENT_TRACER.md`.
- Append entry to `docs/REPO-CHANGE-INDEX.md` after work completion.
