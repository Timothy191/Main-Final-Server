#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Arch-Systems — Automated System Scanner, Setup & 3-Iteration Repair Loop
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

# ── Colours ───────────────────────────────────────────────────────────────────
DIM='\033[0;2m'; RED='\033[0;31m'; GREEN='\033[0;32m'
YELLOW='\033[0;33m'; CYAN='\033[0;36m'; MAGENTA='\033[0;35m'
BOLD='\033[1m'; NC='\033[0m'

OK="${GREEN}${BOLD}✓${NC}"; ERR="${RED}${BOLD}✗${NC}"; WARN="${YELLOW}${BOLD}⚠${NC}"; FIX="${CYAN}${BOLD}⚙${NC}"

log_ok()   { echo -e "  [${OK}] $1${DIM}${2:+  ($2)}${NC}"; }
log_err()  { echo -e "  [${ERR}] $1${RED}${2:+  ($2)}${NC}"; }
log_warn() { echo -e "  [${WARN}] $1${YELLOW}${2:+  ($2)}${NC}"; }
log_fix()  { echo -e "  [${FIX}] $1${CYAN}${2:+  ($2)}${NC}"; }

banner() {
  clear 2>/dev/null || true
  echo
  echo -e "  ${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "  ${BOLD}${CYAN}║     Arch Systems  ·  System Auto-Setup & Repair Loop         ║${NC}"
  echo -e "  ${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo
}

# ── Auto-Repair & Setup Actions ───────────────────────────────────────────────

repair_runtimes() {
  echo -e "\n  ${BOLD}${MAGENTA}▶ Checking & Installing Required Runtimes${NC}"

  # Node.js check & install
  if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 22 ]]; then
    log_fix "Node.js missing or version < 22. Attempting auto-setup..."
    if command -v nvm >/dev/null 2>&1 || [[ -d "$HOME/.nvm" ]]; then
      [ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"
      nvm install 22 && nvm use 22 || true
    elif command -v volta >/dev/null 2>&1; then
      volta install node@24.15.0
    fi
  else
    log_ok "Node.js runtime: $(node -v)"
  fi

  # pnpm check & install
  if ! command -v pnpm >/dev/null 2>&1; then
    log_fix "Installing pnpm globally via corepack / npm..."
    corepack enable 2>/dev/null || npm install -g pnpm@9.15.9 || true
  else
    log_ok "pnpm package manager: v$(pnpm -v)"
  fi

  # Docker daemon check
  if command -v docker >/dev/null 2>&1; then
    if ! docker info >/dev/null 2>&1; then
      log_fix "Starting Docker daemon..."
      sudo systemctl start docker 2>/dev/null || true
    else
      log_ok "Docker daemon active: $(docker --version | awk '{print $3}' | tr -d ',')"
    fi
  else
    log_warn "Docker not installed. Please install Docker for Supabase container stack."
  fi
}

repair_dependencies() {
  echo -e "\n  ${BOLD}${MAGENTA}▶ Checking & Building Monorepo Dependencies${NC}"

  if [[ ! -d "$REPO_ROOT/node_modules" ]] || [[ ! -d "$REPO_ROOT/apps/portal/node_modules" ]]; then
    log_fix "Monorepo node_modules missing. Running 'pnpm install'..."
    (cd "$REPO_ROOT" && pnpm install --no-frozen-lockfile)
  else
    log_ok "Monorepo dependencies present."
  fi
}

repair_services() {
  echo -e "\n  ${BOLD}${MAGENTA}▶ Checking & Starting Core Services (Supabase & Redis)${NC}"

  # Redis Service
  if ! nc -z 127.0.0.1 6379 2>/dev/null && ! (exec 3<>/dev/tcp/127.0.0.1/6379) 2>/dev/null; then
    log_fix "Starting local Redis instance..."
    if command -v systemctl >/dev/null 2>&1; then
      sudo systemctl start redis 2>/dev/null || sudo systemctl start redis-server 2>/dev/null || true
    fi
    if ! nc -z 127.0.0.1 6379 2>/dev/null; then
      log_fix "Launching Redis container..."
      docker run -d --name arch-redis -p 6379:6379 redis:alpine 2>/dev/null || docker start arch-redis 2>/dev/null || true
    fi
  else
    log_ok "Redis service listening on port 6379."
  fi

  # Supabase Stack
  local http_status
  http_status=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:54321/rest/v1/" || echo "000")
  if [[ "$http_status" != "200" ]] && [[ "$http_status" != "401" ]]; then
    log_fix "Starting Supabase local stack..."
    (cd "$REPO_ROOT" && pnpm supabase:start) || true
  else
    log_ok "Supabase services operational (REST HTTP $http_status)."
  fi
}

# ── 3-Iteration Loop Setup & Verification ─────────────────────────────────────
run_iterative_setup_loop() {
  local max_loops=3
  local iteration=1
  local pass=false

  while [[ $iteration -le $max_loops ]]; do
    echo
    echo -e "  ${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
    echo -e "  ${BOLD}${CYAN} Iteration $iteration / $max_loops — Scanning & Applying System Repair${NC}"
    echo -e "  ${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"

    repair_runtimes
    repair_dependencies
    repair_services

    echo
    echo -e "  ${BOLD}${MAGENTA}▶ Running System Readiness Check (Loop $iteration)${NC}"
    if bash "$SCRIPT_DIR/check-prod-requirements.sh"; then
      log_ok "Pass achieved on Iteration $iteration!"
      pass=true
      break
    else
      log_warn "Iteration $iteration detected missing items. Proceeding to self-repair..."
    fi

    ((iteration++))
    sleep 2
  done

  echo
  echo -e "  ${BOLD}${CYAN}══════════════════════════════════════════════════════════════${NC}"
  if [[ "$pass" == "true" ]]; then
    echo -e "  [${OK}] ${GREEN}${BOLD}SYSTEM SCAN & SETUP COMPLETED SUCCESSFULLY IN $iteration ITERATION(S)!${NC}"
    echo
    exit 0
  else
    echo -e "  [${ERR}] ${RED}${BOLD}SYSTEM SETUP INCOMPLETE AFTER $max_loops ITERATIONS. Check logs above.${NC}"
    echo
    exit 1
  fi
}

main() {
  banner
  run_iterative_setup_loop
}

main "$@"
