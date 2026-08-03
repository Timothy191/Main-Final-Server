#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch-Systems — Dev Script
# Boot order: Redis → Supabase → host Next.js portal, then stack smoke,
# monitoring terminals, and browser open to /login.
#
# Usage:
#   bash scripts/dev.sh                 # Full stack (Redis + Supabase + portal)
#   bash scripts/dev.sh --quick         # Portal + DB (skip Redis, start Supabase)
#   bash scripts/dev.sh --no-infra      # Assume Redis + Supabase already up
#   bash scripts/dev.sh --quality       # Also run pnpm quality after smoke
#   bash scripts/dev.sh --no-browser    # Skip open-login.sh
#   bash scripts/dev.sh --no-monitors   # Skip monitoring terminals
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

export PATH="${HOME}/.npm-global/bin:${PATH}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3000}"
SUPABASE_WORKDIR="$REPO_ROOT/packages/supabase"
PORTAL_ENV="$REPO_ROOT/apps/portal/.env.local"

# ── Colours ───────────────────────────────────────────────────────────────────
DIM='\033[0;2m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

PASS="${GREEN}${BOLD}  ✓${NC}"
FAIL="${RED}${BOLD}  ✗${NC}"
WARN="${YELLOW}${BOLD}  ⚠${NC}"
SKIP="${YELLOW}${BOLD}  –${NC}"
INFO="${CYAN}${BOLD}  →${NC}"

# ── Helpers ───────────────────────────────────────────────────────────────────
phase() { echo; echo -e "  ${BOLD}${MAGENTA}━━━  Phase $1: $2  ━━━${NC}"; }

check() {
  local label="$1" status="$2" detail="${3:-}"
  case "$status" in
    pass) echo -e "  ${PASS} ${label}${detail:+  ${DIM}${detail}${NC}}" ;;
    fail) echo -e "  ${FAIL} ${label}${detail:+  ${RED}${detail}${NC}}" ;;
    warn) echo -e "  ${WARN} ${label}${detail:+  ${YELLOW}${detail}${NC}}" ;;
    skip) echo -e "  ${SKIP} ${label}${detail:+  ${DIM}${detail}${NC}}" ;;
  esac
}

spinner() {
  local pid=$1 msg="$2"
  local frames=('◐' '◓' '◑' '◒')
  local i=0
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r  ${CYAN}${frames[$i]}${NC} %s... " "$msg"
    i=$(( (i+1) % 4 ))
    sleep 0.2
  done
  printf "\r  ${GREEN}◉${NC} %-40s\n" "$msg"
}

wait_for_port() {
  local port="$1" max="${2:-30}"
  for _ in $(seq 1 "$max"); do
    ss -tlnH 2>/dev/null | grep -qE ":${port} " && return 0
    sleep 1
  done
  return 1
}

auto_free_port() {
  local port="$1"
  local label="$2"
  if ss -tlnH 2>/dev/null | grep -qE ":${port} "; then
    local pid; pid=$(lsof -ti :"$port" 2>/dev/null | head -n1 || true)
    if [ -n "$pid" ]; then
      kill -9 "$pid" 2>/dev/null || true
      sleep 1
      check "$label" "pass" "auto-freed (killed PID $pid holding :$port)"
    else
      fuser -k -9 "${port}/tcp" >/dev/null 2>&1 || true
      sleep 1
      check "$label" "pass" "auto-freed via fuser on :$port"
    fi
  else
    check "$label" "pass" "free (port :$port)"
  fi
}

wait_for_auth_health() {
  local max="${1:-60}"
  for _ in $(seq 1 "$max"); do
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 \
      "http://127.0.0.1:54321/auth/v1/health" 2>/dev/null || echo 000)
    [[ "$code" == "200" ]] && return 0
    sleep 2
  done
  return 1
}

detect_compose() {
  if docker compose version >/dev/null 2>&1; then echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"
  else echo "docker compose"
  fi
}

