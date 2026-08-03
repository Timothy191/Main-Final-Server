---
allowed-tools: Read, Glob, Grep, Write, Edit
description: Create an Architecture Decision Record in the Arch-System convention (packages/theme/DECISIONS.md for visual/structural, docs/architecture/ for non-visual), per the AGENTS.md design-system and documentation rules
---

## Arguments

- `$ARGUMENTS`: the decision to make or system to design (e.g. "Kafka vs SQS for the event bus", "introduce a read-replica Supabase client")

## Your task

Produce an Architecture Decision Record (ADR) in the **Arch-System convention**,
not a generic one. AGENTS.md mandates two ADR homes, and the choice depends on
whether the decision is visual/structural or not:

- **Visual / design-system structural** decision (token schema change, new
  surface role, new variant, glass-schema change) → ADR in
  [`packages/theme/DECISIONS.md`](../../packages/theme/DECISIONS.md), and update
  `docs/design-system/DESIGN.md` (+ `docs/design-system/SPEC.md` for value
  changes) in the same change.
- **Non-visual architecture** decision (service boundaries, data-store choice,
  caching strategy, ACL placement, runtime split) → ADR note in
  [`docs/architecture/`](../../docs/architecture/).

### Step 1: Classify and locate

Read `packages/theme/DECISIONS.md` and `docs/architecture/` to match the existing
numbering/structure. Decide which home the ADR belongs in. If unsure, ask the
user which kind of decision it is.

### Step 2: Read constraints

Read the authoritative docs for the area the decision touches (use
[`docs/WAYFINDER.md`](../../docs/WAYFINDER.md) to map concept → entry point →
existing ADR/trace). Surface the real constraints the decision must honor:
e.g. edge-safe `@repo/acl` (no Node APIs), `@repo/errors` constructor contract,
the on-prem Supabase policy, the design-system R2/R3/R4 tiers, the turbo
cache-masking gotcha, RLS.

### Step 3: Write the ADR

```markdown
# ADR-[number]: [Title]

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** [Date]
**Deciders:** [who needs to sign off]

## Context
[The situation and the forces at play — incl. the Arch-System-specific
constraints from Step 2]

## Decision
[The change being proposed]

## Options Considered

### Option A: [Name]
| Dimension | Assessment |
|-----------|------------|
| Complexity | [Low/Med/High] |
| Cost | [assessment] |
| Scalability | [assessment] |
| Team familiarity | [assessment] |

**Pros:** [list]
**Cons:** [list]

### Option B: [Name]
[same format]

## Trade-off Analysis
[Key trade-offs with clear reasoning]

## Consequences
- [What becomes easier]
- [What becomes harder]
- [What we'll need to revisit]

## Action Items
1. [ ] [implementation step]
2. [ ] [follow-up]
```

### Step 4: Wire the ADR into the doc system (mandatory)

- **Visual ADR**: update `docs/design-system/DESIGN.md` (and SPEC.md for value
  changes) in the same change, per the AGENTS.md design-system rule. Leaving
  these stale after a token/structural change is a rule violation.
- Append a row to `docs/REPO-CHANGE-INDEX.md` (Area: the wayfinder concept, e.g.
  `design-system` or `architecture`), listing the ADR file in **Files** and
  every doc updated in the same change in **Docs updated**.
- If the ADR changes behavior an agent would need to know next, leave an
  `// AGENT-TRACE:` breadcrumb in the affected code and an entry in the relevant
  `AGENT_TRACER.md`.

### Step 5

Present the ADR path + the doc updates to the user for review before declaring
the decision recorded.