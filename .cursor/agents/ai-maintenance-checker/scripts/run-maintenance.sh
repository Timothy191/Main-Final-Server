#!/usr/bin/env bash
# Background maintenance — read-only check by default; --fix for explicit repair.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
FIX=0
for arg in "$@"; do
  case "$arg" in
    --fix) FIX=1 ;;
  esac
done
if [[ "$FIX" -eq 1 ]]; then
  exec bash "$ROOT/scripts/ai.sh" fix --quiet
else
  exec bash "$ROOT/scripts/ai.sh" check --quiet
fi
