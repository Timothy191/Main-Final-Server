#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Arch-Systems — Production Readiness & Requirements Checker
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

# ── Colours & Formatting ──────────────────────────────────────────────────────
DIM='\033[0;2m'; RED='\033[0;31m'; GREEN='\033[0;32m'
YELLOW='\033[0;33m'; CYAN='\033[0;36m'; MAGENTA='\033[0;35m'
BOLD='\033[1m'; NC='\033[0m'

OK="${GREEN}${BOLD}✓${NC}"; ERR="${RED}${BOLD}✗${NC}"; WARN="${YELLOW}${BOLD}⚠${NC}"; INFO="${CYAN}${BOLD}→${NC}"

log_ok()   { echo -e "  [${OK}] $1${DIM}${2:+  ($2)}${NC}"; }
log_err()  { echo -e "  [${ERR}] $1${RED}${2:+  ($2)}${NC}"; }
log_warn() { echo -e "  [${WARN}] $1${YELLOW}${2:+  ($2)}${NC}"; }
log_info() { echo -e "  [${INFO}] $1"; }

SECTION_ERRORS=0
TOTAL_ERRORS=0

section() {
  SECTION_ERRORS=0
  echo
  echo -e "  ${BOLD}${MAGENTA}▶ $1${NC}"
  echo -e "  ${DIM}──────────────────────────────────────────────────────────${NC}"
}

banner() {
  clear 2>/dev/null || true
  echo
  echo -e "  ${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "  ${BOLD}${CYAN}║      Arch Systems  ·  Production Readiness Checker            ║${NC}"
  echo -e "  ${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo
}

# ── 1. Operating System & Kernel Limits ───────────────────────────────────────
check_os_and_kernel() {
  section "1. Operating System & Kernel Requirements"

  # OS Details (Generic Linux OS Check)
  if [[ -f /etc/os-release ]]; then
    local os_pretty
    os_pretty="$(grep PRETTY_NAME /etc/os-release | cut -d= -f2 | tr -d '"')"
    log_ok "OS Detected: $os_pretty (Linux)"
  elif [[ "$(uname -s)" == "Linux" ]]; then
    log_ok "OS Detected: Generic Linux ($(uname -r))"
  else
    log_err "Non-Linux OS detected: $(uname -s). Production targets Linux OS."
    ((TOTAL_ERRORS++))
  fi

  # CPU & RAM (Targeting 16GB Production Server Specs)
  local total_mem_gb
  total_mem_gb=$(free -g 2>/dev/null | awk '/^Mem:/{print $2}' || echo "0")
  if [[ "$total_mem_gb" -ge 12 ]]; then
    log_ok "System Memory: ${total_mem_gb} GB RAM (Meets 16GB Target Spec)"
  elif [[ "$total_mem_gb" -ge 4 ]]; then
    log_warn "System Memory: ${total_mem_gb} GB RAM (Below 16GB target spec, but sufficient to run)"
  else
    log_err "System Memory critical: ${total_mem_gb} GB RAM (Requires at least 4GB+ RAM)"
    ((TOTAL_ERRORS++))
  fi

  # Open File Limit (ulimit -n)
  local ulimit_n
  ulimit_n=$(ulimit -n 2>/dev/null || echo "1024")
  if [[ "$ulimit_n" -ge 4096 ]]; then
    log_ok "File Descriptor Limit (ulimit -n): $ulimit_n"
  else
    log_warn "File Descriptor Limit low: $ulimit_n (Recommended ≥ 4096, run scripts/os-tune.sh)"
  fi
}

# ── 2. Toolchain & Runtimes ───────────────────────────────────────────────────
check_runtimes() {
  section "2. Runtimes & Monorepo Toolchain"

  # Node.js
  if command -v node >/dev/null 2>&1; then
    local node_ver
    node_ver=$(node -v | sed 's/v//')
    local major_ver
    major_ver=$(echo "$node_ver" | cut -d. -f1)
    if [[ "$major_ver" -ge 22 ]]; then
      log_ok "Node.js Version: v$node_ver"
    else
      log_err "Node.js Version v$node_ver invalid (Requires Node >= 22)"
      ((TOTAL_ERRORS++))
    fi
  else
    log_err "Node.js is not installed or not in PATH"
    ((TOTAL_ERRORS++))
  fi

  # pnpm
  if command -v pnpm >/dev/null 2>&1; then
    local pnpm_ver
    pnpm_ver=$(pnpm -v)
    if [[ "$pnpm_ver" == 9* ]]; then
      log_ok "pnpm Version: v$pnpm_ver"
    else
      log_warn "pnpm Version v$pnpm_ver (Recommended pnpm 9.x)"
    fi
  else
    log_err "pnpm is not installed (Corepack / pnpm required)"
    ((TOTAL_ERRORS++))
  fi

  # Docker & Docker Compose
  if command -v docker >/dev/null 2>&1; then
    local docker_ver
    docker_ver=$(docker --version | awk '{print $3}' | tr -d ',')
    if docker info >/dev/null 2>&1; then
      log_ok "Docker Service active: v$docker_ver"
    else
      log_err "Docker installed but daemon is NOT running or accessible without root"
      ((TOTAL_ERRORS++))
    fi
  else
    log_err "Docker is not installed"
    ((TOTAL_ERRORS++))
  fi

  if docker compose version >/dev/null 2>&1; then
    local compose_ver
    compose_ver=$(docker compose version --short)
    log_ok "Docker Compose: v$compose_ver"
  else
    log_err "Docker Compose plugin is not installed"
    ((TOTAL_ERRORS++))
  fi
}

