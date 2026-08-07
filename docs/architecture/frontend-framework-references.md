# Next.js / React Front-End Framework Reference

> **Source references:**
>
> 1. Lazuardy, M. F. S. & Anggraini, D. (2022). _Modern Front End Web Architectures with React.Js and Next.Js._ International Research Journal of Advanced Engineering and Science (IRJAES), Volume 7, Issue 1, pp. 132–141. ISSN (Online): 2455-9024. (`Next.js_frontend.pdf`)
> 2. Riva, M. (2022). _Real-World Next.js: Build scalable, high-performance, and modern web applications using Next.js, the React framework for production._ Packt Publishing. ISBN 978-1-80107-349-3. (`Next.js_frontend(2).pdf`)
>
> **Adaptation note:** both sources were published for the **Next.js 12 / Pages Router** era. This monorepo runs **Next.js 16 (App Router + Turbopack), React 19**. Where a legacy API appears, the equivalent App Router construct is given. For the core rendering-strategies deep dive (CSR / SSR / SSG / ISR and the Pages→App mapping table), see [`rendering-strategies-guide.md`](./rendering-strategies-guide.md) — this document is the attributed, chapter-by-chapter companion.

---

## 1. The Paper in One Screenful: React.js vs Next.js

The IRJAES paper compares React.js (a client-side UI library) with Next.js (a React framework for production) in the context of building the SIASN Indonesian government web app. Its core thesis and takeaways:

| Concern          | React.js (CSR-focused)                                | Next.js (server-first)                  |
| :--------------- | :---------------------------------------------------- | :-------------------------------------- |
| Rendering        | Client-Side Rendering (CSR) by default                | SSR **and** SSG/ISR by default          |
| SEO / indexing   | Weak — empty HTML shell until hydration               | Strong — pre-rendered HTML for crawlers |
| Initial load     | "White screen" while JS bundles download              | Instant markup (prerendered HTML)       |
| Routing          | Third-party (`react-router-dom`)                      | Filesystem-based, zero config           |
| State on refresh | **Lost** — must persist to `localStorage` (~5 MB cap) | Survives via server re-render / refetch |

**Practical takeaways that still hold today (projected to App Router):**