source_portal_env() {
  if [ -f "$PORTAL_ENV" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$PORTAL_ENV"
    set +a
  fi
}

# Sync anon/service keys from `supabase status` only when placeholders/missing.
maybe_sync_supabase_keys() {
  local status_out anon service
  status_out=$(cd "$REPO_ROOT/packages" && pnpm dlx supabase@^2.26.0 status -o env 2>/dev/null || true)
  [ -z "$status_out" ] && return 0

  anon=$(echo "$status_out" | sed -n 's/^ANON_KEY=//p' | tr -d '"' | head -1)
  service=$(echo "$status_out" | sed -n 's/^SERVICE_ROLE_KEY=//p' | tr -d '"' | head -1)
  [ -z "$anon" ] || [ -z "$service" ] && return 0
  [ ! -f "$PORTAL_ENV" ] && return 0

  local current_anon current_service
  current_anon=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$PORTAL_ENV" | head -1 | cut -d= -f2- || true)
  current_service=$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' "$PORTAL_ENV" | head -1 | cut -d= -f2- || true)

  local needs_sync=false
  if [ -z "$current_anon" ] || [[ "$current_anon" == *"your-local"* ]] || [[ "$current_anon" == *"changeme"* ]]; then
    needs_sync=true
  fi
  if [ -z "$current_service" ] || [[ "$current_service" == *"your-local"* ]] || [[ "$current_service" == *"changeme"* ]]; then
    needs_sync=true
  fi
  [ "$needs_sync" = "false" ] && return 0

  local tmp
  tmp=$(mktemp)
  awk -v anon="$anon" -v service="$service" '
    BEGIN { a=0; s=0; sa=0; ss=0 }
    /^NEXT_PUBLIC_SUPABASE_ANON_KEY=/ { print "NEXT_PUBLIC_SUPABASE_ANON_KEY=" anon; a=1; next }
    /^SUPABASE_SERVICE_ROLE_KEY=/ { print "SUPABASE_SERVICE_ROLE_KEY=" service; s=1; next }
    /^SUPABASE_ANON_KEY=/ { print "SUPABASE_ANON_KEY=" anon; sa=1; next }
    /^SUPABASE_SERVICE_KEY=/ { print "SUPABASE_SERVICE_KEY=" service; ss=1; next }
    { print }
    END {
      if (!a) print "NEXT_PUBLIC_SUPABASE_ANON_KEY=" anon
      if (!s) print "SUPABASE_SERVICE_ROLE_KEY=" service
      if (!sa) print "SUPABASE_ANON_KEY=" anon
      if (!ss) print "SUPABASE_SERVICE_KEY=" service
    }
  ' "$PORTAL_ENV" > "$tmp"
  mv "$tmp" "$PORTAL_ENV"
  check "Supabase keys" "pass" "synced placeholders from supabase status"
}

stop_arch_portal_container() {
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'arch-portal'; then
    docker stop arch-portal >/dev/null 2>&1 || true
    check "arch-portal container" "pass" "stopped (host Next owns :${PORT})"
  fi
}

open_browser() {
  bash "$REPO_ROOT/scripts/open-login.sh" "$PORT" || true
}

open_monitors() {
  bash "$REPO_ROOT/scripts/open-monitoring-terminals.sh" || true
}


cleanup() {
  echo
  if [ "${STARTED_PORTAL:-false}" = "true" ]; then
    echo -e "  ${YELLOW}Shutting down portal...${NC}"
    if [ -f "$REPO_ROOT/.portal.pid" ]; then
      kill "$(cat "$REPO_ROOT/.portal.pid")" 2>/dev/null || true
      rm -f "$REPO_ROOT/.portal.pid" "$REPO_ROOT/.portal.start"
    fi
  fi
  if [ "${STARTED_GATEWAY:-false}" = "true" ]; then
    echo -e "  ${YELLOW}Shutting down Ops Gateway...${NC}"
    if [ -f "$REPO_ROOT/.gateway.pid" ]; then
      kill "$(cat "$REPO_ROOT/.gateway.pid")" 2>/dev/null || true
      rm -f "$REPO_ROOT/.gateway.pid"
    fi
  fi
}
trap cleanup EXIT INT TERM

banner() {
  clear 2>/dev/null || true
  echo
  echo -e "  ${BOLD}${CYAN}  ╔═══════════════════════════════════════╗${NC}"
  echo -e "  ${BOLD}${CYAN}  ║   Arch Systems — Dev Server           ║${NC}"
  echo -e "  ${BOLD}${CYAN}  ╚═══════════════════════════════════════╝${NC}"
  echo
  echo -e "  ${DIM}$(date '+%a %b %d %Y  %H:%M')${NC}"
  echo -e "  ${DIM}Boot: Redis → Supabase → Ops Gateway → portal${NC}"
  echo -e "  ${DIM}Flags: ${QUICK_MODE:+--quick }${NO_INFRA:+--no-infra }${RUN_QUALITY:+--quality }${NC}"
  echo
}

show_results() {
  echo
  echo -e "  ${GREEN}${BOLD}┌─────────────────────────────────────────────┐${NC}"
  echo -e "  ${GREEN}${BOLD}│  All systems go — edit any file for HMR     │${NC}"
  echo -e "  ${GREEN}${BOLD}└─────────────────────────────────────────────┘${NC}"
  echo
  echo -e "  ${BOLD}Login:${NC}      ${CYAN}http://localhost:${PORT}/login${NC}"
  echo -e "  ${BOLD}Health:${NC}     ${CYAN}http://localhost:${PORT}/api/health${NC}"
  if [ "$QUICK_MODE" = "false" ] || [ "$NO_INFRA" = "false" ]; then
    echo -e "  ${BOLD}Supabase:${NC}   ${CYAN}http://127.0.0.1:54321${NC}"
    echo -e "  ${BOLD}Studio:${NC}     ${CYAN}http://127.0.0.1:54323${NC}"
  fi
  if [ "$QUICK_MODE" = "false" ]; then
    echo -e "  ${BOLD}Redis:${NC}      ${CYAN}localhost:6379${NC}"
  fi
  echo
  echo -e "  ${DIM}Stop portal: Ctrl+C · Full infra: pnpm shutdown -- --infra${NC}"
  echo
}

# ── Arg parsing ───────────────────────────────────────────────────────────────
QUICK_MODE=false
NO_INFRA=false
RUN_QUALITY=false
OPEN_BROWSER=true
OPEN_MONITORS=true
STARTED_PORTAL=false
STARTED_GATEWAY=false
while [ $# -gt 0 ]; do
  case "$1" in
    --quick|-q)     QUICK_MODE=true; shift ;;
    --no-infra)     NO_INFRA=true;   shift ;;
    --quality)      RUN_QUALITY=true; shift ;;
    --no-browser)   OPEN_BROWSER=false; shift ;;
    --no-monitors)  OPEN_MONITORS=false; shift ;;
    *)              shift ;;
  esac
