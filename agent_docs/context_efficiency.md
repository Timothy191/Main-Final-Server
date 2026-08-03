# Context-Efficiency Policies

## Core Principles

1. **Deterministic Context Management**
   - Avoid probabilistic output handling (e.g., truncating logs)
   - Agent decisions must rely on explicit file-based context, not model memory

2. **Output Compaction Protocol**
   - All test/build/lint outputs must follow:
     - ✓/✗ indicators for full passes
     - Full failure output only for critical errors (minimal stack trace + line number)

3. **No Agent-Side State**
   - Prohibit runtime caches, logs, or in-memory context storage
   - All agent decisions must be recorded in `AGENT_TRACER.md` or `REPO-CHANGE-INDEX.md`

## Rule Set

### Rule 1: Static Context Onboarding (CLAUDE.md)

**Requirement**: CLAUDE.md must contain:

- Tech stack (`Next.js 16`, TypeScript, Supabase, `pnpm`)
- Codebase structure (`apps/`, `packages/`, key dependencies)
- Core tooling commands (`pnpm dev`, `pnpm quality`)
- Non-negotiable conventions (error handling, caching patterns)

### Rule 2: Prohibited Agent Memory

**Requirement**:

- Block integration of tools that store agent-side state (e.g., local caches)
- Require `AGENT_TRACER.md` updates for all state changes
- Fail builds if agent-side state is detected via `grep -r '\.agents/' . | grep -v 'AGENT_TRACER.md'`

### Rule 3: Context Compaction

**Requirement**:

- Standardize test output wrapping with `run_silent.sh`
- Example:
  ```bash
  run_silent "Fe tests" "bun run test:fe"
  # ✓/✗ + full failure details only
  ```

### Rule 4: Progressive Disclosure

**Requirement**:

- Task-specific context stored in separate files (e.g., `agent_docs/database_schema.md`)
- CLAUDE.md should list file references (e.g., "See `agent_docs/database_schema.md` for DB schema")

## Enforcement Mechanisms

### Automated Checks

```bash
# Validate CLAUDE.md context completeness
# (Manual check: verify tech stack, structure, tools present)

# Verify no inappropriate agent-side state storage
find .agents -type f -name "*.md" -not -path "*/knowledge/*" -not -name "AGENT_TRACER.md" -not -name "README.md" | wc -l

# Check test output patterns in CI logs (manual inspection)
# Look for excessive test output that should be compacted
```

### Manual Audits

1. **CLAUDE.md Review**: Ensure task-specific rules are moved to separate files
2. **AGENT_TRACER.md Health Check**:
   - File must exist and be updated per task
   - Logs must include: Purpose, Changes, Dependencies
3. **Output Pattern Inspection**:
   - Failures should never include >3 lines of context
   - Passes should only show ✓
