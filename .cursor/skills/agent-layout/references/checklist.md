# New agent checklist

- [ ] Entry file `.cursor/agents/<name>.md` (flat — required by Cursor)
- [ ] Collateral folder `.cursor/agents/<name>/` with `references/` + `assets/`
- [ ] YAML: `name`, `description` with anti-triggers
- [ ] Optional: `model`, `readonly`, `is_background` per Cursor docs
- [ ] Link `_shared/references/gold-standard-contract.md`
- [ ] Entry ≤65 lines; depth in `references/`
- [ ] `references/when-to-use.md` has real wake/anti-trigger bullets — **no `[specific triggers]` placeholders**
- [ ] Output template in `assets/`
- [ ] **Inventories (same change)** — keep all in sync:
  - [ ] `.cursor/agents/README.md`
  - [ ] `.cursor/rules/04-subagent-auto-routing.mdc` (routing table + inventory)
  - [ ] `AGENTS.md` Project Agents table
  - [ ] `CLAUDE.md` Subagents table
  - [ ] `.cursor/standards/agent-layout/scripts/validate-agents.sh` `AGENTS=(...)` array
  - [ ] If external CLI: `_shared/references/external-cli-matrix.md` + `scripts/run-headless.sh`
- [ ] Run `validate-agents.sh` then `pnpm ai check`
- [ ] CLI wrappers: see [`cli-headless-wrappers.md`](cli-headless-wrappers.md)