done

COMPOSE_CMD=$(detect_compose)

# ══════════════════════════════════════════════════════════════════════════════
banner

# ── Phase 0: Pre-flight ───────────────────────────────────────────────────────
phase 0 "Pre-flight"

if [ -f "$REPO_ROOT/.portal.pid" ]; then
  if ! kill -0 "$(cat "$REPO_ROOT/.portal.pid")" 2>/dev/null; then
    rm -f "$REPO_ROOT/.portal.pid" "$REPO_ROOT/.portal.start"
    check "Stale portal PID" "pass" "cleaned"
  else
    check "Portal process" "pass" "PID $(cat "$REPO_ROOT/.portal.pid") already running"
  fi
fi

if [ -f "$REPO_ROOT/.gateway.pid" ]; then
  if ! kill -0 "$(cat "$REPO_ROOT/.gateway.pid")" 2>/dev/null; then
    rm -f "$REPO_ROOT/.gateway.pid"
    check "Stale gateway PID" "pass" "cleaned"
  else
    check "Gateway process" "pass" "PID $(cat "$REPO_ROOT/.gateway.pid") already running"
  fi
fi

# Free target ports if occupied
stop_arch_portal_container
auto_free_port "$PORT" "Port (Portal)"
auto_free_port "3100" "Port (Gateway)"
auto_free_port "3001" "Port (Monitor)"

