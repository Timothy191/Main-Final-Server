# Signal Detection Criteria

## High-Signal Patterns (capture)

### Recurring User Corrections
- Same correction mentioned 3+ times across sessions
- Explicit statements like "actually, I prefer X" that repeat
- User correcting agent assumptions about workflows
- Patterns where user says "don't do X, do Y instead"

### Durable Workspace Facts
- Project-specific paths that are referenced repeatedly
- Stack preferences (e.g., "always use pnpm, never npm")
- Editor preferences (e.g., "use VS Code, not vim")
- Workflow preferences (e.g., "always outline first")

### Explicit User Statements
- Direct instructions: "remember that..."
- Preference statements: "I always..."
- Correction patterns: "no, not that way"
- Process descriptions: "my workflow is..."

## Low-Signal Patterns (exclude)

### One-Off Commands
- Single-use commands specific to one task
- Temporary workarounds for specific bugs
- Session-specific debugging steps

### Transient Details
- Current branch names
- Temporary file paths
- One-off environment variables
- Session-specific IDs

### Secrets & Sensitive Data
- API keys, tokens, passwords
- Personal identification
- Private URLs or endpoints
- Internal service details

## Detection Heuristics

1. **Frequency**: Pattern appears in 3+ separate sessions
2. **Explicitness**: User states it as a rule/preference
3. **Durability**: Applies across multiple contexts
4. **Actionability**: Can be applied to future work
