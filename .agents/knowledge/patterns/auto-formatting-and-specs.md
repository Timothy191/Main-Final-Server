---
title: Auto-Formatting & Spec-First Global Policy
tags: [formatting, specs, policy, agentic]
updated: 2026-07-23
source_agent: antigravity
status: active
---

# Auto-Formatting & Spec-First Global Policy

## Key Practices

1. **Auto-Formatting (`pnpm format`)**:
   - Background subagent `auto-formatter` runs Prettier across workspace files to enforce consistent code styling.
   - Quality gate `pnpm quality` validates both `pnpm format:check` and strict ESLint/Jest checks.

2. **Mandatory Spec-First Policy (`.kiro/specs/`)**:
   - Every multi-file feature or task MUST have a dedicated spec directory created under `.kiro/specs/<feature-slug>/` before implementation starts.
   - The spec cycle consists of Requirements, Design, and Tasks phases.

3. **Mandatory Response Follow-ups**:
   - Every agent completion MUST end with 3 Recommended Follow-ups presented to the user, with an `Outcome:` line under each follow-up describing the expected result.
