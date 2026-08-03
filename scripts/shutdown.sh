#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch-Systems — Shutdown Script
# Stops the portal dev process and optionally tears down Redis + Supabase.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

YELLOW='\033[0;33m'; GREEN='\033[0;32m'; NC='\033[0m'; BOLD='\033[1m'; DIM='\033[0;2m'

echo -e "\n  ${BOLD}${YELLOW}Arch Systems — Shutdown${NC}\n"

# Kill portal
if [ -f "$REPO_ROOT/.portal.pid" ]; then
  pid=$(cat "$REPO_ROOT/.portal.pid")
  if kill "$pid" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Portal process (PID $pid) stopped"
  else
    echo -e "  – Portal PID $pid not running"
  fi
  rm -f "$REPO_ROOT/.portal.pid" "$REPO_ROOT/.portal.start"
else
  echo -e "  – No portal PID file found"
fi

# Kill gateway
if [ -f "$REPO_ROOT/.gateway.pid" ]; then
  pid=$(cat "$REPO_ROOT/.gateway.pid")
  if kill "$pid" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Ops Gateway process (PID $pid) stopped"
  else
    echo -e "  – Ops Gateway PID $pid not running"
  fi
  rm -f "$REPO_ROOT/.gateway.pid"
else
  echo -e "  – No Ops Gateway PID file found"
fi


# Optionally stop Supabase + Docker Compose infra (Redis)
if [ "${1:-}" = "--infra" ]; then
  export PATH="${HOME}/.npm-global/bin:${PATH}"

  if (cd "$REPO_ROOT" && pnpm supabase:stop >/dev/null 2>&1); then
    echo -e "  ${GREEN}✓${NC} Supabase stack stopped"
  else
    echo -e "  – Supabase stop skipped (${DIM}not running or CLI unavailable${NC})"
  fi

  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$REPO_ROOT/docker-compose.yml" --profile infra down
    echo -e "  ${GREEN}✓${NC} Docker Compose infra (Redis) stopped"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$REPO_ROOT/docker-compose.yml" --profile infra down
    echo -e "  ${GREEN}✓${NC} Docker Compose infra (Redis) stopped"
  fi
fi

echo -e "\n  ${GREEN}Done.${NC}\n"
