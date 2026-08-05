#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch-Systems — Production Supervisor Wrapper
# Delegates to the monorepo supervisor in `start` mode.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"
mkdir -p logs

exec node scripts/monorepo-supervisor.mjs start "$@"