# ── 3. Services (Supabase & Redis) ────────────────────────────────────────────
check_services() {
  section "3. Infrastructure & Services (Supabase & Redis)"

  # Redis Check
  local redis_url="${REDIS_URL:-redis://127.0.0.1:6379}"
  local redis_host redis_port
  redis_host=$(echo "$redis_url" | sed -E 's|redis://([^:]+):?([0-9]*).*|\1|')
  redis_port=$(echo "$redis_url" | sed -E 's|redis://([^:]+):?([0-9]*).*|\2|')
  redis_port="${redis_port:-6379}"

  if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli -h "$redis_host" -p "$redis_port" ping 2>/dev/null | grep -q PONG; then
      log_ok "Redis Server connected ($redis_url)" "PONG"
    else
      log_err "Redis Server connection failed ($redis_url)"
      ((TOTAL_ERRORS++))
    fi
  else
    # Fallback NC check
    if nc -z "$redis_host" "$redis_port" 2>/dev/null || (exec 3<>/dev/tcp/"$redis_host"/"$redis_port") 2>/dev/null; then
      log_ok "Redis Port ($redis_host:$redis_port) reachable"
    else
      log_err "Redis Port ($redis_host:$redis_port) unresponsive"
      ((TOTAL_ERRORS++))
    fi
  fi

  # Supabase REST API check
  local supabase_url="${NEXT_PUBLIC_SUPABASE_URL:-http://127.0.0.1:54321}"
  local http_status
  http_status=$(curl -s -o /dev/null -w "%{http_code}" "$supabase_url/rest/v1/" || echo "000")

  if [[ "$http_status" == "200" ]] || [[ "$http_status" == "401" ]]; then
    log_ok "Supabase REST API ($supabase_url/rest/v1)" "HTTP $http_status"
  else
    log_err "Supabase REST API unreachable ($supabase_url/rest/v1)" "HTTP $http_status"
    ((TOTAL_ERRORS++))
  fi

  # Supabase PostgreSQL DB Port check (default 54322 for local stack)
  if nc -z 127.0.0.1 54322 2>/dev/null || (exec 3<>/dev/tcp/127.0.0.1/54322) 2>/dev/null; then
    log_ok "Supabase PostgreSQL DB Port (127.0.0.1:54322) listening"
  else
    log_err "Supabase PostgreSQL DB Port (127.0.0.1:54322) closed"
    ((TOTAL_ERRORS++))
  fi
}

# ── 4. Environment Variables & Codebase ───────────────────────────────────────
check_env_and_codebase() {
  section "4. Environment Variables & Monorepo Packages"

  # Run built-in env validator
  if [[ -f "$SCRIPT_DIR/validate-env.sh" ]]; then
    if bash "$SCRIPT_DIR/validate-env.sh" --local >/dev/null 2>&1; then
      log_ok "Environment Variables validated successfully"
    else
      log_warn "Environment Variables check flagged warnings/missing keys"
    fi
  fi

  # Workspace Node Modules check
  if [[ -d "$REPO_ROOT/node_modules" ]] && [[ -d "$REPO_ROOT/apps/portal/node_modules" ]]; then
    log_ok "Monorepo Node Modules installed"
  else
    log_err "Monorepo dependencies missing. Run 'pnpm install'"
    ((TOTAL_ERRORS++))
  fi
}

# ── Summary & Exit ────────────────────────────────────────────────────────────
main() {
  banner
  check_os_and_kernel
  check_runtimes
  check_services
  check_env_and_codebase

  echo
  echo -e "  ${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
  if [[ "$TOTAL_ERRORS" -eq 0 ]]; then
    echo -e "  [${OK}] ${GREEN}${BOLD}PRODUCTION READINESS CHECK PASSED! All systems operational.${NC}"
    echo
    exit 0
  else
    echo -e "  [${ERR}] ${RED}${BOLD}READINESS CHECK FAILED with $TOTAL_ERRORS critical issue(s).${NC}"
    echo
    exit 1
  fi
}

main "$@"
