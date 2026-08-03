#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: create-spec.sh <feature-name>" >&2
  exit 1
fi

feature_name="$*"
feature_slug="$(echo "$feature_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' | sed 's/--*/-/g')"

mkdir -p ".kiro/specs/$feature_slug"

for t in requirements design tasks; do
  cp ".kiro/templates/${t}.md" ".kiro/specs/$feature_slug/${t}.md"
  sed -i "s/{feature-name}/$feature_name/g" ".kiro/specs/$feature_slug/${t}.md"
  sed -i "s/{feature-slug}/$feature_slug/g" ".kiro/specs/$feature_slug/${t}.md"
done

echo "Spec created at .kiro/specs/$feature_slug/"
echo "Next: fill requirements.md → get approval → design.md → tasks.md"
