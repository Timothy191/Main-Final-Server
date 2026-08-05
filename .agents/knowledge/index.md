# Knowledge Base Index

Shared, versioned context for AI agents in the Arch-Systems monorepo. Read this file before non-trivial work; add or update skills when you establish durable procedures.

**Canonical repo policy:** [`AGENTS.md`](../../AGENTS.md)  
**Structural map:** [`docs/WAYFINDER.md`](../../docs/WAYFINDER.md)  
**How to maintain skills:** [`README.md`](./README.md)

## Skills catalog

| Skill | Path | Use when |
| --- | --- | --- |
| Arch design system enforcer | [`skills/arch-design-system-enforcer/SKILL.md`](./skills/arch-design-system-enforcer/SKILL.md) | Touching glass panels, tokens, or `@repo/ui` / `@repo/theme` surfaces |
| Agent caching | [`skills/agent-caching/SKILL.md`](./skills/agent-caching/SKILL.md) (cached tokens: [`skills/agent-caching/INDEX.md`](./skills/agent-caching/INDEX.md)) | Designing, implementing, or evicting Next.js 16 `"use cache"` or Redis L1/L2 data |
| Dead dependency pruner | [`skills/dead-dependency-pruner/SKILL.md`](./skills/dead-dependency-pruner/SKILL.md) | Removing unused deps or running knip-style cleanup |
| Department mutation scaffolder | [`skills/department-mutation-scaffolder/SKILL.md`](./skills/department-mutation-scaffolder/SKILL.md) | Adding or changing department routes/modules |
| Gemini Interactions API | [`skills/gemini-interactions-api/SKILL.md`](./skills/gemini-interactions-api/SKILL.md) | Integrating or migrating Gemini API usage |
| On-premise Supabase ops | [`skills/on-premise-supabase-ops/SKILL.md`](./skills/on-premise-supabase-ops/SKILL.md) | Local Docker Supabase stack, migrations, RLS |
| Antigravity Plugin Installer | [`skills/agy-plugin-installer/SKILL.md`](./skills/agy-plugin-installer/SKILL.md) | Installing remote plugins/extensions into the `agy` CLI |


## Directory layout

```text
.agents/knowledge/
├── index.md      ← this file (navigation)
├── README.md     ← maintenance guide
└── skills/       ← one directory per skill, each with SKILL.md
```

## Conventions

- Skills follow the [agentskills.io](https://agentskills.io) `SKILL.md` format.
- Cross-reference related skills and link back to WAYFINDER concepts.
- Mirror IDE rules that overlap with skills (e.g., edge caching) in [`.continue/rules/`](../../.continue/rules/INDEX.md).
- Update this index when adding a new skill directory.
