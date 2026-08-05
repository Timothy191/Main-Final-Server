# Arch System — Skills Directory Index (`.agents/knowledge/skills/`)

Token-efficient index of available AI Agent Skills for specialized tasks.

## Skills Catalog

| Skill Name | Path | Description / Trigger |
| :--- | :--- | :--- |
| **agent-caching** | [`agent-caching/SKILL.md`](./agent-caching/SKILL.md) | Next.js 16 `"use cache"`, Redis L1/L2 invalidation, edge proxy auth caching, and `DEPARTMENT_CACHE_TAGS` |
| **arch-design-system-enforcer** | [`arch-design-system-enforcer/SKILL.md`](./arch-design-system-enforcer/SKILL.md) | Enforcing `<GlassCard>`, `--arch-glass-*` CSS variables, theme tokens, and visual quality gates |
| **dead-dependency-pruner** | [`dead-dependency-pruner/SKILL.md`](./dead-dependency-pruner/SKILL.md) | Removing unused dependencies, knip audit cleanup, and package boundary prunings |
| **department-mutation-scaffolder** | [`department-mutation-scaffolder/SKILL.md`](./department-mutation-scaffolder/SKILL.md) | Scaffolding or modifying department routes, server actions, and `@repo/acl` route restrictions |
| **gemini-interactions-api** | [`gemini-interactions-api/SKILL.md`](./gemini-interactions-api/SKILL.md) | Integrating or migrating Gemini API interactions and LLM features |
| **on-premise-supabase-ops** | [`on-premise-supabase-ops/SKILL.md`](./on-premise-supabase-ops/SKILL.md) | Managing local Docker Supabase stack, SQL migrations in `packages/supabase/migrations/`, and RLS policies |
| **agy-plugin-installer** | [`agy-plugin-installer/SKILL.md`](./agy-plugin-installer/SKILL.md) | Installing and configuring remote plugins/extensions into the Antigravity CLI |

---

## Related IDE rules
- [`.continue/rules/edge-auth-caching.md`](../../.continue/rules/edge-auth-caching.md) — ADR-001 edge auth and data caching rules that overlap with the `agent-caching` skill.

## Convention
When creating or modifying a skill, update this `INDEX.md` and the master knowledge index at [`.agents/knowledge/index.md`](../index.md).
