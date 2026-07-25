#!/usr/bin/env bash
# Headless Goose wrapper — goose run one-shot, GOOSE_MODE=auto, no session.
set -euo pipefail

export PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"
ROOT="${CLI_AGENT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"
TIMEOUT_SEC="${CLI_AGENT_TIMEOUT_SEC:-600}"
# Force non-interactive tool execution (default goose is smart_approve → hangs headless)
# Allowlist: auto (default), chat (research-only). Reject approve/smart_approve for headless.
_GOOSE_MODE_RAW="${GOOSE_MODE:-auto}"
case "$_GOOSE_MODE_RAW" in
  auto|chat) export GOOSE_MODE="$_GOOSE_MODE_RAW" ;;
  *)
    echo "goose: GOOSE_MODE='$_GOOSE_MODE_RAW' blocked in headless (allowed: auto|chat)" >&2
    exit 2
    ;;
esac

if ! command -v timeout >/dev/null 2>&1; then
  echo "goose: GNU timeout required (fail-closed)" >&2
  exit 127
fi

if ! command -v goose >/dev/null 2>&1; then
  echo "goose: not on PATH" >&2
  exit 127
fi

TASK="${1:-}"
if [[ -z "$TASK" ]]; then
  echo "usage: $0 \"task text\"" >&2
  exit 2
fi

echo "agent=goose mode=headless cwd=$ROOT timeout=${TIMEOUT_SEC}s GOOSE_MODE=$GOOSE_MODE" >&2

timeout "$TIMEOUT_SEC" goose run -t "$TASK" --no-session -q
