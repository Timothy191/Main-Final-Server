# Repository Guidelines

## Project Overview
This project is an AI-orchestrated, monorepo-based application featuring a primary UI built with Next.js 16 (App Router) and a control-plane bridge for MCP (Model Context Protocol) operations. It emphasizes rigorous AI-agent integration, spec-driven development, and strict adherence to architectural boundaries between the product monorepo and agentic AI surfaces.

## Architecture & Data Flow
The architecture follows a strict separation between:
- **Product Monorepo**: `Server/apps/`, `Server/packages/`, product scripts (in `Server/scripts/`), and `turbo` build tasks.
- **Agentic AI**: `.cursor/`, `.claude/`, agents, skills, `pnpm ai` tools, and maintenance scripts.

Data flow for core features typically involves:
- **Portal (`Server/apps/portal/`)**: Handles UI, user interactions, and calls library/feature-based data fetching functions.
- **Backend/Lib (`Server/apps/portal/src/lib/` & `Server/packages/`)**: Contains shared business logic, API clients, and data access layers (`@repo/supabase`).
- **Control Plane (`Server/apps/ops-gateway/`)**: Manages external integrations, MCP tools, and event-driven tasks.

## Key Directories
- `Server/apps/portal/`: Primary deployable Next.js 16 UI.
- `Server/apps/ops-gateway/`: MCP bridge, dispatcher, and subscriber services.
- `Server/packages/`: Framework-agnostic shared libraries (e.g., `@repo/contract`, `@repo/database`, `@repo/ui`).
- `.cursor/`: Project-specific agents, skills, and layout standards.
- `.claude/`: Claude Code harness configuration and surfaces.
- `Server/scripts/`: Shared scripts for development, deployment, and AI maintenance.
- `.agents/knowledge/`: Shared cross-agent knowledge base (repowiki) — single source of truth.

## Shared Knowledge Base (Repowiki)
Single source of truth for cross-agent codebase knowledge: `.agents/knowledge/`.
- READ `.agents/knowledge/index.md` before non-trivial work.
- WRITE durable learnings (dated, evidence-cited) and update `index.md`; supersede, never delete.
- Tool paths resolve here via symlinks (`.claude/knowledge`, `.cursor/knowledge`, `.qoder/repowiki`), created by `.claude/scripts/sync-surfaces.sh`.
- Not for end-user product memory (`packages/database/migrations/009_ai_memory.sql`).
- Enforced by `pnpm ai check`. Full protocol: `.agents/knowledge/README.md`.

## Development Commands
### Product (Standalone)
- `pnpm dev`: Full stack dev mode (Docker + Next.js).
- `pnpm dev --quick`: Portal-only dev, skips infra.
- `pnpm build`: Full project build (Turborepo).
- `pnpm quality`: Pre-commit check (lint + type-check + test + prettier).

#### Fast Local Development (Next.js convention)
For iterative development on the portal app, use watch mode:

1. **Start watch build** (auto-rebuilds on file changes):
   ```bash
   cd apps/portal && pnpm dev
   ```

2. **Run focused tests** — see testing section below for mode-specific commands.

3. **For type errors only** — use `pnpm --filter=portal type-check` instead of full build.

4. **Always run `pnpm quality` before marking a task as done** — this runs lint, type-check, test, and format in sequence.

### Agentic AI
- `pnpm ai`: AI system health check.
- `pnpm ai check`: Validate AI surfaces drift/compliance.
- `pnpm agent:delegate`: Delegate tasks to subagents.

## Code Conventions & Common Patterns
- **TypeScript**: Strict (TS 5.7+), no `any`, no `@ts-ignore`.
- **Validation**: Zod (all external input).
- **Errors**: `@repo/errors` (typed `AppError` subclasses).
- **Styling**: Tailwind CSS (via `@repo/theme`, light-mode only). Standardized on macOS semi-transparent white palette (`rgba(255, 255, 255, 0.72)` translucency, `backdrop-filter: blur(28px) saturate(180%)`, specular hairlines, and high-contrast text primitives).
- **Async/Jobs**: Inngest 4 for background jobs.
- **Boundary**: Never import from `apps/` inside `packages/`. Never add application logic to `packages/`.
- **Output & Response**: Always at the end of an output, present the user with 3 Recommended Follow-ups. Under each follow-up, include an `Outcome:` line describing the expected result. Never waste recommendation slots suggesting `.kiro/specs/` spec creation (apply `.kiro/specs/` spec-first cycles automatically for tasks); keep recommendations focused on technical & architectural next steps.
- **Spec-First Requirement**: Always create a new spec under `.kiro/specs/<feature-slug>/` for any upcoming multi-file feature or task before implementation.

