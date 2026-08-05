---
name: agent-caching
description: Index for cached agent tokens, rules, and reusable caching patterns across the monorepo.
---

# Agent Caching

This skill governs how agent-produced cached tokens and reusable caching patterns are stored and consumed.

## Contents

- [`SKILL.md`](./SKILL.md) — full caching rules, ADR-001, Next.js 16 `"use cache"` boundaries, Redis L1/L2 helpers, and verification checklist.

## Cached Tokens / Quick Reference

Reuse these tokens verbatim when implementing or reviewing cache-related code:

| Token | Value / Pattern | Use Case |
|-------|-----------------|----------|
| `ARCH_AUTH_EMPLOYEE_KEY` | `arch:auth:employee:<userId>` | Edge auth L1/L2 employee role cache. Invalidate on role or department entitlement change. |
| `EDGE_AUTH_L1_TTL` | `30s` | In-process edge auth cache TTL. |
| `EDGE_AUTH_L2_TTL` | `300s` | Redis L2 edge auth cache TTL. |
| `DEPT_TAG_PREFIX` | `dept:<slug>` | Next.js cache tag for department-scoped data. |
| `TABLE_TAG_PREFIX` | `table:<table_name>` | Next.js cache tag for table-scoped invalidation. |
| `DEFAULT_CACHE_LIFE` | `cacheLife('5 minutes')` | Default Next.js 16 cache lifetime for department data. |

## Standard Departments

Use `DEPARTMENT_CACHE_TAGS` from `@/lib/department-cache`:

- `dept:control-room`
- `dept:drilling`
- `dept:production`
- `dept:safety`
- `dept:satellite`
- `dept:environment`
- `dept:logistics`
- `dept:geology`

## Standard Tables

- `table:hourly_loads`
- `table:machine_operations`
- `table:excavator_activity`
- `table:engineering_notes`
- `table:daily_logs`
- `table:machines`
- `table:breakdowns`
- `table:safety_incidents`
- `table:employees`

## How to Add a New Cached Token

1. Add the token to the **Cached Tokens / Quick Reference** table above.
2. If it changes invalidation rules, update [`SKILL.md`](./SKILL.md) §1 and §3.
3. If it affects verification, update the checklist in [`SKILL.md`](./SKILL.md) §4.
4. Stage and commit only files inside `.agents/knowledge/skills/agent-caching/`.
