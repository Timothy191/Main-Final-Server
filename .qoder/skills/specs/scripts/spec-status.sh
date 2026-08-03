#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: spec-status.sh <feature-slug>" >&2
  exit 1
fi

slug="$1"
dir=".kiro/specs/$slug"

if [[ ! -d "$dir" ]]; then
  echo "Spec not found: $dir" >&2
  exit 1
fi

echo "=== $slug ==="
for f in requirements.md design.md tasks.md; do
  if [[ -f "$dir/$f" ]]; then
    echo "--- $f ---"
    grep -E '^- \[[ x]\]' "$dir/$f" 2>/dev/null || echo "(no task checkboxes)"
  else
    echo "MISSING: $f"
  fi
done