if [ -f "$REPO_ROOT/portal.log" ]; then
  : > "$REPO_ROOT/portal.log"
  check "Portal log" "pass" "rotated"
fi

# Product layer is standalone — do not probe scripts/ai.sh or .cursor/ here.
# Agentic health: pnpm ai (optional; never required for portal boot).

# ── Phase 1: Environment ──────────────────────────────────────────────────────
phase 1 "Environment"

env_ok=true
node -v >/dev/null 2>&1 && check "Node.js" "pass" "$(node -v)" || { check "Node.js" "fail" "not found — install Node 22+"; env_ok=false; }
pnpm -v >/dev/null 2>&1 && check "pnpm"    "pass" "v$(pnpm -v)"  || { check "pnpm"    "fail" "not found — run: corepack enable"; env_ok=false; }

if [ "$QUICK_MODE" = "true" ]; then
  docker info >/dev/null 2>&1 && check "Docker" "pass" \
    || check "Docker" "warn" "not running — Supabase may not start"
else
  docker info >/dev/null 2>&1 && check "Docker" "pass" || { check "Docker" "warn" "not running — infrastructure will be skipped"; NO_INFRA=true; }
fi

if [ ! -f "$PORTAL_ENV" ] && [ ! -f "$REPO_ROOT/apps/portal/.env" ]; then
  if [ -f "$REPO_ROOT/apps/portal/.env.example" ]; then
    cp "$REPO_ROOT/apps/portal/.env.example" "$PORTAL_ENV"
    check "Portal .env.local" "pass" "created from .env.example"
    check "Secrets" "warn" "fill in SUPABASE keys in apps/portal/.env.local"
  else
    check "Portal .env.local" "fail" "missing — create apps/portal/.env.local"
    env_ok=false
  fi
else
  check "Portal .env.local" "pass" "exists"
fi

source_portal_env

if [ -f "$PORTAL_ENV" ]; then
  if bash "$REPO_ROOT/scripts/validate-env.sh" --local >/tmp/arch-validate-env.out 2>&1; then
    check "Env validate" "pass" "--local"
  else
    check "Env validate" "warn" "see /tmp/arch-validate-env.out"
  fi
fi

if [ ! -d "$REPO_ROOT/node_modules" ]; then
  echo -e "  ${INFO} Installing dependencies (first run)..."
  (cd "$REPO_ROOT" && pnpm install --frozen-lockfile 2>&1 | tail -5 | sed 's/^/    /')
  check "Dependencies" "pass" "installed"
else
  check "Dependencies" "pass" "node_modules present"
fi

[ "$env_ok" = "false" ] && { echo -e "\n  ${RED}Environment checks failed. Fix the above and re-run.${NC}\n"; exit 1; }

# ── Phase 2: Redis ────────────────────────────────────────────────────────────
phase 2 "Redis"

if [ "$QUICK_MODE" = "true" ] || [ "$NO_INFRA" = "true" ]; then
  check "Redis compose" "skip" "$([ "$QUICK_MODE" = 'true' ] && echo 'quick mode' || echo '--no-infra')"
  if wait_for_port 6379 3; then
    check "Redis" "pass" "already listening on :6379"
  else
    # Auto-handling: if port is closed, but container is stopped, try starting it
    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "arch-redis"; then
      check "Redis" "warn" "stopped container found, starting it..."
      docker start arch-redis >/dev/null 2>&1 || true
      if wait_for_port 6379 10; then
        check "Redis" "pass" "started stopped container"
      else
        check "Redis" "fail" "failed to start stopped container"
      fi
    else
      check "Redis" "warn" "not on :6379 — portal cache may degrade"
    fi
  fi
