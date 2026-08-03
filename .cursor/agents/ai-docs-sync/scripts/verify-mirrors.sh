#!/usr/bin/env bash
# Delegates to unified AI system command (replaces scattered validators).
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
exec bash scripts/ai.sh check