## Important Files
- `package.json`: Main workspace configuration.
- `pnpm-workspace.yaml`: Workspace definition.
- `turbo.json`: Build pipeline configuration.
- `apps/portal/.env.example`: Env var templates.
- `AGENTS.md`: Canonical AI policy.

## Runtime/Tooling Preferences
- **Runtime**: Node.js >= 22 (Volta pinned: 24).
- **Package Manager**: pnpm 9 (strict).
- **Build**: Turborepo 2.

## Testing & QA
- **Framework**: Jest (`turbo run test`).
- **Quality Gate**: `pnpm quality` must pass before marking tasks as "done".
- **Coverage**: Expected for all permanent feature changes and API modifications.

### Testing Patterns (from Next.js conventions)

**Running focused tests:**
```bash
# Test a specific file
pnpm --filter=portal test -- path/to/file.test.ts

# Test with a name pattern
pnpm --filter=portal test -- -t "should render dashboard"
```

**Test conventions:**
- Place tests alongside source files: `component.tsx` → `component.test.tsx`
- Integration tests go in `__tests__/` directories under the relevant feature folder
- Use `@testing-library/react` for component tests
- Mock external services at the boundary (Supabase, Inngest, Redis)
- Never use `any` in test files (override in eslint config allows in test/match config)

### Code Style Guidelines (from Next.js conventions)

**Imports:**
- Use `import type { X }` for type-only imports (enforced by `consistent-type-imports`)
- Group: built-in → external → internal → relative
- `@repo/*` aliases preferred over relative imports for cross-package references

**Error handling:**
- Throw typed `AppError` subclasses from `@repo/errors` — never raw `Error`
- Catch at the boundary (route handler, server action boundary)
- Use `neverthrow` Result patterns for expected failure cases

**Commit conventions:**
- Conventional commits: `type(scope): message`
- Valid types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`
- Scope matches the package/app name (e.g., `portal`, `ops-gateway`, `repo/supabase`)
- Breaking changes: `feat!:` or `fix!:` with `BREAKING CHANGE:` in body

---

## Next.js 16 Caching & Data Fetching
When applying the native `"use cache"` directive to Server Components or data-fetching functions:
- **Do not read `cookies()` or `headers()` inside a `"use cache"` scope.** This includes indirect calls via `createServerSupabaseClient` or `assertAccessControlRole()`.
- **Decouple Auth from Caching**: To cache global/department data securely, split your function. Use an outer, un-cached function to verify authorization (`assertAccessControlRole`), then call an inner `_getCached...` function containing `"use cache"` and `cacheTag`.
- **Use `createAdminClient()` in Cache**: The inner cached function should fetch data using `createAdminClient()` to avoid requiring user cookies, as the outer function has already validated access.

---
*For canonical rulebook, see AGENTS.md in project root.*

### Common Gotchas & Debugging (from Next.js conventions)

- **Snapshot tests and env flags**: Tests with inline snapshots can produce different output depending on env flags. When updating snapshots, run with the exact flags CI uses.
- **`app-page.ts` is a build template**: Any `require()` in template files is traced by the bundler at build time. You cannot require internal modules with relative paths — export helpers from `entry-base.ts` instead.
- **Stale `.next` cache**: If the portal produces unexpected errors after switching branches, delete `apps/portal/.next/` and retry.
- **`"use cache"` rule**: Never read `cookies()` or `headers()` inside a `"use cache"` scope. Decouple auth from caching — verify auth in an outer function, then call an inner cached function using `createAdminClient()`. See [Next.js 16 Caching](#nextjs-16-caching--data-fetching) for details.
- **Client-imported Server Actions**: Avoid importing Server Actions from files that contain heavy server-only imports (e.g. `@react-pdf/renderer`, Inngest) into Client Components. This triggers Turbopack client-side bundling errors ("module factory not available"). Isolate these actions into dedicated lightweight files (e.g., `logout-action.ts`).
- **Source maps**: `findSourceMap()` needs `--enable-source-maps` flag. Source map paths vary between bundlers — try multiple formats.
- **Console output in tests**: `console.log` output may be captured by Jest. Use `--verbose` or `--debug` flags to see full output when debugging tests.
