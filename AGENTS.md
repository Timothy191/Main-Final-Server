# Repository Guidelines

## Project Overview

**Arch Systems Portal** is a Turborepo monorepo (pnpm 9, Node >=22) providing an enterprise mining portal built with Next.js 16 App Router. The system includes:

- **Supabase** (PostgreSQL, Auth, Realtime, Storage) for data and authentication
- **Redis** for caching and distributed rate limiting
- **Ops Gateway** as an MCP bridge/control-plane
- **API Gateway** with GraphQL Mesh layer
- **Portal UI** with strict server/client boundaries

## Architecture & Data Flow

The system follows a layered monorepo architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    apps/                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ portal       │  │ api-gateway  │  │ ops-gateway  │  │
│  │ (Next.js 16) │  │ (GraphQL)    │  │ (MCP bridge) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │
┌─────────┴─────────────────┴─────────────────┴──────────┐
│                    packages/ (@repo/*)                   │
│  ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ errors │ │ theme│ │  ui  │ │ utils│ │ supabase│      │
│  └────────┘ └──────┘ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User interacts with Next.js 16 App Router UI (`apps/portal`)
2. Server Actions and API routes handle business logic
3. Supabase provides PostgreSQL database, authentication, and real-time subscriptions
4. Redis handles distributed rate limiting and caching
5. API Gateway (`apps/api-gateway`) provides GraphQL Mesh layer
6. Ops Gateway (`apps/ops-gateway`) serves as MCP bridge/control-plane

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `apps/portal/` | Next.js 16 App Router portal application |
| `apps/api-gateway/` | GraphQL Mesh API gateway |
| `apps/ops-gateway/` | MCP bridge and control-plane |
| `packages/errors/` | AppError subclasses with Zod validation |
| `packages/theme/` | Design tokens and Tailwind preset |
| `packages/ui/` | shadcn-style UI primitives |
| `packages/utils/` | Shared utilities (caching, signing, rate limiting) |
| `packages/supabase/` | Supabase client/server integration |
| `packages/database/` | SQL migrations and database utilities |
| `packages/contract/` | API contracts and validation schemas |
| `packages/redis/` | Redis caching layer |
| `packages/rate-limiter/` | Rate limiting implementation |
| `packages/logger/` | Logging utilities |
| `packages/eslint-config/` | Shared ESLint configurations |
| `packages/typescript-config/` | Shared TypeScript configurations |
| `scripts/` | Development, validation, and deployment scripts |
| `.cursor/rules/` | Cursor agent rules and policies |
| `.cursor/skills/` | AI agent skills |
| `.cursor/agents/` | Project subagents |

## Development Commands

### Package Manager
```bash
pnpm 9          # Required package manager (never npm/yarn)
```

### Core Commands
```bash
pnpm dev        # Start development stack (Redis, Supabase, portal)
pnpm quality    # Run lint, type-check, and tests
pnpm build      # Build all packages
pnpm test       # Run all tests
pnpm lint       # Run ESLint
pnpm type-check # Run TypeScript type checking
```

### Portal-Specific
```bash
cd apps/portal
pnpm dev        # Start Next.js dev server with Turbopack
pnpm test       # Run portal tests
```

### AI System
```bash
pnpm ai          # Check AI system status
pnpm ai check    # Validate AI surfaces
pnpm ai fix      # Repair AI surfaces
```

### Agent Delegation
```bash
pnpm agent:delegate <agent> "<task>"  # Delegate to subagent
```

### Scripts
```bash
pnpm dev        # Start development stack (Redis → Supabase → Ops Gateway → Next.js portal)
pnpm shutdown   # Stop portal and optional infrastructure (Supabase, Redis)
pnpm portal-watchdog  # Monitor Next.js dev server, auto-restart on crash with cache clearing
pnpm smoke-test   # Validate health endpoints, routes, Supabase auth/realtime, Redis cache, and stack health
pnpm validate-env # Validate required environment variables before deployment
pnpm pre-flight   # Run pre-flight validation (type-check) and scope determination
```

## Code Conventions & Common Patterns

### Formatting & Linting
- **Formatter**: Prettier with consistent settings across packages
- **Linter**: ESLint with shared configs in `packages/eslint-config/`
- **Import Style**: Use `@repo/*` for package imports, `@/` for portal-internal imports
- **Line Length**: ~100 characters

### Naming Conventions
- **Files**: kebab-case for files (e.g., `rate-limit-middleware.ts`)
- **Components**: PascalCase (e.g., `LoginForm.tsx`)
- **Functions**: camelCase (e.g., `createServerSupabaseClient`)
- **Constants**: UPPER_SNAKE_CASE for true constants

### Error Handling
- Use `@repo/errors` AppError subclasses for domain errors
- Zod v3.24.0 for all input validation
- Never use `any` — use `unknown` with type guards
- Errors should be caught and transformed into AppError instances

### Async Patterns
- Server Actions for form submissions and mutations
- RSC (React Server Components) for data fetching
- `async/await` over Promise chains
- Proper error boundaries for client components

### State Management
- React Server Components for server-side data
- Client components for interactive UI
- Server Actions for mutations
- No client-side state libraries (keep it simple)

### Dependency Injection
- Import directly from `@repo/*` packages
- Supabase clients created via `createServerSupabaseClient` / `createBrowserSupabaseClient`
- Redis connections managed through `@repo/redis`

## Important Files

### Entry Points
- `apps/portal/src/app/layout.tsx` — Main layout with header/navigation
- `apps/portal/src/app/(auth)/login/page.tsx` — Login page
- `apps/portal/src/app/api/auth/login/route.ts` — Login API endpoint
- `apps/portal/src/lib/api/auth.ts` — Authentication middleware

### Configuration
- `package.json` — Root package definition (v1.5.1, private)
- `pnpm-workspace.yaml` — Workspace package list and security settings
- `turbo.json` — Task runner configuration
- `prisma/schema.prisma` — Database schema
- `prisma.config.ts` — Prisma configuration

### Key Modules
- `apps/portal/src/lib/api/rate-limit-middleware.ts` — Redis-backed rate limiting
- `apps/portal/src/lib/api/rate-limit-config.ts` — Rate limit configurations
- `apps/portal/src/features/auth/components/LoginForm.tsx` — Login form component
- `packages/errors/src/` — Error class hierarchy
- `packages/contract/validation/` — API validation schemas

## Runtime/Tooling Preferences

### Required Runtime
- **Node.js**: >=22 (tested with Node 24.15.0)
- **Package Manager**: pnpm 9 (pinned via Volta in `package.json`)
- **TypeScript**: Strict mode enabled across all packages

### Tooling Constraints
- **Never use npm or yarn** — pnpm 9 only
- **Icons**: lucide-react only
- **Toasts**: sonner only
- **UI Components**: Use `@repo/ui` primitives, not custom implementations
- **Validation**: Zod v3.24.0 for all external input
- **Errors**: `@repo/errors` AppError subclasses for domain errors

### Build Tooling
- **Bundler**: Turbopack (Next.js 16)
- **Task Runner**: Turborepo 2
- **Transpiler**: TypeScript with strict settings

## Testing & QA

### Test Framework
- **Jest** for unit and integration tests
- Tests organized by package in `__tests__/` directories

### Test Structure
```
packages/<package>/src/__tests__/     # Package tests
packages/database/tests/             # Database migration tests
apps/portal/src/lib/__tests__/       # Portal-specific tests
apps/portal/src/app/(departments)/<dept>/lib/__tests__/  # Department tests
```

### Running Tests
```bash
pnpm test                           # All tests
pnpm test --filter @repo/utils      # Specific package
pnpm test -- --watch                # Watch mode
```

### Coverage Expectations
- Domain logic: 100% coverage
- Error paths: Must be tested
- API routes: Test with mocked dependencies
- Database migrations: Include rollback safety checks

### Quality Gates
- `pnpm quality` runs lint + type-check + test
- Pre-commit hooks enforce quality checks
- Alignment score >= 80 required for completion
- `pnpm ai check` validates AI surfaces

## Additional Notes

### Portal-Specific Conventions
- Next.js 16 App Router with RSC
- Authentication via `proxy.ts` middleware
- Department routes under `src/app/(departments)/`
- Server Actions for mutations
- lucide-react for icons, sonner for toasts

### Agent System
- Cursor rules in `.cursor/rules/` enforce policies
- Subagents in `.cursor/agents/` for specialized tasks
- Skills in `.cursor/skills/` for reusable procedures
- Shared Knowledge Base .agents/knowledge/
- **Concurrent-agent coordination** via `scratch_board/` — every subagent that will mutate files MUST post a check-in there before its first write and remove it (or set `status: done`) on completion. Protocol: [`scratch_board/README.md`](scratch_board/README.md). Enforced by [`.qoder/rules/scratch-board.md`](.qoder/rules/scratch-board.md). Pattern evidence: [`.agents/knowledge/patterns/scratch-board-coordination.md`](.agents/knowledge/patterns/scratch-board-coordination.md).
- **Bash contract** for every subagent using `Bash` is fixed by [`.qoder/rules/agent-computer-interface.md`](.qoder/rules/agent-computer-interface.md) (output/runtime caps, no-TTY, forbidden-command set). Pattern: [`.agents/knowledge/patterns/agent-computer-interface.md`](.agents/knowledge/patterns/agent-computer-interface.md).

## Scripts Overview

The `scripts/` directory contains essential development and operational tools:

- `dev.sh`: Boots the full development stack (Redis → Supabase → Ops Gateway → Next.js portal)
- `shutdown.sh`: Stops the portal and optional infrastructure (Supabase, Redis)
- `portal-watchdog.sh`: Monitors the Next.js dev server, auto-restarts on crash with cache clearing
- `smoke-test.sh`: Validates health endpoints, routes, Supabase auth/realtime, Redis cache, and stack health
- `validate-env.sh`: Validates required environment variables before deployment
- `pre-flight.sh`: Runs pre-flight validation (type-check) and scope determination

These scripts ensure consistent development experience and operational reliability.

<!-- acc:begin sha=80280a056b50 — managed by `acc hosts-sync`; the sha self-hashes the machine-written content (canonical updates rewrite a matching fence; YOUR edits change the hash and are reported as drift, never rewritten); `acc hosts-sync --remove` strips it -->
## acc — the accreted scored memory (substrate contract)

- **Retrieve first.** Before any non-trivial step, call `acc_retrieve("<your task>")`
  and let the hits shape the plan. **Cite the `[ids]` you build on** — citation IS the
  credit edge; uncited knowledge cannot compound.
- **Route non-trivial goals through the loop.** `acc_act(runtime="solve",
  input="<goal>")` is memory-first: it records a commitment, answers from the scored
  memory when it can, and checkpoints a deliberation frame when it cannot — answer a
  returned `brain_frame` via `acc_act(runtime="continue", input={"frame_id": "…",
  "proposal_text": "…"})`; the frame_id alone is the credential.
- **Close what you open.** When reality answers — a passing test, a real reply, a
  shipped artifact — `acc_act(runtime="outcome", input={"ref": "<id>", "good": true})`.
- **Credit honesty.** An outcome defaults to `self_graded` → a weak 0.25× prior. Tag
  `runtime`/`external` only when reality validated it; `owner` only when the owner did.
  Never tag your own grade as reality.
- **Two verbs are the whole interface.** `acc_retrieve` is the only READ; `acc_act`
  is the only DO. Reasoning stays in YOUR session — the substrate perceives and
  predicts; it is not a second mind.
- **Work RLM-style — recursive, memory-first, for ANY job.** Technical or not, every
  task is the same loop: retrieve, act on what memory covers, and RECURSE on what it
  does not — `acc_act(runtime="solve")` on the sub-question. Decomposition emerges
  from recursion; don't pre-plan a tree. Three base cases: ANSWER when retrieved
  knowledge plus the workspace settle it (cite the `[ids]`); RECURSE when design or
  judgment is missing from the memo; ASK the owner when the missing piece is
  owner-held (preference, consent, identity, history) — never fabricate it. Inside
  `acc_act(runtime="exec")` sandboxed code, `acc retrieve "<q>"` recurses over the
  same memory mid-run. Never leave a received frame unresolved.
- **Cross-project memory.** Export `ACC_DB=/abs/path/acc.db` to share one substrate
  across projects; otherwise hooks and MCP resolve the project-local `acc.db`.
<!-- acc:end -->