else
  echo -e "  ${INFO} Starting Redis (compose profile infra)..."
  # Auto-handling: remove existing stopped container if present to avoid conflicts
  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "arch-redis"; then
    if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "arch-redis"; then
      check "Redis container" "warn" "removing stopped arch-redis container"
      docker rm -f arch-redis >/dev/null 2>&1 || true
    fi
  fi

  $COMPOSE_CMD -f "$REPO_ROOT/docker-compose.yml" --profile infra up -d redis >/dev/null 2>&1 &
  spinner $! "Booting Redis"

  if wait_for_port 6379 30; then
    if docker exec arch-redis redis-cli ping 2>/dev/null | grep -q PONG; then
      check "Redis" "pass" "localhost:6379 PONG"
    else
      # Auto-handling: try restarting once if ping fails
      check "Redis" "warn" "port up but PING failed, restarting..."
      docker restart arch-redis >/dev/null 2>&1 || true
      sleep 2
      if docker exec arch-redis redis-cli ping 2>/dev/null | grep -q PONG; then
        check "Redis" "pass" "localhost:6379 PONG after restart"
      else
        check "Redis" "fail" "PING failed after restart"
        exit 1
      fi
    fi
  else
    check "Redis" "fail" "not responding on 6379"
    exit 1
  fi
fi

# ── Phase 3: Supabase ─────────────────────────────────────────────────────────
phase 3 "Supabase"

if [ "$NO_INFRA" = "true" ]; then
  check "Supabase start" "skip" "--no-infra — assume already running"
  if wait_for_auth_health 5; then
    check "Supabase auth" "pass" "http://127.0.0.1:54321"
  else
    check "Supabase auth" "warn" "not healthy on :54321 — login may fail"
  fi
else
  if wait_for_auth_health 2; then
    check "Supabase" "pass" "already healthy on :54321"
  else
    echo -e "  ${INFO} Starting Supabase (packages/supabase)..."
    (cd "$REPO_ROOT" && pnpm supabase:start) >/tmp/arch-supabase-start.log 2>&1 &
    spinner $! "Booting Supabase"
    if ! wait_for_auth_health 90; then
      check "Supabase auth" "fail" "auth health not 200 — see /tmp/arch-supabase-start.log"
      tail -30 /tmp/arch-supabase-start.log 2>/dev/null | sed 's/^/    /'
      exit 1
    fi
    check "Supabase auth" "pass" "http://127.0.0.1:54321"
  fi
  maybe_sync_supabase_keys
  source_portal_env
fi

# ── Phase 4: Backend (Ops Gateway) ────────────────────────────────────────────
phase 4 "Backend (Ops Gateway)"

if [ -f "$REPO_ROOT/.gateway.pid" ] && kill -0 "$(cat "$REPO_ROOT/.gateway.pid")" 2>/dev/null; then
  check "Ops Gateway" "pass" "already running on :3100"
  STARTED_GATEWAY=false
else
  MAX_GATEWAY_RESTARTS=2
  GATEWAY_RESTART_COUNT=0
  gateway_started=false

  while [ $GATEWAY_RESTART_COUNT -le $MAX_GATEWAY_RESTARTS ] && [ "$gateway_started" = "false" ]; do
    if [ "$GATEWAY_RESTART_COUNT" -gt 0 ]; then
      check "Gateway Watchdog" "warn" "restart $GATEWAY_RESTART_COUNT of $MAX_GATEWAY_RESTARTS"
      # Clear caches and retry
      rm -rf "$REPO_ROOT/apps/ops-gateway/dist" "$REPO_ROOT/apps/ops-gateway/.turbo" 2>/dev/null
      sleep 2
    fi

    cd "$REPO_ROOT/apps/ops-gateway"
    pnpm dev > "$REPO_ROOT/gateway.log" 2>&1 &
    echo $! > "$REPO_ROOT/.gateway.pid"
    STARTED_GATEWAY=true
    cd "$REPO_ROOT"
    echo -e "  ${INFO} Starting Ops Gateway on :3100 (attempt $((GATEWAY_RESTART_COUNT + 1)))..."

    # Wait and check
    if wait_for_port 3100 15; then
      gateway_started=true
      break
    fi

    # Check if PID died early
    if [ -f "$REPO_ROOT/.gateway.pid" ] && ! kill -0 "$(cat "$REPO_ROOT/.gateway.pid")" 2>/dev/null; then
      check "Ops Gateway" "warn" "process died early"
    fi

    GATEWAY_RESTART_COUNT=$((GATEWAY_RESTART_COUNT + 1))
  done

  if [ "$gateway_started" = "true" ]; then
    check "Ops Gateway" "pass" "http://localhost:3100"
  else
    check "Ops Gateway" "fail" "did not come up after $MAX_GATEWAY_RESTARTS restarts"
    echo -e "\n  ${RED}Last 20 lines of gateway.log:${NC}"
    tail -20 "$REPO_ROOT/gateway.log" 2>/dev/null | sed 's/^/    /'
    exit 1
  fi
