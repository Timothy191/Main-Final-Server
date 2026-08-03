# Privacy Rules for Memory Updates

## Never Store

### Secrets & Credentials
- API keys, tokens, passwords
- Session cookies, auth tokens
- Private keys, certificates
- OAuth client secrets

### Personal Information
- Email addresses, phone numbers
- Physical addresses
- Real names (unless explicitly requested)
- Personal identifiers

### Internal Systems
- Internal service URLs (unless public)
- Private database connection strings
- Internal IP addresses
- Non-public endpoint details

### Temporary Context
- Current working directory (unless project root)
- Session-specific file paths
- Temporary environment variables
- One-off debugging commands

## Redaction Rules

When extracting signals:

1. **Replace secrets**: `[REDACTED]` or `[SECRET]`
2. **Generalize paths**: Use project-relative paths when possible
3. **Anonymize personal info**: `[USER]` or placeholder
4. **Filter out**: Anything matching secret patterns

## Safe to Store

### Project Facts
- Repository structure
- Tech stack preferences
- Workflow patterns
- Reusable commands (non-sensitive)

### Preferences
- Editor preferences
- Package manager choices
- Testing strategies
- Code style preferences

### Corrections
- Recurring mistake patterns
- Common misunderstandings
- Workflow improvements
- Process clarifications

## Verification

Before writing to AGENTS.md:
1. Check for secret patterns (key, token, password, secret)
2. Verify no personal identifiers
3. Ensure information is project-relevant
4. Confirm it's a recurring pattern (not one-off)
5. Use `continual-learning` skill index format: see `.cursor/skills/continual-learning/references/index-format.md`
