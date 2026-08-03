#!/usr/bin/env bash
# Validate Agent Skills standard compliance for skills + agents (3-pass capable).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT"

PASS="${1:-1}"
ERR=0
WARN=0

fail() { echo "  FAIL: $1"; ERR=$((ERR + 1)); }
warn() { echo "  WARN: $1"; WARN=$((WARN + 1)); }
ok()   { echo "  OK: $1"; }

echo "=== Agent Skills validate (pass $PASS) ==="

# --- Standard library ---
STANDARD_DIR=".cursor/standards/agent-skills"
if [[ ! -f "$STANDARD_DIR/STANDARD.md" ]]; then
  fail "missing $STANDARD_DIR/STANDARD.md"
else
  ok "STANDARD.md present"
fi

ref_count=$(find "$STANDARD_DIR/references" -maxdepth 1 -name '*.md' | wc -l)
if [[ "$ref_count" -lt 20 ]]; then
  fail "expected 20 reference files, found $ref_count"
else
  ok "20 reference sections present ($ref_count files)"
fi

[[ -f "$STANDARD_DIR/assets/tool-paths.json" ]] && ok "tool-paths.json" || fail "missing tool-paths.json"

# --- Skills ---
for base in .cursor/skills .qoder/skills .github/skills; do
  [[ -d "$base" ]] || continue
  for dir in "$base"/*/; do
    [[ -d "$dir" ]] || continue
    name=$(basename "$dir")
    [[ "$name" == "README.md" ]] && continue
    skill_md="${dir}SKILL.md"
    if [[ ! -f "$skill_md" ]]; then
      fail "$name: missing SKILL.md"
      continue
    fi
    head -20 "$skill_md" | grep -q '^name:' || fail "$name: missing name in frontmatter"
    head -30 "$skill_md" | grep -q '^description:' || fail "$name: missing description in frontmatter"
    if grep -qE '(^|/)scripts/' "$skill_md" && [[ ! -d "${dir}scripts" ]]; then
      warn "$name: SKILL.md references scripts/ but directory missing"
    fi
    if [[ $(wc -l < "$skill_md") -gt 80 ]]; then
      warn "$name: SKILL.md >80 lines — move detail to references/"
    fi
  done
done
ok "skill folders scanned"

# --- Agents ---
for agent in .cursor/agents/*.md; do
  [[ -f "$agent" ]] || continue
  base=$(basename "$agent")
  [[ "$base" == "README.md" ]] && continue
  grep -q 'gold-standard-contract\|Gold Standard Contract' "$agent" || fail "$base: missing Gold Standard Contract"
  grep -qi 'anti-trigger' "$agent" || fail "$base: missing anti-triggers in description"
  grep -q 'agent-skills-runtime\|Agent Skills' "$agent" || warn "$base: missing skills runtime pointer"
  grep -q 'Next owner:' "$agent" || warn "$base: no Next owner in output format"
done
ok "agents scanned"

# --- Indexes ---
for idx in .cursor/skills/README.md .qoder/skills/README.md .github/skills/README.md; do
  [[ -f "$idx" ]] && ok "$(basename $(dirname $idx))/README.md" || warn "missing $idx"
done

echo ""
echo "Pass $PASS complete: $ERR error(s), $WARN warning(s)"

# Agent layout (hybrid .md + collateral folders)
if [[ -x .cursor/standards/agent-layout/scripts/validate-agents.sh ]]; then
  echo ""
  bash .cursor/standards/agent-layout/scripts/validate-agents.sh || ERR=$((ERR + 1))
fi

# Claude Code native surfaces
if [[ -x .cursor/standards/claude-code/scripts/validate-claude-code.sh ]]; then
  echo ""
  bash .cursor/standards/claude-code/scripts/validate-claude-code.sh || ERR=$((ERR + 1))
fi

[[ $ERR -eq 0 ]]
