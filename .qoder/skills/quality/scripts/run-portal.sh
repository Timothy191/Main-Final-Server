#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
pnpm --filter portal lint
pnpm --filter portal type-check
pnpm --filter portal test
