#!/usr/bin/env bash
# Headless OpenSpec wrapper — non-interactive only.
set -euo pipefail

export PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"
ROOT="${CLI_AGENT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"
TIMEOUT_SEC="${CLI_AGENT_TIMEOUT_SEC:-600}"

if ! command -v timeout >/dev/null 2>&1; then
  echo "openspec: GNU timeout required (fail-closed)" >&2
  exit 127
fi

if ! command -v openspec >/dev/null 2>&1; then
  echo "openspec: not on PATH" >&2
  exit 127
fi

SUBCMD="${1:-validate}"
shift || true

run() {
  timeout "$TIMEOUT_SEC" "$@"
}

echo "agent=openspec mode=headless cwd=$ROOT timeout=${TIMEOUT_SEC}s subcmd=$SUBCMD" >&2

case "$SUBCMD" in
  validate)
    run openspec validate --all --no-interactive --json "$@"
    ;;
  doctor)
    run openspec doctor "$@"
    ;;
  list)
    run openspec list "$@"
    ;;
  status)
    run openspec status "$@"
    ;;
  instructions)
    run openspec instructions --json "$@"
    ;;
  show)
    run openspec show "$@"
    ;;
  archive)
    # Non-interactive archive; pass change name as remaining args
    run openspec archive -y --json "$@"
    ;;
  *)
    echo "usage: $0 {validate|doctor|list|status|instructions|show|archive} [args...]" >&2
    exit 2
    ;;
esac
