#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ls -la .kiro/specs/ 2>/dev/null || echo "No .kiro/specs/ directory"
