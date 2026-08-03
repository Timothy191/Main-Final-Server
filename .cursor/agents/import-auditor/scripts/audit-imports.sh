#!/usr/bin/env bash
# Import & path connectivity audit for Arch Systems monorepo.
# Usage: audit-imports.sh [--full|--scope portal|packages|all]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../../" && pwd)"
cd "$ROOT"

export PATH="/home/timothy/.npm-global/bin:${PATH:-}"

SCOPE="diff"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --full) SCOPE="full"; shift ;;
    --scope) SCOPE="${2:-all}"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

echo "== import-auditor: scope=$SCOPE =="

FAIL=0

section() { echo ""; echo "--- $1 ---"; }

section "Type-check (primary import resolver)"
if [[ "$SCOPE" == "portal" ]]; then
  pnpm --filter portal type-check || FAIL=1
elif [[ "$SCOPE" == "full" || "$SCOPE" == "all" ]]; then
  pnpm type-check || FAIL=1
else
  pnpm type-check || FAIL=1
fi

section "Forbidden: packages importing apps"
if rg -l "from ['\"].*apps/" packages/ 2>/dev/null | head -20; then
  echo "FAIL: packages must not import from apps/" >&2
  FAIL=1
else
  echo "OK"
fi

section "Forbidden: portal importing apps(legacy)"
if rg -l "apps\\(legacy\\)" apps/portal/src 2>/dev/null | head -20; then
  echo "FAIL: portal must not reference apps(legacy)" >&2
  FAIL=1
else
  echo "OK"
fi

section "Risk: .js extensions in portal TS imports"
if rg "from ['\"][^'\"]+\\.js['\"]" apps/portal/src -g '*.ts' -g '*.tsx' 2>/dev/null | head -30; then
  echo "WARN: .js extensions may break Turbopack — review above" >&2
else
  echo "OK"
fi

section "Risk: server-only imports in client components"
# shellcheck disable=SC2016
while IFS= read -r f; do
  if rg -q '@repo/supabase/server|@repo/redis|["'\'']server-only["'\'']' "$f" 2>/dev/null; then
    echo "FAIL: server-only import in client: $f" >&2
    FAIL=1
  fi
done < <(rg -l '^["'\'']use client["'\'']' apps/portal/src -g '*.tsx' 2>/dev/null || true)

if [[ "$FAIL" -eq 0 ]]; then
  echo "OK: no server-only leaks in sampled client files"
fi

section "Stale @repo imports (existence spot-check)"
# Quick scan: @repo/foo/bar imports where package.json has no matching export
rg -o "@repo/[a-zA-Z0-9_-]+(/[a-zA-Z0-9_./-]+)?" apps/portal/src packages -g '*.ts' -g '*.tsx' 2>/dev/null \
  | sort -u | head -40 || true

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "== import-auditor: PASS =="
  exit 0
else
  echo "== import-auditor: FAIL =="
  exit 1
fi
