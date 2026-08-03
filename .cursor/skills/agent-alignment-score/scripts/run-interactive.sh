#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
exec node "$ROOT/.cursor/skills/agent-alignment-score/scripts/score.mjs" --interactive
