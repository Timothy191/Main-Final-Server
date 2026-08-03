#!/usr/bin/env bash
# Arch Systems — unified AI system command.
# Merges: inventory, guardrails, layout validate, sync, dedupe, drift audit, provider health.
#
# Usage:
#   pnpm ai              # status (default)
#   pnpm ai init         # first-time / cold start
#   pnpm ai onboard      # human + agent onboarding checklist
#   pnpm ai check        # validate only (exit 1 on failure)
#   pnpm ai fix          # safe auto-repair then check
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODE="${1:-status}"
QUIET=0
JSON=0
for arg in "$@"; do
  case "$arg" in
    --quiet) QUIET=1 ;;
    --json) JSON=1 ;;
  esac
done

log() { [[ "$QUIET" -eq 1 ]] || echo "$*"; }
section() { [[ "$QUIET" -eq 1 ]] || echo ""; [[ "$QUIET" -eq 1 ]] || echo "=== $* ==="; }

ERR=0
WARN=0
fail() { echo "  FAIL: $1"; ERR=$((ERR + 1)); }
warn() { echo "  WARN: $1"; WARN=$((WARN + 1)); }
ok()   { [[ "$QUIET" -eq 1 ]] || echo "  OK: $1"; }

REPORT_DIR="${TMPDIR:-/tmp}/arch-ai-$$"
mkdir -p "$REPORT_DIR"
trap 'rm -rf "$REPORT_DIR"' EXIT

# --- Phase 1: Inventory ---
run_inventory() {
  section "Inventory"
  if [[ -x .cursor/agents/ai-docs-sync/scripts/inventory.sh ]]; then
    .cursor/agents/ai-docs-sync/scripts/inventory.sh >"$REPORT_DIR/inventory.txt" 2>&1 || true
    [[ "$QUIET" -eq 0 ]] && head -40 "$REPORT_DIR/inventory.txt"
    ok "inventory captured"
  else
    warn "inventory.sh missing"
  fi
}

# --- Phase 2: Guardrails (gold standard / real-world / SOUL) ---
run_guardrails() {
  section "Guardrails (gold standard)"
  local required=(
    AGENTS.md
    SOUL.md
    CLAUDE.md
    .cursor/rules/01-real-world-logic.mdc
    .cursor/rules/02-agent-scoring.mdc
    .cursor/rules/00-global-alignment.mdc
    .cursor/agents/_shared/references/gold-standard-contract.md
    .cursor/hooks.json
    .cursor/hooks/alignment-gate.mjs
    .cursor/hooks/block-forbidden.mjs
    .agents/knowledge/README.md
    .agents/knowledge/index.md
  )
  for f in "${required[@]}"; do
    [[ -f "$f" ]] && ok "$f" || fail "missing guardrail: $f"
  done

  if rg -q 'OBSERVE.*HYPOTHESIZE.*VERIFY' .cursor/rules/01-real-world-logic.mdc 2>/dev/null; then
    ok "real-world loop enforced"
  else
    fail "01-real-world-logic.mdc missing OBSERVE→VERIFY loop"
  fi

  if rg -q 'Never use npm|pnpm 9' AGENTS.md .cursor/rules/03-stack-hard-gates.mdc 2>/dev/null; then
    ok "stack never-dos present"
  else
    warn "stack never-dos spot check incomplete"
  fi

  if rg -q 'verifiable|evidence|grounded' SOUL.md 2>/dev/null; then
    ok "SOUL.md evidence contract"
  else
    warn "SOUL.md missing evidence language"
  fi

  if rg -q 'Shared Knowledge Base|\.agents/knowledge' AGENTS.md 2>/dev/null; then
    ok "knowledge base registered in AGENTS.md"
  else
    fail "AGENTS.md missing Shared Knowledge Base reference"
  fi
}

