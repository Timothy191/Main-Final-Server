#!/usr/bin/env bash
# Headless Aider wrapper — one message, no TUI, no auto-commits by default.
set -euo pipefail

export PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"
ROOT="${CLI_AGENT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"
TIMEOUT_SEC="${CLI_AGENT_TIMEOUT_SEC:-600}"

if ! command -v timeout >/dev/null 2>&1; then
  echo "aider: GNU timeout required (fail-closed)" >&2
  exit 127
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "aider: require a git working tree" >&2
  exit 1
fi

if ! command -v aider >/dev/null 2>&1; then
  echo "aider: not on PATH (uv tool install --python 3.12 aider-chat)" >&2
  exit 127
fi

TASK="${1:-}"
if [[ -z "$TASK" ]]; then
  echo "usage: $0 \"message\" [file...]" >&2
  exit 2
fi
shift || true

echo "agent=aider mode=headless cwd=$ROOT timeout=${TIMEOUT_SEC}s" >&2

timeout "$TIMEOUT_SEC" aider \
  --message "$TASK" \
  --yes-always \
  --no-stream \
  --no-pretty \
  --no-check-update \
  --no-auto-commits \
  "$@"
