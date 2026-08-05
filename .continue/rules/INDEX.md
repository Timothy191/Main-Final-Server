# Arch System — Agent IDE Rules Index (`.continue/rules/`)

Quick token-efficient index of automated IDE rules and senior engineering operating doctrines.

## Rules Catalog

| Rule File                                        | Topic                              | Scope & Enforcements                                                                                                                                                |
| :----------------------------------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`edge-auth-caching.md`](./edge-auth-caching.md) | Edge Auth & Data Caching           | ADR-001 L1/L2 Redis invalidation (`cacheDelete`), edge proxy auth caching, `"use cache"` boundary rules; see also `.agents/knowledge/skills/agent-caching/SKILL.md` |
| [`engineer-doctrine.md`](./engineer-doctrine.md) | Senior Engineer Operating Doctrine | Root-cause analysis (RCA), retro discipline, conciseness, sycophancy bans, git hook checks                                                                          |

---

## Usage Guidelines

These rules are active context rules automatically picked up by IDE agent extensions when editing code in `apps/portal` and `packages/`.

## Cross-References

- Durable skills and verification checklists: [`.agents/knowledge/skills/INDEX.md`](../.agents/knowledge/skills/INDEX.md)
- Master knowledge base: [`.agents/knowledge/index.md`](../.agents/knowledge/index.md)
