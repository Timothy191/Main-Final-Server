# Project: Arch Systems Portal Verification & Mapping

## Architecture
- Monorepo: Next.js 16 (App Router) portal app (`Server/apps/portal`), MCP gateway (`Server/apps/ops-gateway`), shared packages (`Server/packages/*`).
- Knowledge base: `.agents/knowledge/` single source of truth.
- Control plane: MCP bridge, dispatcher, subscriber services.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Spec Creation & Exploration | `.kiro/specs/arch-systems-portal-verification/` + codebase inspection | none | IN_PROGRESS |
| 2 | R1: Codebase Mapping | Generate maps in `Codebase-maps/` | M1 | PLANNED |
| 3 | R2: Enterprise Patterns | High-throughput caching, typed errors, RLS, rate limiting, health probes | M1 | PLANNED |
| 4 | R3: Quality & Guardrails | Build, 57/57 test suites, smoke test 27/27, bundle size, `pnpm ai check` | M2, M3 | PLANNED |

## Interface Contracts
- Health endpoints: `/api/health/live`, `/api/health/ready`
- Quality tools: `pnpm quality`, `pnpm build`, `pnpm test`, `pnpm ai check`
- Map outputs: `Codebase-maps/` directory