fi

# ── Phase 5: Portal (host Next.js) ────────────────────────────────────────────
phase 5 "Portal"

if [ -f "$REPO_ROOT/.portal.pid" ] && kill -0 "$(cat "$REPO_ROOT/.portal.pid")" 2>/dev/null; then
  check "Dev server" "pass" "already running on :${PORT}"
  STARTED_PORTAL=false
else
  stop_arch_portal_container
  cd "$REPO_ROOT/apps/portal"
  FORCE_COLOR=1 PORT="$PORT" pnpm dev > "$REPO_ROOT/portal.log" 2>&1 &
  echo $! > "$REPO_ROOT/.portal.pid"
  STARTED_PORTAL=true
  cd "$REPO_ROOT"
  echo -e "  ${INFO} Starting Next.js on :${PORT} (Turbopack)..."

  MAX_RESTARTS=2
  RESTART_COUNT=0
  compiled=false

  while [ $RESTART_COUNT -le $MAX_RESTARTS ] && [ "$compiled" = "false" ]; do
    if [ "$RESTART_COUNT" -gt 0 ]; then
      check "Watchdog" "warn" "restart $RESTART_COUNT of $MAX_RESTARTS"
      # Portal died — clear caches and retry
      rm -rf "$REPO_ROOT/apps/portal/.next" "$REPO_ROOT/.turbo/cache" 2>/dev/null
      sleep 2
      stop_arch_portal_container
      cd "$REPO_ROOT/apps/portal"
      FORCE_COLOR=1 PORT="$PORT" pnpm dev > "$REPO_ROOT/portal.log" 2>&1 &
      echo $! > "$REPO_ROOT/.portal.pid"
      cd "$REPO_ROOT"
      echo -e "  ${INFO} Restarting Next.js on :${PORT} (attempt $((RESTART_COUNT + 1)))..."
    fi

    for _ in $(seq 1 120); do
      if curl -fs "http://localhost:${PORT}/login" -o /dev/null -w "%{http_code}" 2>/dev/null | grep -qE "^(200|307|308)$"; then
        compiled=true; break
      fi
      if [ -f "$REPO_ROOT/.portal.pid" ] && ! kill -0 "$(cat "$REPO_ROOT/.portal.pid")" 2>/dev/null; then
        break
      fi
      if grep -qiE "⨯.*(/login|app/\(auth\)/login).*Failed to compile|Error: Cannot find module" "$REPO_ROOT/portal.log" 2>/dev/null; then
        break
      fi
      sleep 2
    done

    RESTART_COUNT=$((RESTART_COUNT + 1))
  done

  if [ "$compiled" = "true" ]; then
    date +%s > "$REPO_ROOT/.portal.start"
    check "Dev server" "pass" "http://localhost:${PORT}"
    if [ "$RESTART_COUNT" -gt 1 ]; then
      check "Watchdog" "pass" "restarted $((RESTART_COUNT - 1)) time(s), portal stable"
    fi
  else
    check "Dev server" "fail" "did not come up after $MAX_RESTARTS restarts"
    echo -e "\n  ${RED}Last 25 lines of portal.log:${NC}"
    tail -25 "$REPO_ROOT/portal.log" 2>/dev/null | sed 's/^/    /'
    exit 1
  fi
