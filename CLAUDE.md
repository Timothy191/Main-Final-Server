# CLAUDE.md

## Core Configuration

### WHAT This repo is
**Tech stack**: pnpm 9.15.9 monorepo, Node ≥ 22, Next.js 16 + React 19 + TypeScript + Tailwind, Supabase (Postgres) + Redis.

**Structure**:
- `apps/portal` — Next.js 16 portal
- `packages/supabase` — SQL migrations (Kysely)
- `packages/theme` — tokens + Tailwind
- `@repo/errors` — typed errors

### Purpose
Enterprise business portal with department management, PII processing, and API gateways.

## Core Workflow (HOW)
Tools: `pnpm dev` (full stack), `pnpm quality` (lint+test+format), `pnpm supabase:start`

Quality gates: `pnpm gates` (enforced in CI)

## Critical Rules (WHY)
- Run `pnpm exec turbo run lint type-check test --force` before "done"
- Never edit `generated.ts` for CSS changes
- Use `@repo/errors` for typed errors
- Supabase RLS enforced

## Context Files for On-Demand Reading

Instead of storing all commands here, reference:
- `agent_docs/building_the_project.md` - Setup steps
- `agent_docs/running_tests.md` - Test patterns
- `agent_docs/code_conventions.md` - Style guidelines
- `agent_docs/database_schema.md` - DB structure
- `agent_docs/service_architecture.md` - System design
