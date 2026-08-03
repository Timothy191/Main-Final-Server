# AGENTS.md Update Patterns

## When to Update AGENTS.md

### Add New Local Preferences
- User consistently prefers specific tooling/stack
- Recurring workflow corrections
- Project-specific conventions

### Update Existing Sections
- Clarify ambiguous instructions
- Add anti-triggers that match real user corrections
- Strengthen existing rules with evidence

### Never Add
- One-off commands
- Session-specific details
- Secrets or sensitive data
- Duplicates of existing policy

## Update Locations

### Local Preferences (AGENTS.local.md)
- Personal communication style
- Git/PR conventions
- Local environment details
- User-specific tooling preferences

### Core Policy (AGENTS.md)
- Only when pattern is project-wide
- When multiple users would benefit
- When it corrects recurring agent mistakes

## Update Format

### Adding Local Preferences
```markdown
## Communication Style

- Explain tradeoffs and reasoning in detail
- Present options when there are meaningful decisions
```

### Adding Anti-Triggers
```markdown
## Anti-triggers

- Do not use X when user prefers Y
- Avoid Z in context Q
```

### Clarifying Existing Rules
```markdown
## Stack Rules

- Use pnpm 9 only (enforced by local preference)
```

## Diff Minimization

1. **Prefer additions over edits** — append to sections rather than rewrite
2. **Use existing structure** — follow current AGENTS.md section layout
3. **Minimal changes** — change only what's necessary
4. **Preserve context** — keep surrounding text intact

## Validation

After update:
1. Run `pnpm ai check` to validate AI surfaces
2. Ensure no AGENTS.md §18 never-do violations
3. Verify changes align with project standards
4. Check for duplicate or conflicting rules
