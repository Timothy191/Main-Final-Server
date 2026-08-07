# Arch System — Agent Rules Index

> [!NOTE] Neural Connections
> 🔙 **Upward Node:** [Master Map of Content](../../memory/antigravity-memory/long/MAP_OF_CONTENT.md)
> 🔀 **Lateral Nodes:** [Agent Skills](../skills/INDEX.md) | [Codebase Maps](../../docs/codebase-maps/README.md)

(`.continue/rules/`)

Quick token-efficient index of automated IDE rules and senior engineering operating doctrines.

## Rules Catalog

| Rule File                                        | Topic                              | Scope & Enforcements                                                                                                                                                |
| :----------------------------------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`edge-auth-caching.md`](./edge-auth-caching.md) | Edge Auth & Data Caching           | ADR-001 L1/L2 Redis invalidation (`cacheDelete`), edge proxy auth caching, `"use cache"` boundary rules; see also `.agents/knowledge/skills/agent-caching/SKILL.md` |
| [`engineer-doctrine.md`](./engineer-doctrine.md) | Senior Engineer Operating Doctrine | Root-cause analysis (RCA), retro discipline, conciseness, sycophancy bans, git hook checks                                                                          |
| [`05-advisor.mdc`](./05-advisor.mdc)             | Advisor Agent Steering Guidelines  | Steering logic enforcing monorepo boundaries, connection pools, hybrid caching, Zod schemas (SSOT), and forced verification checks. |

---

## Usage Guidelines

These rules are active context rules automatically picked up by IDE agent extensions when editing code in `apps/portal` and `packages/`.

## Cross-References

- Durable skills and verification checklists: [`.agents/knowledge/skills/INDEX.md`](../.agents/knowledge/skills/INDEX.md)
- Master knowledge base: [`.agents/knowledge/index.md`](../.agents/knowledge/index.md)
