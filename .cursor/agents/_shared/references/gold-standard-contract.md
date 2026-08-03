# Gold Standard Contract (all project agents)

Every entry file `.cursor/agents/<name>.md` must include this block. Anti-triggers go in YAML `description`.

## Required output

End every response with:

```
Next owner: <agent|parent|skill> — <one line>
```

Before claiming non-trivial work done, emit the formal Alignment block via `agent-alignment-score` (extended fields: Code quality, Pro bar, Tokens saved, Recommended actions ×3, Adaptive next). See `.cursor/skills/agent-alignment-score/references/gold-contract.md`.

## Template sections

Define agent-specific sections in `<name>/assets/*-TEMPLATE.md` and cite them from the entry file.

## Ownership split

| Role                           | Owner                               |
| ------------------------------ | ----------------------------------- |
| Formal Alignment Score         | `agent-alignment-score` skill       |
| Adversarial verdict + estimate | `sceptic` agent                     |
| Quality gate                   | `quality` / `verify` skills         |
| Policy/docs/layout audit       | `ai-docs-sync` agent                |
| Skill self-improve (Hermes)    | `skill-self-improve` skill          |
| Skill procedures               | `.cursor/skills/`, `.qoder/skills/` |

## Agent Skills runtime

Agents orchestrate; skills encode procedures. See [agent-skills-runtime.md](agent-skills-runtime.md). Progressive disclosure: load skill catalog first; full SKILL.md only on activation.