- Choose server-first rendering for **public, SEO-relevant, or content-heavy routes** (RSC by default in this repo).
- Keep **client components only for interactive leaves** (forms, dashboards, live feeds) — matches the repo rule _"RSC by default; `'use client'` only on interactive leaf components"_.
- Persist ephemeral client state deliberately (the paper's `localStorage` caveat) — in this repo, cross-session/API state goes through `@repo/redis` (L1/L2) or the page-appropriate Supabase source, **not** brittle client storage.

---

## 2. Real-World Next.js — Chapter-by-Chapter Guidance (mapped to this monorepo)

Each chapter summary below notes what still applies to `apps/portal` and what changed in App Router.

### Ch 1–2 · Intro + Rendering Strategies

- Choosing a rendering strategy is a **per-route** decision. SSR for dynamic/authenticated, SSG/ISR for static content, CSR for interactive app-shell.
- **App Router mapping:** Server Components render on the server by default; `generateStaticParams()` replaces `getStaticPaths`; `next: { revalidate }` / `"use cache"` replace ISR `revalidate`.
- **Repo application:** department dashboards are Server Components; the SCADA/telemetry feed uses a **client** cache hook (`useControlRoomCache`) because it is an interactive live feed. See [`rendering-strategies-guide.md`](./rendering-strategies-guide.md) §2.

### Ch 3 · Routing, Image Optimization, Metadata

- **Routing:** file-based; dynamic segments via `[param]` folders. In App Router this includes **route groups** `(x)` and **parallel/intercepted** routes.
- **Repo application:** `app/(departments)/[department]/` uses a route group; the department slug is validated at the edge (`proxy.ts`) against `@repo/acl` (SSOT).
- **Metadata:** App Router `generateMetadata()` (type-safe) replaces the legacy `next/head`/`<Head>` — the repo uses metadata exports on its layouts/pages.
- **Images:** `next/image` (automatic optimization, AVIF/WebP, layout stability → CLS) — the repo mandates `next/image` + `next/font` for all imagery/typography.

### Ch 4 · Code Organization & Data Fetching

- Organize by **feature/domain**, separate components, utilities, static assets, styles, and a `lib/` layer.
- **Server-side fetching** with secrets kept server-side; **client-side fetching** via hooks for interactive decoupled data.
- **Repo application:** this maps directly to the repo's structure — `src/app` (routes) → `src/features/<domain>` (thin routes, fat features) → `src/lib` (business logic), `src/components`, shared `packages/*`. Server data flows through `@repo/supabase` (server clients); there is **no BFF `/api/backend/*` proxy** — the portal exposes its own `/api/*` handlers and reads the DB directly.

### Ch 5 · State Management (Local + Global)

- **Local:** `useState`/`useReducer` for component-scoped UI.
- **Global:** Context for medium/static shared state; Redux/Zustand for high-frequency complex slices; a normalized cache (Apollo) for GraphQL.
- **Repo application:** local UI with `useState`; global theme/localization-style context; **cross-runtime data caching is delegated to `@repo/redis`** (L1 heap 15s + L2 Redis) + Next.js cache tags, rather than a monolithic client store. Client-side per-domain caching (e.g. the control-room telemetry cache) is done with purpose-built hooks.

### Ch 6 · CSS & Built-in Styling

- Styled JSX / CSS Modules / SASS are legacy options.
- **Repo application:** styling is **Tailwind + design tokens** via `@repo/theme` (`packages/theme/src/css/variables.css`, the `--arch-*`/glass schema) and shared components in `@repo/ui`. **Never** run `generate-tokens.mjs` for CSS edits; hand-edit `variables.css`, and follow `docs/design-system/RULES.md`.

### Ch 7 · UI Framework Libraries

- Chakra UI / Tailwind / Headless UI integrate well with Next.js.
- **Repo application:** `@repo/ui` provides the glass design-system primitives (`GlassCard`, `Button`, `Table`, …) built on the theme tokens — the equivalent "UI framework" layer. Add new primitives there, not inline per page.

### Ch 8 · Custom Server

- A custom Node server (Express/Fastify) is **sometimes** justified but prevents serverless deployment and adds ops burden.
- **Repo application:** the portal uses **Next.js standalone output + nginx reverse proxy** (see `devops/`) — no custom Node/Express server in the request path. Keep it that way; only reintroduce a custom server for WebSockets/persistent daemons (none at runtime today).

### Ch 9 · Testing

- **Unit/integration** (Jest) + **E2E** (Cypress in the book).
- **Repo application:** Jest + `@swc/jest` + `@testing-library/react` for unit/integration (`pnpm --filter portal test`), and **Playwright** for visual regression (`apps/portal/e2e/`). Coverage thresholds are enforced in `apps/portal/jest.config.cjs`.

### Ch 10 · SEO & Performance

- Choose rendering for LCP/INP/CLS (Core Web Vitals) and SEO; keep meta tags complete.
- **Repo application:** `generateMetadata()` for SEO; the `docs/performance-insights/` set is a per-metric playbook (LCP, INP, CLS, images, fonts, modern-http…). Caching strategy lives in `docs/HYBRID-CACHE-MAP.md` and `packages/redis/AGENTS.md`; pair `revalidateTag` with `cache.invalidateTags`.

### Ch 11 · Deployment Platforms

- Vercel (serverless), static CDN, raw server, Docker.
- **Repo application:** self-hosted via `deploy-production.sh`, Docker, and nginx (`devops/`); CI in `.github/workflows/portal-ci.yml`. On-prem/local-first Supabase stack (`pnpm supabase:start`) — never depend on remote cloud links.

### Ch 12 · Authentication & User Session

- JWT/session cookies; managed identity (Auth0) vs custom.
- **Repo application:** auth is enforced **at the edge** in `apps/portal/src/proxy.ts` (Next.js 16 edge middleware, live session refresh via `@repo/supabase`), with **department ACL from `@repo/acl`** as the single source of truth. Never reimplement ACL inline.

### Ch 13 · E-Commerce (GraphCMS + Stripe)

- Headless CMS + payments; the **API-proxy** pattern keeps secret keys server-side.
- **Repo application:** not directly applicable (no storefront), but the **secure API-proxy pattern** is — secret-bearing calls must go through server handlers / server actions, never the browser. See [`rendering-strategies-guide.md`](./rendering-strategies-guide.md) §5.2.

### Ch 14 · Example Projects & Next Steps

- Practice on real examples to internalize patterns; prefer typed (TypeScript) development everywhere.

---

## 3. Decision Checklist (How to Apply These References)

When building a new route/feature in `apps/portal`:

1. **Default to Server Components**; add `'use client'` only on interactive leaves.
2. Pick the rendering mode per route: static / `generateStaticParams` for static; dynamic (request-dependent) for authenticated/real-time; `"use cache"` / `next: revalidate` for ISR-style.
3. **Auth at the edge** — never duplicate ACL logic; import from `@repo/acl` in `proxy.ts`.
4. **Fetch server-side** via `@repo/supabase` and cache with `@repo/redis` + cache tags; keep secrets out of the client bundle.
5. **State:** local `useState` for UI; Redux/Context only for genuinely shared slices; client data caches via purpose-built hooks.
6. **Styling/UI:** use `@repo/theme` tokens + `@repo/ui` primitives — no ad-hoc styling, per design-system rules.
7. **Validate** with portal Jest unit tests + Playwright visual tests; run the full quality gate before "done".

---

## 4. Cross-References

- [`rendering-strategies-guide.md`](./rendering-strategies-guide.md) — CSR/SSR/SSG/ISR deep dive + Pages→App mapping table (both sources).
- [`../optimization/nextjs-optimization-reference.md`](../optimization/nextjs-optimization-reference.md) — Next.js performance/optimization specifics.
- [`../app/getting-started/upgrading.md`](../app/getting-started/upgrading.md) — Next.js 16 upgrade guide.
- `apps/portal/AGENTS.md` / `docs/ARCHITECTURE-MAP.md` — this repo's actual request path and architecture.
