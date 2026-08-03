# Kiro Agent Configuration & Spec-Driven Workflow

This directory contains agent configurations and templates for the spec-driven workflow mandated by `AGENTS.md`.

## Directory Structure

```
.kiro/
├── agents/           # Agent configuration files
│   └── default.json  # Default agent configuration
├── specs/            # Feature specifications
│   └── {feature-slug}/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
├── templates/        # Template files for spec creation
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
└── README.md         # This file
```

## Spec-Driven Workflow

Every non-trivial task (touching more than one file) must follow this three-phase cycle:

### Phase 1: Requirements (`requirements.md`)

1. Restate user request
2. List concrete, testable acceptance criteria
3. Identify ambiguities
4. Define scope boundaries

### Phase 2: Design (`design.md`)

1. Describe architecture and data flow
2. Map server vs client boundaries
3. List files to create/modify
4. Document environment variables, packages, error handling
5. Get user sign-off before implementation

### Phase 3: Tasks (`tasks.md`)

1. Break design into smallest testable units
2. Order tasks with dependencies
3. Mark complete only after `pnpm quality` passes
4. Never skip tasks

## Creating a New Spec

1. Create a new directory under `.kiro/specs/{feature-slug}/`
2. Copy templates:
   ```bash
   cp .kiro/templates/requirements.md .kiro/specs/{feature-slug}/
   cp .kiro/templates/design.md .kiro/specs/{feature-slug}/
   cp .kiro/templates/tasks.md .kiro/specs/{feature-slug}/
   ```
3. Fill in the templates following AGENTS.md guidelines
4. Get user approval at each phase
5. Execute tasks in order

## Agent Configuration

The `default.json` agent configuration enforces:

- Spec-driven workflow for multi-file changes
- AGENTS.md rule compliance
- Technology stack adherence
- Monorepo layout constraints
- Quality gates before/after tasks

## Project agents & skills (Cursor)

| Surface         | Path                                                |
| --------------- | --------------------------------------------------- |
| Subagents       | `.cursor/agents/` — hybrid: `<name>.md` + `<name>/` |
| Claude Code     | `.claude/` — rules, settings, synced skills/agents  |
| Claude standard | `.cursor/standards/claude-code/STANDARD.md`         |
| Auto-routing    | `.cursor/rules/04-subagent-auto-routing.mdc`        |
| Cursor skills   | `.cursor/skills/`                                   |
| Qoder skills    | `.qoder/skills/`                                    |
| GitHub skills   | `.github/skills/`                                   |

See `AGENTS.md` § Project Agents & Skills and `CLAUDE.md` § Agents & Skills.

## Quality Gates

Before marking any task complete:

1. `pnpm quality` must pass (lint + type-check + test + format)
2. No TypeScript `any` types introduced
3. No secrets committed or exposed
4. Server/client boundaries respected
5. All new environment variables in `.env.example`
6. Error handling uses `@repo/errors` AppError subclasses
7. Accessibility requirements met
8. Alignment Score ≥ 80 (AGENTS.md §20) — `node .cursor/skills/agent-alignment-score/scripts/score.mjs --interactive`
9. Real-world verify: evidence cited (no speculation-as-fact)

## Example

See `.kiro/specs/portal-migration/` for a complete example of the spec-driven workflow in action.
