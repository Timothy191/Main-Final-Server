# External CLI agents — decision matrix

Parents auto-delegate via `.cursor/rules/04-subagent-auto-routing.mdc`. Each specialist shells out headlessly; do not re-implement their job in the parent.

| Agent      | Best for                                | Wake signals                                                                        | Anti-triggers                                 | Headless entry                     |
| ---------- | --------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------- |
| `openspec` | Change lifecycle under `openspec/`      | Multi-file feature, change proposal, validate specs, before implement / after tasks | Portal paint, branded hero, pure lint         | `openspec/scripts/run-headless.sh` |
| `aider`    | Surgical edits on a known file set      | “Edit these files”, one-shot pair fix                                               | Open research, MCP recipes, design            | `aider/scripts/run-headless.sh`    |
| `goose`    | Recipes / MCP / general automation      | Recipe run, research→act, multi-tool automate                                       | Tiny single-file edit, OpenSpec-only validate | `goose/scripts/run-headless.sh`    |
| `omp`      | Heavier coding harness / large refactor | Deep multi-file coding when aider too narrow                                        | Spec-only, brand, docs drift                  | `omp/scripts/run-headless.sh`      |

## Coexistence

- **Kiro** (`.kiro/specs/`) remains the AGENTS.md multi-file gate.
- **OpenSpec** owns `openspec/changes` + `openspec/specs` — parallel track; do not migrate Kiro blindly.

## Operator hygiene (cookbook — not product code)

From [cursor/cookbook/self-hosted-cloud-agent](https://github.com/cursor/cookbook/tree/main/self-hosted-cloud-agent) — transferable ops only; do **not** vendor EC2/ECS/EKS pools into this monorepo.

1. **PATH** — wrappers prepend `~/.local/bin` and `~/.npm-global/bin`.
2. **Secrets** — never echo API keys; use existing env / user config.
3. **Timeout** — `CLI_AGENT_TIMEOUT_SEC` (default `600`); fail closed on hang.
4. **Labels** — reports include `agent`, `mode=headless`, `cwd`, `exit_code`.
5. **Non-interactive** — no TUI; no stdin prompts.
6. **Git cwd** — require a git checkout when the tool needs repo context.
7. **Pin versions** — record `aider` / `goose` / `omp` / `openspec` versions when debugging.
8. **Env reload** — new env ⇒ new process (do not assume long-lived pickups).

Optional later isolation: cookbook `make docker-run` — out of band for this wiring.

## Security posture (headless)

| Agent      | Default mode            | Risk                             | Mitigation                                                                       |
| ---------- | ----------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| `openspec` | `--no-interactive`      | Low (validate/list)              | No secrets in output                                                             |
| `aider`    | `--no-auto-commits`     | Medium (file writes)             | Explicit file args; review diff                                                  |
| `goose`    | `GOOSE_MODE=auto`       | **High** (tools without prompts) | Timeout fail-closed; prefer `chat` for research-only; never pass secrets in `-t` |
| `omp`      | `--approval-mode write` | Medium (writes)                  | `yolo` blocked by wrapper                                                        |

Invoke all scripts from **repo root**: `.cursor/agents/<name>/scripts/run-headless.sh`.

**Verify ladder (canonical):** `.cursor/skills/agent-layout/references/cli-headless-wrappers.md` — do not duplicate steps here.
