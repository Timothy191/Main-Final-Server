# Agent Knowledge Base

This directory contains the knowledge base for AI agents working in the Arch-Systems monorepo.

## What This Is

The knowledge base is a collection of skills, procedures, and domain knowledge that agents can reference to understand:
- How to perform specific tasks in this codebase
- Architectural patterns and conventions
- Integration points with external systems
- Operational procedures and best practices

## Structure

```
.agents/knowledge/
├── index.md           # This file — overview and navigation
├── README.md          # This file — introduction
└── skills/            # Individual skill definitions
    ├── dead-dependency-pruner/
    │   └── SKILL.md
    ├── arch-design-system-enforcer/
    │   └── SKILL.md
    ├── gemini-interactions-api/
    │   ├── SKILL.md
    │   └── references/
    │       └── migration.md
    ├── on-premise-supabase-ops/
    │   └── SKILL.md
    └── department-mutation-scaffolder/
        └── SKILL.md
```

## For Agents

Before starting a task in a specific domain:
1. Check if there's a relevant skill in `skills/`
2. Read the `SKILL.md` file to understand the procedure
3. Follow the documented steps and validation checks
4. Update the skill if you discover improvements or edge cases

## For Humans

Skills follow the [agentskills.io](https://agentskills.io) standard. Each `SKILL.md` contains:
- Frontmatter with metadata (name, version, triggers)
- Expected behavior and acceptance criteria
- Step-by-step procedures
- Common pitfalls and failure modes
- Related skills and cross-references

## Adding New Skills

When creating a new skill:
1. Create a directory under `skills/` with a descriptive name
2. Add a `SKILL.md` following the agentskills.io template
3. Include clear activation triggers in the frontmatter
4. Document expected outcomes and validation steps
5. Cross-reference related skills
6. Update this index with a brief description

## Version Control

This directory is tracked in git. Skills should be updated when:
- Architectural patterns change
- New procedures are established
- Bugs or edge cases are discovered
- Tooling or dependencies change
