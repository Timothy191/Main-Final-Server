# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Canonical policy:** the monorepo root `AGENTS.md` is the source of truth. **Shared knowledge base:** read and update `.agents/knowledge/` (repowiki) — start at `.agents/knowledge/index.md`; see `.agents/knowledge/README.md` for the read/write protocol.

## Next.js agent rules

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

**Keep this block, including in commits.** It is part of the project's agent setup, maintained by `next dev` for every agent that works here. If it appears as an uncommitted change, that is intentional — commit it as-is. Do not remove it to clean up a diff; it will be regenerated.

<!-- END:nextjs-agent-rules -->

## Repository context

- This directory is the `portal` Next.js application from the `arch-systems` monorepo. Its package name is `portal` and it expects to live at `apps/portal` inside a pnpm workspace that contains the `@repo/*` shared packages.
- It is currently detached from that workspace. `pnpm install` fails here because workspace dependencies (`@repo/*`) cannot be resolved and there is no `pnpm-lock.yaml` in this directory.
- The canonical monorepo root is the sibling `Arch-Mk2/` directory. To develop, test, build, or deploy, this directory must be placed at `apps/portal` inside that workspace, or commands must be run from the workspace root against the corresponding app path.

## Common commands

All commands use `pnpm`. Root monorepo scripts live in `Arch-Mk2/package.json`; this package's scripts are in `package.json`.

- `pnpm dev` — start the Next.js dev server with Turbopack on `0.0.0.0:3001` (open http://localhost:3001).
- `pnpm build` — build the portal (`next build`). Standalone output is only generated when `CI=true` or `ENABLE_HEAVY_PLUGINS=true`.
- `pnpm start` — start the production server (serves on `PORT`, default 3000).
- `pnpm test` — run the Jest suite (`--runInBand --forceExit`). Run a single test with `pnpm test -- proxy.test.ts` or `pnpm test -- --testPathPattern=proxy`.
- `pnpm lint` — run ESLint with the repo config (`@repo/eslint-config/next`).
- `pnpm type-check` — run `tsc --noEmit`.
- `pnpm build:analyze` — build with the bundle analyzer enabled (`ANALYZE=true`).

## Architecture

- Next.js 16.3.0-canary.78 + React 19 + TypeScript + Tailwind CSS. The Tailwind config is re-exported from `@repo/theme/tailwind`.
- App Router under `app/`. Route groups:
  - `(auth)/` — login and password flows.
  - `(hub)/` — landing/executive view.
  - `(departments)/` — static department subfolders (drilling, production, safety, etc.) that wrap shared feature modules from `features/departments/`.
  - `admin/`
  - `api/` — API routes, including `api/backend/[[...slug]]` which proxies all HTTP methods to the NestJS backend (`API_BASE_URL`, default `http://localhost:3004/api`) so the browser talks to a single origin.
- `next.config.mjs` rewrites many `/api/*` routes to `API_URL`, sets CSP/security headers, static cache policies, PWA (`next-pwa`), Sentry source maps, bundle analyzer, and experimental Next.js features.
- Authentication/authorization:
  - `proxy.ts` contains the central session, role, department, and route-restriction logic. In this codebase it is the successor to the old `middleware.ts` file.
  - The `employees` table is the source of truth for roles and department access.
  - Server Components should use `getUserSafely()` from `@repo/supabase/server`.
- `instrumentation.ts` registers Sentry for both `nodejs` and `edge` runtimes.
- Code organization:
  - `app/` — routes and thin wrappers.
  - `features/` — domain modules (departments, hub, admin, analytics, webhooks, access-control).
  - `lib/` — shared utilities (data, cache, sync, errors, validations, observability, analytics, plugins, AI).
  - `components/` — UI components grouped by domain.
  - `plugins/rust-telemetry-engine/` — Rust plugin.
- The app expects external services at runtime: Supabase, Redis, Ollama, and the NestJS API. See `.env.example`, `.env.production.example`, and `.env.portal.compose.example`.

## Testing

- Jest with `@swc/jest` and `jsdom`. Setup in `setupTests.ts` mocks `@repo/redis` and `window.matchMedia` / `IntersectionObserver`.
- Module name mappings in `jest.config.js` resolve `@repo/*` to `../../packages/*/src/...`, so tests must run from the `apps/portal` position in the monorepo.
- Coverage is collected from `lib/`, `features/`, `app/`, `components/`, `hooks/`, and `proxy.ts`.

## Build / deployment notes

- `next build` embeds build-time env vars. In CI/production (`CI=true` or `ENABLE_HEAVY_PLUGINS=true`) it emits standalone output for the distroless Docker image.
- `SKIP_TYPE_CHECK=true` skips TypeScript errors during the build.
- Sentry source-map upload only happens in CI.
- `deploy.sh` installs dependencies, builds, starts the server on port 3000, and opens `/login`. Because this directory is not a standalone workspace, the script only works when the app is inside the monorepo.
- `Dockerfile` is a multi-stage Turbo/pruned build that assumes the build context is the monorepo root and the app is at `apps/portal`.
- `deploy-server.sh` (preferred) performs the same steps but verifies the pnpm workspace first and fails with a clear message if the app is not inside a workspace.

## Agent tracing (mandatory)

When modifying code in this app:

1. Update `AGENT_TRACER.md` with a dated entry: agent, purpose, changes made, and notes for the next agent.
2. Leave `// AGENT-TRACE: <explanation>` or `/* AGENT-TRACE: ... */` breadcrumbs for complex or non-obvious logic.

This is required by the project tracing rules; skipping it will break context hand-off for future agents.

## Environment quick reference

Important env vars (see the `.env*` files for full templates):

- `API_URL`, `API_BASE_URL`, `NEXT_PUBLIC_API_URL` — NestJS backend.
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY` — Supabase.
- `REDIS_URL`, `REDIS_PASSWORD` — Redis.
- `OLLAMA_URL`, `OLLAMA_EMBED_MODEL` — local LLM.
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` — Sentry.
