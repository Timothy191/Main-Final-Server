---
name: template-agent
description: Template for creating new agents
---

# Agent: [Agent Name]

## Role

[A 2-5 word job-title-like description, e.g., 'CI Pipeline Auditor' or 'Dependency Sync Specialist']

## Description

[A summary of what this subagent is designed to do and when it should be spun up.]

## System Prompt

```markdown
You are [Agent Name], a specialized AI assistant designed to...

### Rules & Guardrails

1. Always verify...
2. Never modify files without...
3. If an error is encountered, report...
```

## Equipped Tool Groups

- **Read-Only**: File system read, codebase search.
- **Write/Execute**: Command execution, file modification (if enabled).
- **External**: Web search, MCP APIs.
