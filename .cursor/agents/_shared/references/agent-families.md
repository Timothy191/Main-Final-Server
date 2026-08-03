# Agent families (superagent map)

Research-backed Arch Systems pattern: **orchestrator + specialists**, not fewer god-agents.
“Superagent” here means a **family** with one public coordinator and kept peer entries for routing/anti-triggers.

## Family: Portal slice

| Role | Agent | When |
|---|---|---|
| **Coordinator / vertical slice** | `nextjs-fullstack` | UI + Server Actions + data + RH in one feature |
| Brand composition | `frontend-design` | First-viewport / branded hero only |
| UI paint | `frontend-implementer` | Portal UI without owning full data/API architecture |
| API/service design | `backend-architect` | Architecture without portal paint |

**Do not merge** design + implement + fullstack — different QA bars and anti-triggers.

## Family: Healing agency

| Role | Agent | When |
|---|---|---|
| **Coordinator** | `agency-lead` | Background analyze→implement→critique loops |
| Round 1 | `gap-analyst`, `spec-auditor`, `routing-optimizer` | Parallel analyze (no patches) |
| Round 2 | `patch-builder` | Structural apply after Round 1 |
| Close loop | `root-cause-healer` | When a hypothesis already exists |
| Side work | `idle-runner` | Non-critical while blocked |

**Do not flatten** Round 1 into one entry — parallelism and readonly/write boundaries matter.

## Family: AI surface ops

| Role | Agent / skill | When |
|---|---|---|
| Every-prompt janitor | `ai-maintenance-checker` | Background `pnpm ai check` |
| Prune / bloat | `ai-system-optimizer` | Maintenance / unbloat cycles |
| Docs / inventory mirrors | `ai-docs-sync` | After AI-surface edits |
| Unified CLI | `ai-system` skill | `pnpm ai` |

## Family: Quality gate (skills)

| Role | Skill | When |
|---|---|---|
| **Canonical** | `quality` | Full monorepo or portal mode |
| Portal alias | `verify` | Portal-only |
| GitHub/Copilot alias | `verify-changes` | Same as `quality` full |

## Family: Review / score (never merge)

| Role | Surface |
|---|---|
| Adversarial review | `sceptic` agent |
| Formal Alignment Score | `agent-alignment-score` skill |
| AppSec | `security` agent |

## Layout meta-skills (keep separate)

`skill-layout` · `agent-layout` · `claude-code-layout` — different standards paths; enforced together via `pnpm ai check`.
