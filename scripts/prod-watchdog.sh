#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Production Watchdog & Self-Healing Daemon
#
# Monitors production Docker stack, detects failures, and auto-repairs common
# container, Redis, and Gateway connectivity issues.
#
# Usage:
#   bash scripts/prod-watchdog.sh start
#   bash scripts/prod-watchdog.sh stop
#   bash scripts/prod-watchdog.sh status
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=3000
PID_FILE="$REPO_ROOT/.prod-watchdog.pid"
LOG_FILE="$REPO_ROOT/prod-watchdog.log"
CHECK_INTERVAL=15 # Seconds between health checks

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_msg() {
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "[$timestamp] $1" | tee -a "$LOG_FILE"
}

info() { log_msg "${CYAN}→${NC} $1"; }
pass() { log_msg "${GREEN}✓${NC} $1"; }
warn() { log_msg "${YELLOW}⚠${NC} $1"; }
fail() { log_msg "${RED}✗${NC} $1"; }

self_heal() {
  warn "Watchdog: Portal is unhealthy! Inspecting container logs for auto-repair..."
  
  local logs
  logs=$(docker compose -f docker-compose.production.yml logs portal --tail=100 2>&1)
  
  if echo "$logs" | grep -qi "redis"; then
    warn "Self-healing: Redis connection failure detected. Restarting Redis container..."
    docker compose -f docker-compose.production.yml restart redis || true
    sleep 5
  elif echo "$logs" | grep -qi -E "supabase|kong|auth"; then
    warn "Self-healing: Supabase/Kong gateway connection issues detected. Restarting Kong proxy..."
    docker compose -f docker-compose.production.yml restart nginx || true
    pnpm supabase:start || true
    sleep 5
  else
    warn "Self-healing: General unhealthy state. Restarting portal container..."
    docker compose -f docker-compose.production.yml restart portal || true
    sleep 5
  fi
  
  # Wait and verify healing
  sleep 10
  if curl -s -f "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
    pass "Self-healing: Stack successfully repaired. Portal is healthy again."
  else
    fail "Self-healing: Recovery failed. Stack remains unhealthy. Please check prod-watchdog.log."
  fi
}

run_daemon() {
  info "Production watchdog started (PID $$)"
  
  while true; do
    if curl -s -f "http://localhost:${PORT}/api/health" >/dev/null 2>&1; then
      # Heartbeat log every 10 minutes to avoid bloating logs
      if [[ $(( $(date +%s) % 600 )) -lt $CHECK_INTERVAL ]]; then
        pass "Heartbeat: Portal is healthy on port ${PORT}"
      fi
    else
      self_heal
    fi
    sleep "$CHECK_INTERVAL"
  done
}

case "${1:-status}" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      warn "Watchdog is already running (PID $(cat "$PID_FILE"))"
      exit 0
    fi

    info "Starting Production Watchdog Daemon..."
    nohup bash "$0" daemon > /dev/null 2>&1 &
    echo $! > "$PID_FILE"
    pass "Production Watchdog started in background."
    ;;
    
  daemon)
    run_daemon
    ;;
    
  stop)
    if [ -f "$PID_FILE" ]; then
      local pid
      pid=$(cat "$PID_FILE")
      kill "$pid" 2>/dev/null || true
      rm -f "$PID_FILE"
      pass "Production Watchdog stopped (PID $pid)"
    else
      warn "Production Watchdog is not running"
    fi
    ;;
    
  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      pass "Production Watchdog is RUNNING (PID $(cat "$PID_FILE"))"
    else
      warn "Production Watchdog is NOT RUNNING"
    fi
    ;;
    
  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