# --- Phase 3: Restore missing standard library files ---
restore_standards() {
  section "Restore standards (fix)"
  local refs_dir=".cursor/standards/agent-skills/references"
  mkdir -p "$refs_dir" ".cursor/standards/claude-code/references" ".cursor/standards/claude-code/scripts"

  local topics=(
    "01-overview:Agent Skills overview — folders, discovery, progressive disclosure"
    "02-structure:SKILL.md + scripts/ + references/ + assets/ layout"
    "03-frontmatter:YAML name + description (trigger surface for routing)"
    "04-authoring:Lean entry; move depth to references/"
    "05-scripts:Executable scripts — deterministic, idempotent wrappers"
    "06-references:On-demand docs; never duplicate SKILL.md body"
    "07-assets:Templates and static artifacts"
    "08-discovery:Index READMEs per surface; npx skills find/add"
    "09-validation:validate.sh integration; 0 errors before merge"
    "10-security:No secrets in skills; server-only boundaries"
    "11-multi-surface:Cursor, Qoder, GitHub — one canonical procedure"
    "12-routing:Agents orchestrate; skills encode procedures"
    "13-evaluation:Test skills on real tasks; measure pass rate"
    "14-descriptions:Specific triggers; anti-patterns for misfires"
    "15-anti-patterns:Watered copies, policy forks, giant SKILL.md"
    "17-skill-creation:Best practices — ground in repo expertise"
    "18-optimizing-descriptions:Trigger phrases + negative scope"
    "19-evaluating-skills:Output quality rubric before shipping"
    "20-using-scripts:When to script vs inline; error handling"
  )
  for entry in "${topics[@]}"; do
    local file="${entry%%:*}"
    local title="${entry#*:}"
    local path="$refs_dir/${file}.md"
    if [[ ! -f "$path" ]]; then
      cat >"$path" <<EOF
# ${title}

Canonical: [\`STANDARD.md\`](../STANDARD.md) · Source: [agentskills.io](https://agentskills.io/home)

${title}. See \`.cursor/standards/agent-skills/STANDARD.md\` and \`pnpm ai check\`.

## Enforcement

- Real-world verify before claiming done (SOUL.md, \`01-real-world-logic.mdc\`)
- No watered-down duplicate skills — alias or merge (see \`ai-maintenance-checker/references/merge-rules.md\`)
EOF
      log "  restored $path"
    fi
  done

  if [[ ! -f .cursor/standards/claude-code/STANDARD.md ]]; then
    mkdir -p .cursor/standards/claude-code
    cat >.cursor/standards/claude-code/STANDARD.md <<'EOF'
# Claude Code Standard (Project Canonical)

Native Anthropic Claude Code surfaces under `.claude/`. Policy source: `AGENTS.md` — never fork.

## Layout

```
.claude/
├── CLAUDE.md           # @imports root CLAUDE.md + SOUL.md
├── settings.json       # permissions + hooks (committed)
├── rules/              # modular path-scoped rules
├── skills/             # symlinks → .cursor/skills/
├── agents/             # symlinks → .cursor/agents/*.md
└── scripts/sync-surfaces.sh
```

## Validate

```bash
.cursor/standards/claude-code/scripts/validate-claude-code.sh
```

## Sync after changes

```bash
.claude/scripts/sync-surfaces.sh
# or: pnpm ai fix
```
EOF
    log "  restored claude-code STANDARD.md"
  fi

  if [[ ! -x .cursor/standards/claude-code/scripts/validate-claude-code.sh ]]; then
    cat >.cursor/standards/claude-code/scripts/validate-claude-code.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ERR=0
fail() { echo "  FAIL: $1"; ERR=$((ERR + 1)); }
ok() { echo "  OK: $1"; }
echo "=== Claude Code validate ==="
for f in .claude/CLAUDE.md .claude/settings.json .claude/README.md; do
  [[ -f "$f" ]] && ok "$f" || fail "missing $f"
done
[[ -d .claude/rules ]] && ok ".claude/rules/" || fail "missing .claude/rules/"
[[ -x .claude/scripts/sync-surfaces.sh ]] && ok "sync-surfaces.sh" || fail "missing sync script"
[[ -f .cursor/standards/claude-code/STANDARD.md ]] && ok "STANDARD.md" || fail "missing STANDARD"
echo "Claude Code: $ERR error(s)"
[[ $ERR -eq 0 ]]
EOF
    chmod +x .cursor/standards/claude-code/scripts/validate-claude-code.sh
  fi

  if [[ ! -f .cursor/skills/claude-code-layout/SKILL.md ]]; then
    mkdir -p .cursor/skills/claude-code-layout/scripts .cursor/skills/claude-code-layout/references
    cat >.cursor/skills/claude-code-layout/SKILL.md <<'EOF'
---
name: claude-code-layout
description: >-
  Validates and syncs Claude Code .claude/ surfaces. Use when adding Claude rules,
  settings, or syncing skills/agents to .claude/. Anti-trigger: product UI work.
---

# Claude Code Layout

Standard: `.cursor/standards/claude-code/STANDARD.md`

## Workflow

1. `.claude/scripts/sync-surfaces.sh`
2. `scripts/validate.sh`
EOF
    cat >.cursor/skills/claude-code-layout/scripts/validate.sh <<'EOF'
#!/usr/bin/env bash
exec "$(git rev-parse --show-toplevel)/.cursor/standards/claude-code/scripts/validate-claude-code.sh" "$@"
EOF
    chmod +x .cursor/skills/claude-code-layout/scripts/validate.sh
    log "  restored claude-code-layout skill"
  fi

  if [[ ! -f .cursor/skills/ai-system/SKILL.md ]]; then
    mkdir -p .cursor/skills/ai-system/scripts .cursor/skills/ai-system/references
    cat >.cursor/skills/ai-system/SKILL.md <<'EOF'
---
name: ai-system
description: >-
  Unified AI system check — guardrails, layouts, sync, dedupe, drift. Use for init,
  onboard, status, check, fix. Anti-trigger: portal product features.
---

# AI System (unified command)

Run: `pnpm ai [init|onboard|status|check|fix]`

Standard: `.cursor/standards/ai-system/STANDARD.md`
EOF
    ln -sf ../../../scripts/ai.sh .cursor/skills/ai-system/scripts/ai.sh 2>/dev/null || true
    log "  restored ai-system skill"
  fi

  if [[ ! -f .cursor/standards/ai-system/STANDARD.md ]]; then
    mkdir -p .cursor/standards/ai-system/references
    cat >.cursor/standards/ai-system/STANDARD.md <<'EOF'
# AI System Standard (Unified Command)

Single entry: **`pnpm ai`** — replaces scattered validate/sync/inventory scripts.

## Modes

| Mode | Purpose |
|------|---------|
| `init` | Cold start: restore standards, sync, validate |
| `onboard` | Checklist for humans + agents joining the repo |
| `status` | Read-only health report (default) |
| `check` | Validate only; exit 1 on failure |
| `fix` | Safe repair + check |

## Pipeline

```
INVENTORY → GUARDRAILS → LAYOUT → SYNC → DEDUPE → DRIFT → PROVIDERS → REPORT
```

## Gold enforcement

- SOUL.md + `01-real-world-logic.mdc` — evidence before claims
- `02-agent-scoring.mdc` — Alignment Score ≥80
- Hooks — session alignment + forbidden commands
- `ai-maintenance-checker` — background layout janitor every prompt

## Merged commands (do not run separately)

- `.cursor/standards/agent-skills/scripts/validate.sh`
- `.cursor/standards/agent-layout/scripts/validate-agents.sh`
- `.cursor/standards/claude-code/scripts/validate-claude-code.sh`
- `.claude/scripts/sync-surfaces.sh`
- `.cursor/agents/ai-docs-sync/scripts/inventory.sh`
- `.cursor/agents/ai-docs-sync/scripts/verify-mirrors.sh`
- `.cursor/agents/ai-maintenance-checker/scripts/run-maintenance.sh`
- `.cursor/skills/provider-router/scripts/provider-router.sh`
EOF
    log "  restored ai-system STANDARD.md"
  fi
}

# --- Phase 4: Sync ---
run_sync() {
  section "Sync surfaces"
  if [[ -x .claude/scripts/sync-surfaces.sh ]]; then
    .claude/scripts/sync-surfaces.sh || fail "sync-surfaces.sh failed"
    ok "claude mirrors synced"
  else
    fail "missing .claude/scripts/sync-surfaces.sh"
  fi
}

# --- Phase 5: Layout validation ---
run_layout() {
  section "Layout validation"
  if [[ -x .cursor/standards/agent-skills/scripts/validate.sh ]]; then
    .cursor/standards/agent-skills/scripts/validate.sh || fail "agent-skills validate"
  else
    fail "missing agent-skills validate.sh"
  fi
}

# --- Phase 6: Dedupe (watered-down copies) ---
run_dedupe() {
  section "Skill dedupe scan"
  if [[ -x .cursor/agents/ai-maintenance-checker/scripts/detect-duplicate-skills.sh ]]; then
    if ! .cursor/agents/ai-maintenance-checker/scripts/detect-duplicate-skills.sh; then
      fail "duplicate skills detected — merge or alias per merge-rules.md"
    else
      ok "no cross-surface duplicate skill names"
    fi
  else
    # inline lightweight scan
    local dup=0
    declare -A seen
    for base in .cursor/skills .qoder/skills .github/skills; do
      [[ -d "$base" ]] || continue
      for dir in "$base"/*/; do
        [[ -d "$dir" ]] || continue
        name=$(basename "$dir")
        [[ "$name" == "README.md" ]] && continue
        if [[ -n "${seen[$name]:-}" && "${seen[$name]}" != "$base" ]]; then
          warn "duplicate skill name '$name' in ${seen[$name]} and $base — merge or alias"
          dup=$((dup + 1))
        fi
        seen[$name]="$base"
      done
    done
    [[ $dup -eq 0 ]] && ok "no cross-surface duplicate skill names"
  fi
}

# --- Phase 7: Drift audit ---
run_drift() {
  section "Drift audit"
  local needles=("pnpm 9" "Never use npm" "Zod" "AppError" "Alignment Score")
  for needle in "${needles[@]}"; do
    if rg -q "$needle" AGENTS.md 2>/dev/null; then
      if rg -q "$needle" .cursor/rules/00-global-alignment.mdc CLAUDE.md 2>/dev/null; then
        ok "mirror contains: $needle"
      else
        warn "AGENTS.md has '$needle' but cursor mirror may be stale"
      fi
    fi
  done
}

# --- Phase 8: Provider health check ---
run_providers() {
  : # Disabled provider-router
}

# --- Onboard checklist ---
run_onboard() {
  section "Onboarding checklist"
  cat <<'EOF'
  Human / agent onboarding — complete in order:

  1. Read AGENTS.md + SOUL.md (evidence-based work — no speculation-as-fact)
  2. Run: pnpm ai init
  3. Read .cursor/rules/01-real-world-logic.mdc (OBSERVE→VERIFY loop)
  4. Read .cursor/agents/_shared/references/gold-standard-contract.md
  5. Know routing: .cursor/rules/04-subagent-auto-routing.mdc
  6. Configure AI providers: pnpm provider:route --check
  7. Before done on multi-file work: sceptic → agent-alignment-score → pnpm quality
  8. Status anytime: pnpm ai status
  9. Provider status:   pnpm provider:route
  10. Provider check:    pnpm provider:route --check
  11. Reset cooldowns:   pnpm provider:route --reset
EOF
}

# --- Summary ---
print_summary() {
  section "Summary"
  if [[ "$JSON" -eq 1 ]]; then
    printf '{"mode":"%s","errors":%d,"warnings":%d}\n' "$MODE" "$ERR" "$WARN"
  else
    echo "Mode: $MODE | Errors: $ERR | Warnings: $WARN"
    if [[ $ERR -eq 0 ]]; then
      echo "AI system: PASS"
    else
      echo "AI system: FAIL — run: pnpm ai fix"
    fi
  fi
}

case "$MODE" in
  init)
    log "AI system init"
    restore_standards
    run_sync
    run_guardrails
    run_layout
    run_dedupe
    run_drift
    run_providers
    print_summary
    ;;
  fix)
    log "AI system fix"
    restore_standards
    run_sync
    run_guardrails
    run_layout
    run_dedupe
    run_drift
    run_providers
    print_summary
    ;;
  check)
    run_guardrails
    run_layout
    run_dedupe
    run_drift
    run_providers
    print_summary
    ;;
  onboard)
    run_onboard
    run_inventory
    run_guardrails
    MODE=status
    print_summary
    ;;
  status)
    run_inventory
    run_guardrails
    run_layout
    run_dedupe
    run_drift
    run_providers
    print_summary
    ;;
  *)
    echo "Usage: pnpm ai [init|onboard|status|check|fix] [--quiet] [--json]" >&2
    exit 2
    ;;
esac

[[ $ERR -eq 0 ]]
