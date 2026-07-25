# .agents/reports/

Shared drop zone for agent-authored reports. Every agent that produces
a durable artifact writes it here under a predictable filename.

## Filename convention

```
<agent-slug>-<kind>-<yyyymmdd-hhmm>.md
```

Examples:

- `compression-dryrun-initial.md` (first bootstrap report; timestamp
  omitted intentionally so it is easy to find)
- `swarm-<mission-slug>-20260725-1420.md`
- `anti-drift-<subject-slug>-20260725-1600.md`

## Required sections

Every report ends with the alignment block per
`.qoder/rules/alignment-scoring.md`:

```
## Alignment: <score>/100 [PASS|FAIL]
- Spec / Stack / Boundaries / Security / Quality / Verify
Hard fails: <none | list>

Next owner: <user|agent-name|skill> — <one line>
```

Additional required top-level headings vary by producer:

| Producer | Required top-level headings |
|---|---|
| `compression-agent` | Scope · Toolchain · Candidates · Deferred · Alignment |
| `swarm-coordinator` | Mission · Fan-out plan · Children · Merged findings · Deferred · Alignment |
| `anti-drift` | Subject · Concerns · Realignment applied · Deferred · Alignment |
| `overwatch` | Detected Issues · Actions Taken · Research Sources · Remaining Issues · Alignment |
| `research` (any agent producing a `*-research-*.md`) | Question · Method · Sources · Findings · Confidence · Open questions · Alignment |

## Research report contract

Any report whose `<kind>` segment is `research` (e.g.
`agent-router-research-20260725-1600.md`) MUST additionally follow
this shape, inspired by ResearchGPT-style structured outputs:

```markdown
### Question
<verbatim question, one sentence>

### Method
- Tools used: <WebSearch | WebFetch | Grep | Glob | …>
- Query set: <one line per query>
- Corpus: <URLs, paths, or handles actually inspected>

### Findings
1. <claim> — evidence: <url or path:line>
2. …

### Confidence
| Finding | Confidence | Why |
|---|---|---|
| 1 | high\|medium\|low | <one line — source count, primary vs secondary> |

### Open questions
- <question that the corpus did not answer>
```

Rules:

- Every finding cites at least one URL, `path:line`, or SHA. No
  finding without a source.
- Confidence `high` requires ≥ 2 independent primary sources.
  `medium` requires 1 primary + 1 secondary. Anything else is `low`.
- Never delete a source that contradicted a finding — record it and
  note why the finding stood or fell.
- Redact per superagent-guard before quoting any external content.


## Guardrails

- **Never commit runtime reports without user opt-in.** This
  directory is inside the gitignored `.agents/` tree; force-add is a
  deliberate act, not a default.
- **Never rewrite another agent's report.** Append a follow-up file
  and cross-link it in the new report's first paragraph.
- **Never quote raw secrets.** Use the redacted preview form from
  `.qoder/skills/superagent-guard/SKILL.md`.
- **Do not exceed ~500 KB per file.** Split into part-2, part-3
  files if the merged data does not fit; each part must carry the
  alignment block independently.

## Retention

Reports are treated as ephemeral working artifacts. A future
housekeeping agent may prune anything older than 30 days that has
been superseded (a report with the same `<agent-slug>-<kind>` prefix
and a newer timestamp). Do not depend on long-term persistence here —
durable learnings belong in `.agents/knowledge/` per `AGENTS.md`.
