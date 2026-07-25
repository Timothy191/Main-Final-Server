#!/usr/bin/env bash
# Validate hybrid agent layout: flat entry .md + sibling collateral folder
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT"

ERR=0
warn() { echo "  WARN: $1"; }
fail() { echo "  FAIL: $1"; ERR=$((ERR + 1)); }
ok()   { echo "  OK: $1"; }

echo "=== Agent layout validate ==="

[[ -f .cursor/standards/agent-layout/STANDARD.md ]] && ok "agent-layout STANDARD.md" || fail "missing agent-layout STANDARD"
[[ -f .cursor/agents/README.md ]] && ok "agents README" || fail "missing agents README"
[[ -f .cursor/agents/_shared/references/gold-standard-contract.md ]] && ok "_shared gold contract" || fail "missing _shared contract"

# Active agents synced from .cursor/rules/04-subagent-auto-routing.mdc
AGENTS=(
  orchestrator
  agents-memory-updater
  backend-architect
  db-optimizer
  frontend-design
  frontend-implementer
  import-auditor
  nextjs-fullstack
  reverse-engineer
  root-cause-healer
  sceptic
  test-engineer
  vercel-brand-sync
)

for a in "${AGENTS[@]}"; do
  entry=".cursor/agents/${a}.md"
  dir=".cursor/agents/${a}"
  [[ -f "$entry" ]] || { fail "$a: missing entry $entry"; continue; }
  head -30 "$entry" | grep -q '^name:' || fail "$a: missing name frontmatter"
  head -40 "$entry" | grep -qi 'anti-trigger' || fail "$a: missing anti-triggers"
  grep -q 'Gold Standard Contract\|gold-standard-contract' "$entry" || fail "$a: missing gold contract link"
  grep -q 'Agent Skills\|agent-skills-runtime\|skills-runtime' "$entry" || warn "$a: no skills runtime pointer"
  [[ -d "$dir/references" ]] || fail "$a: missing $dir/references/"
  [[ -d "$dir/assets" ]] || warn "$a: missing $dir/assets/"
  lines=$(wc -l < "$entry")
  if [[ "$lines" -gt 65 ]]; then
    warn "$a: entry $lines lines (>65) — move detail to $dir/references/"
  else
    ok "$a: entry $lines lines"
  fi
done

# hooks surface
[[ -f .cursor/hooks.json ]] && ok "hooks.json" || fail "missing hooks.json"
[[ -f .cursor/hooks/alignment-gate.mjs ]] && ok "alignment-gate hook" || warn "missing alignment-gate.mjs"
[[ -f .cursor/hooks/block-forbidden.mjs ]] && ok "block-forbidden hook" || warn "missing block-forbidden.mjs"

# kiro mirror
[[ -f .kiro/agents/default.json ]] && ok "kiro default.json" || fail "missing kiro agents config"

echo ""
echo "Agent layout: $ERR error(s)"
[[ $ERR -eq 0 ]]
