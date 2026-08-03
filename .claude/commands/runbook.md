---
allowed-tools: Bash(git log:*), Read, Glob, Grep, Write, Edit
description: Create or update an Arch-System operational runbook in docs/runbooks/, wired to the WAYFINDER structural index and the REPO-CHANGE-INDEX rule
---

## Arguments

- `$ARGUMENTS`: the process or task to document (e.g. "restart Redis cluster", "rotate Supabase service-role key")

## Your task

Create or update an operational runbook for a recurring Arch-System ops task,
following the format already used in `docs/runbooks/` (see the Redis and
circuit-breaker runbooks there for tone and structure). Be painfully specific —
"Run the script" is not a step; the exact command from the repo root is.

### Step 1: Check for an existing runbook

`Glob`/`Grep` `docs/runbooks/` for the topic. If a runbook exists, **update** it
in place (preserve its history section) rather than creating a duplicate. If
none exists, create `docs/runbooks/<kebab-name>.md`.

### Step 2: Read related context

- The relevant runbook(s) in `docs/runbooks/` for structure/tone.
- `docs/WAYFINDER.md` to see where the runbook should be indexed.
- The actual repo paths/commands the procedure touches (e.g. `pnpm supabase:start`,
  `@repo/redis` cache commands, `docker-compose.yml`, `apps/portal/src/proxy.ts`).
  Do not invent commands — read the code and cite real ones.

### Step 3: Write the runbook

```markdown
# Runbook: [Task Name]

**Owner:** [team/person] | **Frequency:** [Daily/Weekly/As Needed]
**Last Updated:** [Date] | **Last Run:** [Date]

## Purpose
[What this runbook accomplishes and when to use it]

## Prerequisites
- [ ] [Access or permission needed]
- [ ] [Tool or system required — e.g. local Supabase stack running, Redis CLI]
- [ ] [Data or input needed]

## Procedure

### Step 1: [Name]
```bash
[exact command from the repo root]
```
**Expected result:** [what should happen]
**If it fails:** [what to do]

### Step 2: [Name]
[...]

## Verification
- [ ] [How to confirm the task completed successfully]
- [ ] [What to check — e.g. cache hit rate, Supabase Studio, smoke harness]

## Troubleshooting
| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| [what you see] | [why] | [what to do] |

## Rollback
[How to undo this if something goes wrong — exact commands]

## Escalation
| Situation | Contact | Method |
|-----------|---------|--------|
| [when to escalate] | [who] | [how to reach them] |

## History
| Date | Run by | Notes |
|------|--------|-------|
| [Date] | [person] | [issues/observations] |
```

### Step 4: Wire the runbook into the doc system (mandatory)

- Add the new runbook to the **operational runbooks** entry in
  `docs/WAYFINDER.md` (the structural index — concept → entry point → ADR/trace
  → how-to-extend). A runbook not in the wayfinder is one an agent won't find.
- Append a row to `docs/REPO-CHANGE-INDEX.md` (Area: `runbooks`), listing the
  runbook file in **Files** and `docs/WAYFINDER.md` + `docs/REPO-CHANGE-INDEX.md`
  in **Docs updated**. `none` is a red flag.
- If the runbook documents non-obvious logic, leave an `// AGENT-TRACE:` breadcrumb
  in the related code.

### Step 5

Present the runbook path and the wayfinder/change-index updates to the user for
review.