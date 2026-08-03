# Orchestrator Master Plan: Arch Systems Portal Verification & Mapping

## Overview
Fulfill user requirements for Arch Systems Portal monorepo:
1. R1: Full Architecture & Codebase Mapping (`Codebase-maps/`)
2. R2: Real-World Heavy Enterprise Pattern Verification
3. R3: Automated Quality & Performance Guardrails

## Milestones & Execution Strategy

### Milestone 1: Spec Creation & Initial Exploration
- Spec-First Compliance: Create spec under `.kiro/specs/arch-systems-portal-verification/spec.md` defining requirements, design, tasks, and acceptance criteria.
- Dispatch Explorers to map workspace apps, packages, scripts, tests, health routes, build setup, and `.size-limit.json`.

### Milestone 2: R1 - Full Architecture & Codebase Mapping
- Generate visual and reference maps under `Codebase-maps/`:
  - `workspace-packages.md` (or `.svg`/diagrams as applicable)
  - `api-routes.md`
  - `dataflow-pipelines.md`
  - `caching-layers.md`
  - `client-server-boundaries.md`
- Explorer -> Worker -> Reviewer -> Challenger -> Auditor verification.

### Milestone 3: R2 - Real-World Heavy Enterprise Pattern Verification
- Verify high-throughput caching, typed error handling (`@repo/errors`), database RLS policies (`@repo/supabase` / migrations), rate limiting, and health probes (`/api/health/live`, `/api/health/ready`).
- Verify smoke test passes 27/27 health checks.

### Milestone 4: R3 - Quality & Performance Guardrails
- Verify full workspace clean build (`pnpm build`).
- Verify portal unit test suites pass (57/57 suites, 413/413 tests).
- Verify bundle size budget checks (`.size-limit.json`).
- Verify cross-agent knowledge base sync (`pnpm ai check` passes with 0 errors and 0 warnings).
- Forensic Auditor audit and final sign-off.
