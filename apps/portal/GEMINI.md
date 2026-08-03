# Portal Application (Next.js)

The main mining operations portal built with Next.js 15+ (App Router) and React 19.

## 🚀 Key Commands

- `pnpm dev`: Start the portal dev server on `:3000`.
- `pnpm test`: Run Jest unit tests for the portal.
- `pnpm test:e2e`: Run Playwright E2E tests.
- `pnpm type-check`: Run TypeScript checks for the portal.

## 🛠️ Development Conventions

### Route Groups

The portal uses route groups to scope layouts:

- `(auth)/`: Login and password management.
- `(departments)/[department]/`: Dynamic department dashboards.
- `(hub)/`: Central landing page and executive view.
- `api/`: API routes (AI, export, sync, tools).

### Auth & Authorization

- **Server Components**: Use `getUserSafely()` from `@repo/supabase/server` to prevent crashes on stale sessions.
- **Proxy**: `proxy.ts` (renamed from `middleware.ts` in Next.js 16) handles session refresh and role-based route restrictions.
- **Authorization**: The `employees` table is the source of truth for roles and department access.

### AI Orchestration

- **Agent Graph**: LangGraph-based state machine in `lib/ai/agent-graph.ts`.
- **Modular Subsystem**: `lib/ai/` contains modules for chunking, embeddings, memory, and tools.

### Path Aliases

- `~/*` or `@/*` → `apps/portal/*`
- `@/app/*`, `@/features/*`, `@/components/*`, `@/lib/*`, `@/hooks/*` are mapped to their respective subdirectories.

### Testing

- **Unit**: Jest + Testing Library.
- **Coverage thresholds**: 40% lines, 30% branches.
- **E2E**: Playwright (requires `pnpm dev` running).

### Agent Tracing & Context Hand-off (MANDATORY RULE)

- **Workflow Traces**: All agents MUST update the `AGENT_TRACER.md` file in the root of the package/app they are modifying. You must log a timestamp, your purpose, the changes made, and what the next agent should know.
- **Context Breadcrumbs**: When implementing complex architectural logic, agents MUST leave inline `// AGENT-TRACE: <explanation>` or `/* AGENT-TRACE: ... */` comments. This ensures future AI agents understand the implicit business rules or domain context immediately upon reading the file.
- **Runtime Telemetry**: Where applicable, ensure functions are instrumented (e.g., `prom-client` or OpenTelemetry spans) so runtime behavior can be analyzed by subsequent debugging agents.
- **Shared Knowledge Base & Skills Maintenance**: When changing portal routes, APIs, auth, or startup procedures, update the shared knowledge base at `.agents/knowledge/` (repowiki; symlinked at `.qoder/repowiki`) — specifically `.agents/knowledge/architecture/portal-auth-and-routing.md` and `.agents/knowledge/architecture/ai-orchestration-and-memory.md`. Then update `.agents/knowledge/index.md` and run `pnpm ai check` to validate. Also update custom skills (like `run-portal`) in `.qoder/skills/`. See `.agents/knowledge/README.md` for the read/write protocol.
