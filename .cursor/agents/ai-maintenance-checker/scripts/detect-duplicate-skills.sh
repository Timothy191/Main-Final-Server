#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ERR=0
declare -A canon
for base in .cursor/skills .qoder/skills .github/skills; do
  [[ -d "$base" ]] || continue
  for dir in "$base"/*/; do
    [[ -d "$dir" ]] || continue
    name=$(basename "$dir")
    [[ -f "${dir}SKILL.md" ]] || continue
    if [[ -n "${canon[$name]:-}" ]]; then
      echo "DUPLICATE: $name in ${canon[$name]} and $base"
      ERR=$((ERR + 1))
    else
      canon[$name]="$base"
    fi
  done
done
exit $ERR
