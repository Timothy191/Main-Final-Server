# AI Model Rules: Recommended Architecture (Required vs Optional)

Reference for authoring rules that steer AI models / agents in this monorepo.
Maps every rule mechanism to its **required** vs **optional** structure and
files, based on the agentskills.io open standard, Anthropic's Claude Code
memory documentation, and this repo's own skill library and conventions.

## Sources

| Source                                                                                | Covers                                                                       |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [agentskills.io](https://agentskills.io) — open standard (spec + best practices)      | Skills: frontmatter schema, directory layout, limits, progressive disclosure |
| Anthropic — Claude Code memory docs (`docs.anthropic.com/en/docs/claude-code/memory`) | `CLAUDE.md`, `@imports`, `.claude/rules/` path scoping, auto memory          |
| Repo skills: `.claude/skills/write-claude-md`, `create-skill`, `create-agent`         | Patterns this repo already follows                                           |
| Repo conventions: `AGENTS.md`, `.agents/`, `memory/`, `tools/agents-verify.mjs`       | Gate-enforced structure                                                      |

## 1. Mechanism overview

Five distinct mechanisms exist. They differ in **when** the model sees them:

| Mechanism                                               | Loaded                                          | Required                                | Optional                                                |
| ------------------------------------------------------- | ----------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| Memory files (`AGENTS.md`, `CLAUDE.md`)                 | Every session (subdir files on demand)          | Per-tool rule files                     | Imports, local/user/org files                           |
| Path-scoped rules (`.claude/rules/`, `.cursor/rules/`)  | At launch, or only when a matching path is read | One `.md` file per topic                | `paths:` frontmatter for on-demand loading              |
| Skills (`SKILL.md` + dirs)                              | On demand, when `description` matches the task  | `name` + `description` frontmatter      | Extra frontmatter, `scripts/`, `references/`, `assets/` |
| Agent definitions                                       | When the agent is invoked                       | `name`, `description`, `tools`, `model` | Versioning, tags, skills, MCP servers                   |
| Memory / tracing (`.agents/AGENT_TRACER.md`, `memory/`) | Cross-session                                   | None                                    | `short/`, `long/`, `INDEX.md`                           |

Rule of thumb: **behavior → memory file or rules; how-to procedure → skill;
persona/capability → agent definition; cross-session state → memory/tracing.**

## 2. Per-tool memory files (always loaded)

### `AGENTS.md` — cross-tool standard (required at repo root)

| Required                                                | Optional                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Project overview + stack table                          | Package-level `AGENTS.md` (`packages/acl`, `packages/ui`, `apps/portal/`, …) |
| Build / dev / test / lint commands (accurate, runnable) | Subdirectory `AGENTS.md` files                                               |
| Architecture rules + request path / data flow           | Links to deep docs (WAYFINDER, runbooks, design-system)                      |
| Code conventions + git/commit rules                     | Per-domain sections                                                          |
| Key files map (file → purpose)                          | Tool-specific blocks (e.g. Next.js bundled docs pointer)                     |
| Gotchas / non-obvious traps (highest-value content)     |                                                                              |

Keep `AGENTS.md` lean; put detail in linked docs. This repo enforces link
sync via `tools/agents-verify.mjs` (CI gate).

### `CLAUDE.md` — Claude Code memory file (required to interop)

| Required                                                                   | Optional                                                                          |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| First line: `@AGENTS.md` (import pattern) — then Claude-specific additions | `CLAUDE.local.md` (gitignored, machine-specific)                                  |
| Stay **under 200 lines** (Anthropic adherence guidance)                    | Subdirectory `CLAUDE.md` files (loaded when agent reads files there)              |
|                                                                            | User-level `~/.claude/CLAUDE.md`; org-managed policy `/etc/claude-code/CLAUDE.md` |
|                                                                            | `@path/to/file` imports (max 4 hops deep; backticks suppress import)              |

Without the `@AGENTS.md` import, the two files drift apart. Either import or
symlink; never maintain two copies of the same facts.

## 3. Path-scoped rules (`.claude/rules/`, `.cursor/rules/`)

| Required                                                                    | Optional                                                                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| One `.md` file per topic, discovered recursively (all `*.md` under the dir) | `paths:` YAML frontmatter with globs (`src/**/*.ts`, `**/*.{ts,tsx}`) → file is loaded **only when** the agent reads a matching file |
|                                                                             | Files **without** `paths:` frontmatter are loaded **at launch** (always-on)                                                          |
|                                                                             | Symlinks supported                                                                                                                   |

Budgets (Claude Code): 1,000 patterns / 4 MiB per rule file (brace-expansion
budget). Cursor mirrors the pattern via `.cursor/rules/` (docs are
JS-rendered and were not verifiable this session; treat Cursor specifics as
uncertain — this repo's `.cursor/rules/` is currently empty).

Split one rule per topic: `design-system.md`, `testing.md`, `gotchas.md`.
A topic file with `paths:` scoping is the on-demand equivalent of a
subdirectory `CLAUDE.md`, but cleaner.

## 4. Skills — procedural knowledge (agentskills.io)

A skill is a **directory** containing `SKILL.md` plus optional companion dirs.

### Required

| Item                      | Constraint                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `SKILL.md` at skill root  | < 500 lines / < 5000 tokens (CI-enforced in this repo)                                                           |
| Frontmatter `name`        | ≤ 64 chars; lowercase alphanumeric + hyphens; must match directory name; no leading/trailing/consecutive hyphens |
| Frontmatter `description` | ≤ 1024 chars; states _when to activate_ (it is the only thing the agent sees at discovery)                       |

### Optional

| Item                        | Notes                                             |
| --------------------------- | ------------------------------------------------- |
| Frontmatter `license`       | Reuse/spelling matters for open sourcing          |
| Frontmatter `compatibility` | ≤ 500 chars; which tools/models the skill targets |
| Frontmatter `metadata`      | Free key-value map                                |
| Frontmatter `allowed-tools` | Experimental; space-separated tool allow-list     |
| `scripts/`                  | Executable helpers invoked by the skill           |
| `references/`               | Deep-dive docs, examples, templates               |
| `assets/`                   | Static files (images, data)                       |

### Progressive disclosure (the core design rule)

1. **Discovery** — only `name` + `description` are loaded (drives activation).
2. **Activation** — full `SKILL.md` is read when the description matches.
3. **Execution** — `scripts/`, `references/`, `assets/` load on demand.

Keep the discovery layer sharp; never bury the trigger in the body.

## 5. Agent definitions (repo `create-agent` pattern)

| Required                              | Optional                           |
| ------------------------------------- | ---------------------------------- |
| `name`                                | `version`                          |
| `description` (persona + when to use) | `author`, `created`                |
| `tools` (least-privilege selection)   | `tags`, `priority`                 |
| `model`                               | `skills` (curated, not exhaustive) |
|                                       | `mcp_servers`                      |

Agents also require registry integration + discovery symlinks per this repo's
`sync-discovery-symlinks.sh` conventions.

## 6. Memory & tracing (repo convention)

| Required                         | Optional                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| None (structure is conventional) | `.agents/AGENT_TRACER.md` — sequential entries (Agent / Timestamp / Purpose / Changes / Dependencies / Notes), optional `DRIFT SCORE: <0..1>` line (≥ 0.1 fails `check:drift`) |
|                                  | `memory/<agent-name>-memory/` with `short/` (task-state snapshots), `long/` (permanent learnings), `INDEX.md` (purpose of each log)                                            |

## 7. Synthesized best practices

- **Progressive disclosure everywhere:** discovery layer → full rule → assets,
  never all-at-once.
- **One topic per file**; scope a rule like a function (coherent, minimal).
- **Size budgets:** `CLAUDE.md` < 200 lines; `SKILL.md` < 500 lines / 5k tokens;
  rules short and specific.
- **Match specificity to fragility:** prescriptive for fragile operations,
  leave freedom where outcomes are tolerant.
- **Defaults, not menus:** state the one recommended way, not a catalog.
- **Procedures over declarations:** how-to beats statements of intent.
- **Gotchas are the highest-value content** — document what the model would
  otherwise get wrong (the repo's AGENTS.md gotchas section is the model).
- **Templates for output format; checklists for multi-step workflows.**
- **Validation loops;** plan-validate-execute for destructive operations.
- **Keep agent infrastructure out of runtime code** (repo rule: `.cursor/`,
  `.agents/`, `.claude/` are never a runtime dependency of product code).
- **Verify with gates:** `pnpm agents:verify` + `pnpm lint:markdown` after any
  rule/doc change.

## 8. Gaps observed in this repo

- `.claude/rules/` and `.cursor/rules/` exist but are empty (only `.gitkeep`).
  High-value candidates:
  - `design-system.md` with `paths: packages/ui/** packages/theme/**`
  - `testing.md` with `paths: **/*.test.*`
  - `gotchas.md` (launch-loaded, no `paths:`) — mirror the AGENTS.md gotchas
  - `nextjs-rules.md` with `paths: apps/portal/src/app/**`
- No `.github/copilot-instructions.md` and no `.cursorrules` file.
- A `create-ai-rules` skill capturing this architecture would follow the
  `create-skill` procedure (frontmatter, Expected/On-failure pairs, validation
  checklist, pitfalls) and would codify the required/optional map above.

## 9. Quick decision guide

| Need                                  | Mechanism                                     |
| ------------------------------------- | --------------------------------------------- |
| Rule applies repo-wide, every session | `AGENTS.md` section / `CLAUDE.md`             |
| Rule applies only to certain paths    | `.claude/rules/<topic>.md` with `paths:`      |
| Always-on topic rule                  | `.claude/rules/<topic>.md` without `paths:`   |
| How-to procedure / workflow           | `SKILL.md` skill                              |
| Persona / capability definition       | Agent definition                              |
| Cross-session state / learnings       | `memory/<agent>/` + `.agents/AGENT_TRACER.md` |
