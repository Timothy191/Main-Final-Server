# Memory Update Report

**Date**: {{DATE}}
**Session ID**: {{SESSION_ID}}
**Transcripts Processed**: {{TRANSCRIPT_COUNT}}

## Signals Extracted

### High-Signal Patterns (n={{SIGNAL_COUNT}})

{{#each SIGNALS}}
- **Pattern**: {{PATTERN}}
  - **Frequency**: {{FREQUENCY}}
  - **Source**: {{SOURCE_TRANSCRIPTS}}
  - **Confidence**: {{CONFIDENCE}}
{{/each}}

### Filtered Out (n={{FILTERED_COUNT}})

{{#each FILTERED}}
- **Reason**: {{REASON}}
  - **Content**: {{CONTENT}}
{{/each}}

## AGENTS.md Updates

### Proposed Changes

{{#each UPDATES}}
- **Section**: {{SECTION}}
- **Change**: {{CHANGE}}
- **Rationale**: {{RATIONALE}}
{{/each}}

### Applied Changes

{{#each APPLIED}}
- **File**: {{FILE}}
- **Lines**: {{LINES}}
- **Diff**: {{DIFF}}
{{/each}}

## Index Status

- **Entries before**: {{INDEX_BEFORE}}
- **Entries after**: {{INDEX_AFTER}}
- **Removed (deleted transcripts)**: {{REMOVED_COUNT}}

## Verification

- [ ] Privacy rules checked
- [ ] No secrets stored
- [ ] Recurrence threshold met (3+)
- [ ] `pnpm ai check` passed
- [ ] AGENTS.md §18 compliance verified

## Recommendations

{{RECOMMENDATIONS}}
