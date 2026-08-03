# Onboarding Guide

Welcome to the Arch Systems Portal! This guide walks you through setting up the development environment and understanding the project structure.

## Prerequisites

- **Node.js**: >= 22 (Volta pins 24.15.0)
- **pnpm**: 9.15.9 (never npm or yarn)
- **Docker**: for Supabase local dev

## Quick Start

```bash
git clone https://github.com/Timothy191/Arch-Mk2.git
cd Arch-Mk2
pnpm install
pnpm dev          # Supabase + Portal + health checks + browser
```

The portal is available at [http://localhost:3000](http://localhost:3000).

## Onboarding Checklist

Complete these steps in order when joining the project:

1. **Read AGENTS.md + SOUL.md** — evidence-based work, no speculation-as-fact
2. **Run `pnpm ai init`** — restore standards, sync surfaces, validate guardrails
3. **Read `.cursor/rules/01-real-world-logic.mdc`** — understand the OBSERVE→VERIFY→ACT→SCORE loop
4. **Read `.cursor/agents/_shared/references/gold-standard-contract.md`** — understand agent output format
5. **Know routing** — `.cursor/rules/04-subagent-auto-routing.mdc` for subagent delegation
6. **Run `pnpm quality`** — lint + type-check + test all pass
7. **Before claiming done on multi-file work**: sceptic → agent-alignment-score → `pnpm quality`
8. **Status anytime**: `pnpm ai status`
9. **Fix issues**: `pnpm ai fix`
10. **Build check**: `pnpm build`

## Project Structure

| Directory            | Purpose                                                           |
| -------------------- | ----------------------------------------------------------------- |
| `apps/portal`        | Next.js 16 App Router portal application                          |
| `apps/api-gateway`   | GraphQL Mesh API gateway                                          |
| `apps/ops-gateway`   | MCP bridge and control-plane                                      |
| `packages/@repo/*`   | Shared packages (errors, theme, ui, utils, supabase, redis, etc.) |
| `.cursor/rules/`     | Cursor agent rules and policies                                   |
| `.cursor/agents/`    | Project subagents                                                 |
| `.cursor/skills/`    | Reusable AI agent skills                                          |
| `.agents/knowledge/` | Shared knowledge base and patterns                                |
| `scratch_board/`     | Live coordination surface for concurrent agents                   |

## Key Commands

```bash
pnpm dev              # Start full dev stack
pnpm quality          # lint + type-check + test + format
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript type checking
pnpm ai               # AI system status
pnpm ai init          # First-time setup
pnpm ai onboard       # Onboarding checklist
pnpm ai check         # Validate only (exit 1 on failure)
pnpm ai fix           # Safe auto-repair then check
```

## Multi-Device Workflow

To work seamlessly between machines:

```bash
# Start of session
git checkout main && git pull origin main && pnpm install

# End of session
git add . && git commit -m "feat: your message" && git push origin main
```

## Common Issues

### Build fails with `Cannot find module '/packages/redis/src/stats'`

This is a pre-existing issue in the `@repo/redis` package. The `stats` module reference in `cache.ts` points to a file that doesn't exist. Check `packages/redis/src/` for the correct module name.

### Tests failing

Run `pnpm test -- --watch` to identify which test suites are failing. Common failures are in:

- `src/app/api/export/fuel-logs/route.test.ts` — export endpoint tests
- `src/lib/__tests__/next-cache-handler.test.ts` — Redis cache handler tests
- `src/lib/jobs/automated-audit.test.ts` — Inngest job tests
- `src/lib/reports/audit-aggregator.test.ts` — audit data aggregation tests
- `src/components/nav/ServicesDropdown.test.tsx` — UI component tests

### Duplicate skills warning

The `openspec-*` skills exist in `.cursor/skills/`, `.qoder/skills/`, and `.github/skills/`. This is a known duplication that should be resolved by merging or aliasing per `merge-rules.md`.
