#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$SCRIPT_DIR"
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
