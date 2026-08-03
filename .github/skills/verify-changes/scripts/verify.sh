#!/usr/bin/env bash
# Alias → .qoder/skills/quality full monorepo gate
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
exec "$ROOT/.qoder/skills/quality/scripts/run-full.sh"
