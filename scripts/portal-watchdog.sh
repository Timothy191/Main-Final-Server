#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Portal Watchdog — monitors Next.js dev server, auto-restarts on crash
#
# This script watches the portal process and restarts it if it crashes
# with cache clearing to resolve Turbopack cache-related compilation errors.
#
# Usage:
#   bash scripts/portal-watchdog.sh start   # Start with watchdog
#   bash scripts/portal-watchdog.sh stop    # Stop the portal
#   bash scripts/portal-watchdog.sh status  # Check portal status
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3000}"
PID_FILE="$REPO_ROOT/.portal.pid"
LOG_FILE="$REPO_ROOT/portal.log"
MAX_RESTARTS=3
RESTART_COUNT=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "  ${CYAN}→${NC} $1"; }
pass()  { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail()  { echo -e "  ${RED}✗${NC} $1"; }

start_portal() {
  local restart="${1:-false}"

  # Clear caches on restart
  if [ "$restart" = "true" ]; then
    warn "Portal crashed — clearing caches and restarting (attempt $((RESTART_COUNT + 1))/$MAX_RESTARTS)..."
    rm -rf "$REPO_ROOT/apps/portal/.next" "$REPO_ROOT/.turbo/cache" 2>/dev/null
  fi

  cd "$REPO_ROOT/apps/portal"
  PORT="$PORT" pnpm dev > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  cd "$REPO_ROOT"
  info "Started with PID $(cat "$PID_FILE")"
}

wait_for_portal() {
  local timeout="${1:-120}"
  for _ in $(seq 1 "$timeout"); do
    if curl -fs "http://localhost:${PORT}/login" -o /dev/null -w "%{http_code}" 2>/dev/null | grep -qE "^(200|307|308)$"; then
      return 0
    fi
    # Check if portal process died
    if [ -f "$PID_FILE" ] && ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      return 1
    fi
    sleep 2
  done
  return 1
}

case "${1:-status}" in
  start)
    # Kill any existing portal
    if [ -f "$PID_FILE" ]; then
      kill "$(cat "$PID_FILE")" 2>/dev/null || true
      rm -f "$PID_FILE"
      sleep 1
    fi

    start_portal false

    if wait_for_portal 120; then
      pass "Portal is up on :${PORT}"
      # Watchdog loop — restart on crash
      while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
        if [ -f "$PID_FILE" ] && ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
          RESTART_COUNT=$((RESTART_COUNT + 1))
          start_portal true
          if wait_for_portal 120; then
            pass "Restarted successfully on :${PORT}"
          else
            fail "Restart $RESTART_COUNT failed — portal did not come up"
            exit 1
          fi
        fi
        sleep 5
      done
      fail "Max restarts ($MAX_RESTARTS) reached — giving up"
      exit 1
    else
      fail "Portal did not start within 120 seconds"
      tail -20 "$LOG_FILE" 2>/dev/null | sed 's/^/    /'
      exit 1
    fi
    ;;
  stop)
    if [ -f "$PID_FILE" ]; then
      kill "$(cat "$PID_FILE")" 2>/dev/null || true
      rm -f "$PID_FILE"
      pass "Portal stopped"
    else
      warn "No portal PID file found"
    fi
    ;;
  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      if curl -sL -o /dev/null -w '%{http_code}' --connect-timeout 3 "http://127.0.0.1:${PORT}/login" 2>/dev/null | grep -qE '^(200|307|308)$'; then
        pass "Portal RUNNING on :${PORT} (PID $(cat "$PID_FILE"))"
      else
        warn "Portal process exists but not responding on :${PORT} (PID $(cat "$PID_FILE"))"
      fi
    else
      warn "Portal NOT RUNNING (no process)"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
