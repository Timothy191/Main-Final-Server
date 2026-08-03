---
title: Glossary
tags: [glossary, reference]
updated: 2026-07-21
source_agent: claude-code
status: active
---

# Glossary

Shared vocabulary so every agent describes the system the same way.

## Domain

- **Portal** — the deployable Next.js 16 UI at `apps/portal/`; the mining-operations app.
- **Department** — a scoped dashboard area under `app/(departments)/[department]/`. Valid
  values: `drilling`, `production`, `access-control`, `engineering`, `control-room`,
  `safety`, `training`, `satellite-monitoring`.
- **Employee** — a row in the `employees` table; the source of truth for roles and
  `accessible_departments`.

## Architecture / platform

- **Two layers** — Product (`apps/`, `packages/`, product scripts) must build/run/test
  with no AI content; Agentic AI (`.cursor/`, `.claude/`, `AGENTS.md`, `pnpm ai`) is
  CLI-agent tooling only.
- **`@repo/*`** — internal workspace packages: `@repo/contract`, `@repo/database`,
  `@repo/departments`, `@repo/errors`, `@repo/logger`, `@repo/rate-limiter`,
  `@repo/redis`, `@repo/supabase`, `@repo/theme`, `@repo/ui`, `@repo/utils`.
- **ops-gateway** — `apps/ops-gateway/`; the MCP bridge, dispatcher, and subscriber
  service for external integrations and event-driven tasks.
- **proxy.ts** — `apps/portal/proxy.ts`; the Next.js 16 replacement for `middleware.ts`.
  Runs on every request for session refresh and role/department access control.

## Agentic AI

- **Surface** — a tool-specific agent config directory (`.cursor/`, `.claude/`, `.qoder/`,
  etc.). `.cursor/` is canonical for skills/agents; others mirror it.
- **Harness** — swappable agent operating profile under `agent-harnesses/`; some rules
  files (`.windsurfrules`, `.github/copilot-instructions.md`, `.roo/rules/harness.md`) are
  auto-generated harness collateral, not policy.
- **Repowiki** — this shared knowledge base at `.agents/knowledge/` (the name tool
  symlinks like `.qoder/repowiki` resolve to).
- **`pnpm ai`** — unified AI-surface command (`scripts/ai.sh`): inventory, guardrails,
  sync, dedupe, drift, provider health. `pnpm ai check` is the validate-only gate.

## Memory (two distinct systems)

- **Product runtime memory** — the `memory_embeddings` table
  (`packages/database/migrations/009_ai_memory.sql`); pgvector-backed end-user AI memory,
  RLS-scoped to `auth.uid()`. NOT for agent-development knowledge.
- **Agent knowledge base** — this directory (`.agents/knowledge/`); durable, shared
  understanding of the codebase for coding agents.
