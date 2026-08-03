# CLI headless wrappers (distilled)

Reuse when adding or debugging `openspec` / `aider` / `goose` / `omp`. Canonical matrix: [`external-cli-matrix.md`](../../../agents/_shared/references/external-cli-matrix.md).

## Shared wrapper contract

Every `scripts/run-headless.sh` must:

1. `set -euo pipefail` + prepend `~/.local/bin` and `~/.npm-global/bin`
2. `cd` to `CLI_AGENT_ROOT` or git toplevel
3. Require GNU `timeout`; default `CLI_AGENT_TIMEOUT_SEC=600` (fail-closed)
4. Print stderr label: `agent=<name> mode=headless cwd=… timeout=…`
5. Reject interactive / dangerous modes (goose `smart_approve`; omp `yolo`)
6. Never echo API keys or secrets

## Verify ladder (cheap → paid)

| Tier          | Command                                                         | Needs LLM key? |
| ------------- | --------------------------------------------------------------- | -------------- |
| 0 Usage       | run wrapper with no args → usage + exit 2                       | No             |
| 1 Mode blocks | `GOOSE_MODE=smart_approve` / `OMP_APPROVAL_MODE=yolo` → blocked | No             |
| 2 Doctor      | `openspec/scripts/run-headless.sh doctor`                       | No             |
| 3 Validate    | `openspec/scripts/run-headless.sh validate`                     | No             |
| 4 Paid smoke  | `CLI_AGENT_TIMEOUT_SEC=30 …/run-headless.sh "Reply OK"`         | Yes            |

Score Verify honestly: tiers 0–3 prove wiring; tier 4 only when a **valid** provider key works. Auth errors (e.g. `API_KEY_INVALID`) are not a pass — note them and keep Security gap open.

## Pitfalls

- Aider may print auth failures yet still exit 0 — treat stderr auth errors as fail for scoring.
- Goose default without wrapper hangs on approve prompts — always use the wrapper.
- Invoke from **repo root**; do not re-implement CLI jobs in the parent thread.
- After any new CLI agent: update inventories (see checklist) in the **same** change.

## Source

- Session: CLI agents wiring + Adaptive next `reuse` (2026-07-19)
- Pattern: four parallel wrappers with shared hygiene
