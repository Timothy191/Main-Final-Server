## ADDED Requirements

### Requirement: Shared progressive-disclosure reference exists

The fleet SHALL provide a single shared reference at `.cursor/agents/_shared/references/swarm-edge-critique-refine.md` that documents Edge optimization and Critique→Refine as progressive-disclosure detail (not always-on rule bulk).

#### Scenario: Operator loads shared pattern doc

- **WHEN** an agent or human needs the GPTSwarm-inspired handoff/critique patterns
- **THEN** they load `.cursor/agents/_shared/references/swarm-edge-critique-refine.md` on demand without expanding always-on rules

### Requirement: Edge optimization documented

The shared reference MUST define Edge optimization as: log/score agent→agent handoffs; prune dead routes; prefer successful edges in routing recommendations.

#### Scenario: Routing optimizer consults edge guidance

- **WHEN** `routing-optimizer` evaluates provider/route priority or handoff health
- **THEN** it follows the shared Edge optimization section (score edges, prune dead routes, prefer successful edges)

### Requirement: Critique→Refine loop documented

The shared reference MUST define Critique→Refine as: Generate → Critique (`sceptic`) → Refine (`root-cause-healer` / implementers) → Score (`agent-alignment-score` skill). Formal score MUST remain owned by `agent-alignment-score`; no gold-standard-enforcer agent SHALL be created.

#### Scenario: Post-change quality loop

- **WHEN** non-trivial work completes and needs reality-check then formal score
- **THEN** the loop is Critique via `sceptic`, Refine via heal/implement owners if needed, then Score via `agent-alignment-score`

### Requirement: Owning agents wire pointers without bloating entries

The following agent entry files MUST include a short link to the shared reference while remaining ≤65 lines; long detail stays in `references/` or the shared doc: `agency-lead`, `routing-optimizer`, `sceptic`, `root-cause-healer`. Optionally `gap-analyst` and `patch-builder` MAY link for analyze→implement rounds.

#### Scenario: Entry size and discovery

- **WHEN** `pnpm ai check` validates agent layout after wiring
- **THEN** each wired entry stays within the agent-layout line limit and resolves the shared reference path

### Requirement: Auto-routing rule stays lean

`.cursor/rules/04-subagent-auto-routing.mdc` MUST gain at most a short pointer or one-line note to the shared reference; it MUST NOT embed full Edge or Critique→Refine tables.

#### Scenario: Always-on rule size

- **WHEN** the routing rule is updated for this change
- **THEN** the addition is a single short pointer/note, not duplicated pattern tables

### Requirement: No new agents; inventory unchanged unless agents added

This change MUST NOT create new agents. AGENTS.md and `.cursor/agents/README.md` inventory updates are required only if a new agent is created (prefer none). AgentPipe patterns are out of scope; awesome-agent-evolution remains on-demand catalog only.

#### Scenario: Prefer references over new agents

- **WHEN** implementers apply this change
- **THEN** no new `.cursor/agents/<name>.md` is added and no gold-standard-enforcer agent exists

### Requirement: Optional skill distill hook

If `skill-self-improve` is updated for this change, it MUST document distill-after-successful Critique→Refine / edge loops and MUST NOT invent or soften AGENTS.md policy. Skipping the skill update is allowed.

#### Scenario: Adaptive distill after success

- **WHEN** Adaptive next is distill/patch after a successful loop meeting Hermes criteria and the skill was wired
- **THEN** `skill-self-improve` MUST be invocable per existing adaptive-skill-loop rules without policy fork

### Requirement: Docs and AI surfaces only

Implementation MUST touch only docs/AI surfaces (agents, shared refs, optional skill, lean rule pointer). It MUST NOT change product UI, add Python dependencies, or vendor GPTSwarm source.

#### Scenario: Scope guard

- **WHEN** the change is applied and reviewed
- **THEN** `apps/portal/` and product packages are untouched and no GPTSwarm package is vendored