fi

# ── Phase 6: Stack smoke ──────────────────────────────────────────────────────
phase 6 "Stack Smoke"

smoke_ok=true

# Redis PING (skip in quick mode; warn-only for --no-infra)
if [ "$QUICK_MODE" = "false" ] && [ "$NO_INFRA" = "false" ]; then
  if docker exec arch-redis redis-cli ping 2>/dev/null | grep -q PONG; then
    check "Redis PING" "pass"
  elif wait_for_port 6379 1; then
    check "Redis PING" "warn" "port up but docker exec failed"
  else
    check "Redis PING" "fail" "required for stack boot"
    smoke_ok=false
  fi
elif [ "$NO_INFRA" = "true" ]; then
  if wait_for_port 6379 1; then
    check "Redis" "pass" "already listening on :6379"
  else
    check "Redis" "warn" "not on :6379 — may affect cache-dependent features"
  fi
fi

# Supabase auth health (critical — --quick starts Supabase)
if curl -fs "http://127.0.0.1:54321/auth/v1/health" >/dev/null 2>&1; then
  check "Supabase auth health" "pass"
elif [ "$NO_INFRA" = "true" ]; then
  check "Supabase auth health" "warn" "not healthy — may affect login"
else
  check "Supabase auth health" "fail" "required for login"
  smoke_ok=false
fi

# /api/health — full stack requires DB healthy; --quick/--no-infra warn only
health_json=$(curl -fs "http://localhost:${PORT}/api/health" 2>/dev/null || echo "")
if [ -n "$health_json" ]; then
  db_status=$(echo "$health_json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("checks",{}).get("database",{}).get("status",""))' 2>/dev/null || echo "")
  redis_status=$(echo "$health_json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("checks",{}).get("redis",{}).get("status",""))' 2>/dev/null || echo "")
  if [ "$db_status" = "healthy" ]; then
    check "/api/health database" "pass"
  elif [ "$QUICK_MODE" = "true" ] || [ "$NO_INFRA" = "true" ]; then
    check "/api/health database" "warn" "${db_status:-unreachable} (ok for --quick/--no-infra)"
  else
    check "/api/health database" "fail" "${db_status:-unreachable}"
    smoke_ok=false
  fi
  if [ "$redis_status" = "healthy" ]; then
    check "/api/health redis" "pass"
  else
    check "/api/health redis" "warn" "${redis_status:-unreachable}"
  fi
else
  if [ "$QUICK_MODE" = "true" ]; then
    check "/api/health" "warn" "endpoint not responding"
  else
    check "/api/health" "fail" "endpoint not responding"
    smoke_ok=false
  fi
fi

# /api/health/live — liveness probe (should always respond 200)
live_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 \
  "http://localhost:${PORT}/api/health/live" 2>/dev/null || echo 000)
if [ "$live_code" = "200" ]; then
  check "/api/health/live" "pass"
else
  check "/api/health/live" "warn" "code=${live_code} (expected 200)"
fi

# /api/health/ready — readiness probe (may degrade without infra)
ready_json=$(curl -fs "http://localhost:${PORT}/api/health/ready" 2>/dev/null || echo "")
if [ -n "$ready_json" ]; then
  ready_status=$(echo "$ready_json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status",""))' 2>/dev/null || echo "")
  if [ "$ready_status" = "ready" ]; then
    check "/api/health/ready" "pass" "ready"
  elif [ "$QUICK_MODE" = "true" ] || [ "$NO_INFRA" = "true" ]; then
    check "/api/health/ready" "warn" "${ready_status:-unreachable} (ok for --quick/--no-infra)"
  else
    check "/api/health/ready" "warn" "${ready_status:-unreachable}"
  fi
else
  check "/api/health/ready" "warn" "endpoint not responding"
fi

# /api/health/cache — cache health (informational)
cache_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 \
  "http://localhost:${PORT}/api/health/cache" 2>/dev/null || echo 000)
