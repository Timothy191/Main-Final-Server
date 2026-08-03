#!/usr/bin/env bash
# Headless omp wrapper — print mode, no session, write approval (safer than yolo).
set -euo pipefail

export PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"
ROOT="${CLI_AGENT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"
TIMEOUT_SEC="${CLI_AGENT_TIMEOUT_SEC:-600}"
APPROVAL="${OMP_APPROVAL_MODE:-write}"

case "$APPROVAL" in
  write|always-ask) ;;
  yolo)
    echo "omp: OMP_APPROVAL_MODE=yolo blocked in wrapper (use write)" >&2
    exit 2
    ;;
  *)
    echo "omp: invalid OMP_APPROVAL_MODE='$APPROVAL' (allowed: write|always-ask)" >&2
    exit 2
    ;;
esac

if ! command -v timeout >/dev/null 2>&1; then
  echo "omp: GNU timeout required (fail-closed)" >&2
  exit 127
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "omp: require a git working tree" >&2
  exit 1
fi

if ! command -v omp >/dev/null 2>&1; then
  echo "omp: not on PATH" >&2
  exit 127
fi

TASK="${1:-}"
if [[ -z "$TASK" ]]; then
  echo "usage: $0 \"prompt\"" >&2
  exit 2
fi

echo "agent=omp mode=headless cwd=$ROOT timeout=${TIMEOUT_SEC}s approval=$APPROVAL" >&2

timeout "$TIMEOUT_SEC" omp -p "$TASK" --no-session --approval-mode "$APPROVAL"
