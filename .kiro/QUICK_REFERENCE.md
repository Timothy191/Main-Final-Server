# Agent Quick Reference

## Mandatory Rules (Never Skip)

1. **Spec-Driven Workflow**: Multi-file changes → Requirements → Design → Tasks
2. **Server/Client Boundaries**: Default server, "use client" only when needed
3. **TypeScript Strict**: No `any`, no `@ts-ignore`
4. **Secrets**: Never commit `.env*.local`, never expose service keys
5. **Package Manager**: Always `pnpm`, never `npm` or `yarn`
6. **Quality Check**: `pnpm quality` before marking tasks complete
7. **Real-World Thinking**: Apply practical engineering principles, not just process

## Real-World Engineering Principles

### Practical Problem-Solving

- **Start simple** - Minimum viable solution first
- **Progressive enhancement** - Work → Right → Fast
- **Production-ready** - Consider monitoring, debugging, maintenance
- **Evidence-based** - Data over opinions, measure impact
- **Learn from incidents** - Real problems > theoretical edge cases

### Engineering Heuristics

- **YAGNI** - Don't build features before needed
- **KISS** - Complexity kills reliability
- **DRY** - But know when duplication is better
- **Fail Fast** - Detect problems early
- **Measure Everything** - Can't improve what you don't measure

## Common Commands

```bash
# Development
pnpm dev              # Start all services
pnpm build            # Build all packages
pnpm lint             # ESLint check
pnpm type-check       # TypeScript strict check
pnpm test             # Run tests
pnpm quality          # lint + type-check + test + format:check
pnpm format           # Prettier write

# Agent Workflow
mkdir .kiro/specs/{feature-slug}  # Create spec directory
# Copy templates from .kiro/templates/
# Fill requirements.md → get approval
# Fill design.md → get approval
# Fill tasks.md → execute in order
```

## File Locations

```
apps/portal/src/          # Next.js App Router app (only deployable)
apps(legacy)/             # DO NOT MODIFY - deprecated apps
packages/                 # Framework-agnostic libraries
@repo/errors              # AppError subclasses only
@repo/supabase/server     # Server-only Supabase client
@repo/supabase/client     # Browser Supabase client
@repo/redis               # Redis singleton (server-only)
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.7 strict
- **Styling**: Tailwind CSS 3 + `@repo/theme` preset
- **UI Primitives**: `@repo/ui` (extend before shadcn/Radix)
- **State**: Zustand 5 (client global state only)
- **Validation**: Zod 3 (all external input)
- **Auth/DB**: Supabase via `@repo/supabase`
- **Errors**: `@repo/errors` AppError subclasses only

## Self-Check Before "Done"

- [ ] Phase 1 requirements written and approved (multi-file)
- [ ] Phase 2 design written and approved (multi-file)
- [ ] Phase 3 tasks completed in order
- [ ] `pnpm quality` passes
- [ ] No new `any` types
- [ ] No secrets committed/logged
- [ ] Server/client boundaries respected
- [ ] All new env vars in `.env.example`
- [ ] New components have `interface <Name>Props`
- [ ] New pages export `metadata`
- [ ] Server Actions validate with Zod, return `{data}|{error}`
- [ ] `@repo/errors` used for domain errors
- [ ] Accessibility: semantic HTML, focus rings, labels, alt text
- [ ] **Alignment Score ≥ 80** (run: `node .cursor/skills/agent-alignment-score/scripts/score.mjs --interactive`)

## Alignment Scoring (AGENTS.md §20)

Before responding "done" on non-trivial work, compute alignment score:

```bash
node .cursor/skills/agent-alignment-score/scripts/score.mjs --interactive
```

**Pass threshold: ≥ 80**. Any AGENTS.md §18 never-do violation → **hard fail (score = 0)**.

Score dimensions: Spec (20), Stack (15), Boundaries (15), Security (20), Quality (15), Verify (15)

## What Agents Must NEVER Do

- Never skip spec phases for multi-file changes
- Never add "use client" to layout files
- Never `fetch("/api/...")` from Server Components
- Never expose service-role credentials to client
- Never skip Zod validation on user input
- Never use `console.log` in production code
- Never hard-code URLs/ports/env-specific values
- Never create new packages without updating `pnpm-workspace.yaml` and `turbo.json`