if [ "$cache_code" = "200" ]; then
  check "/api/health/cache" "pass"
else
  check "/api/health/cache" "warn" "code=${cache_code} (expected 200)"
fi

# Login HTML — accept 200/3xx with document markers (retry once for HMR race)
login_ok=false
for _try in 1 2 3; do
  login_code=$(curl -sL -o /tmp/arch-login-smoke.html -w "%{http_code}" --connect-timeout 3 \
    "http://localhost:${PORT}/login" 2>/dev/null || echo 000)
  if echo "$login_code" | grep -qE '^(200|307|308)$' \
    && grep -qiE '<!doctype|<html|Sign In \| Arch OS|data-testid="login-card"' /tmp/arch-login-smoke.html 2>/dev/null; then
    login_ok=true
    break
  fi
  sleep 1
done
if [ "$login_ok" = "true" ]; then
  check "Login page HTML" "pass"
else
  check "Login page HTML" "fail" "code=${login_code:-?} no document markers"
  smoke_ok=false
fi

# Routing: /hub should redirect to /login when unauthenticated
hub_code=$(curl -sL -o /tmp/arch-hub-smoke.html -w "%{http_code}" --connect-timeout 3 \
  "http://localhost:${PORT}/hub" 2>/dev/null || echo 000)
if echo "$hub_code" | grep -qE '^(307|308|302)$'; then
  check 'Routing: /hub → /login' "pass" "redirect (3xx)"
else
  check 'Routing: /hub → /login' "warn" "code=${hub_code} (expected 3xx redirect)"
fi

# Routing: department page should redirect to /login when unauthenticated
dept_code=$(curl -sL -o /tmp/arch-dept-smoke.html -w "%{http_code}" --connect-timeout 3 \
  "http://localhost:${PORT}/engineering" 2>/dev/null || echo 000)
if echo "$dept_code" | grep -qE '^(307|308|302)$'; then
  check 'Routing: /engineering → /login' "pass" "redirect (3xx)"
else
  check 'Routing: /engineering → /login' "warn" "code=${dept_code} (expected 3xx redirect)"
fi

curl -fs "http://localhost:${PORT}/favicon.ico" >/dev/null 2>&1 \
  && check "Static assets" "pass" \
  || check "Static assets" "skip" "no favicon yet"

if [ "$smoke_ok" = "false" ]; then
  echo -e "\n  ${RED}${BOLD}Stack smoke failed — fix infra before login.${NC}\n"
  exit 1
fi

if [ "$RUN_QUALITY" = "true" ]; then
  echo -e "  ${INFO} Running pnpm quality..."
  if (cd "$REPO_ROOT" && pnpm quality); then
    check "pnpm quality" "pass"
  else
    check "pnpm quality" "fail"
    exit 1
  fi
fi

# ── Phase 7: Daemons ──────────────────────────────────────────────────────────
phase 7 "Daemons"
bash "$REPO_ROOT/scripts/lsp-router.sh" start &
bash "$REPO_ROOT/scripts/mcp-manager.sh" start &
bash "$REPO_ROOT/scripts/heal-daemon.sh" &
node "$REPO_ROOT/scripts/monitor/serve-monitor.mjs" &

# ── Done ──────────────────────────────────────────────────────────────────────
show_results

if [ "$OPEN_MONITORS" = "true" ]; then
  open_monitors
fi
if [ "$OPEN_BROWSER" = "true" ]; then
  open_browser
fi

# Keep alive while a portal we started is running. If we reused an existing
# portal PID, exit without killing it (bare `wait` would return immediately).
if [ "$STARTED_PORTAL" = "true" ] && [ -f "$REPO_ROOT/.portal.pid" ]; then
  portal_pid="$(cat "$REPO_ROOT/.portal.pid")"
  while kill -0 "$portal_pid" 2>/dev/null; do
    sleep 2
  done
else
  trap - EXIT
  echo -e "  ${DIM}Portal was already running — leaving it up. Use: pnpm shutdown${NC}"
  exit 0
fi
