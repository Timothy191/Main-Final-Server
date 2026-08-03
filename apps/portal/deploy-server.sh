#!/usr/bin/env bash
set -euo pipefail

# Resolve the directory containing this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# This app is a workspace package inside the arch-systems monorepo. It depends
# on @repo/* packages and a shared pnpm-lock.yaml, so it cannot be built in
# isolation. This script verifies the workspace placement before deploying.
find_workspace_root() {
  local dir="$SCRIPT_DIR"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/package.json" && -d "$dir/apps" && -d "$dir/packages" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

WORKSPACE_ROOT=""
if ! WORKSPACE_ROOT="$(find_workspace_root)"; then
  WORKSPACE_ROOT=""
fi

EXPECTED_APP_DIR=""
if [[ -n "$WORKSPACE_ROOT" ]]; then
  EXPECTED_APP_DIR="$WORKSPACE_ROOT/apps/portal"
fi

if [[ -z "$WORKSPACE_ROOT" || "$SCRIPT_DIR" != "$EXPECTED_APP_DIR" ]]; then
  {
    echo "Error: this app must be part of the arch-systems pnpm workspace to deploy."
    echo "Current location: $SCRIPT_DIR"
    if [[ -n "$WORKSPACE_ROOT" ]]; then
      echo "Expected location: $EXPECTED_APP_DIR"
    fi
    echo ""
    echo "The canonical workspace was detected at:"
    echo "  /home/arch/Applications/Arch-Mk2"
    echo ""
    echo "Place this directory at apps/portal inside that workspace, then rerun:"
    echo "  ./deploy-server.sh"
  } >&2
  exit 1
fi

cd "$WORKSPACE_ROOT"

for cmd in pnpm curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: $cmd is not installed" >&2
    exit 1
  fi
done

echo "Installing dependencies in workspace root ($WORKSPACE_ROOT)..."
pnpm install --frozen-lockfile

echo "Building portal..."
pnpm --filter portal build

echo "Starting portal..."
PORT="${PORT:-3000}"
pnpm --filter portal start &
SERVER_PID=$!

echo "Waiting for server on port $PORT..."
while ! curl -s "http://localhost:$PORT" >/dev/null; do
  sleep 2
done
echo "Server is up (PID $SERVER_PID)."

if command -v xdg-open >/dev/null 2>&1; then
  echo "Opening login page..."
  xdg-open "http://localhost:$PORT/login" &
fi

cat << 'EOF'

=== Deployment Checklist ===
1. Verify server is running (process ID shown above)
2. Confirm environment variables are correct (.env file)
3. Ensure the NestJS backend is reachable at API_URL
4. Run `pnpm test` to verify nothing is broken
5. Review logs for warnings or errors
6. If everything looks good, mark deployment as complete.

EOF
