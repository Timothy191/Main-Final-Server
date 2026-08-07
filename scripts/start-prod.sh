#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch-Systems — Production Stack Launcher
# Minimal Overhead · Maximum Production Hardening · 0.0.0.0 LAN Binding
#
# Usage:
#   bash scripts/start-prod.sh                  # background daemon (writes portal.log + .portal.pid)
#   bash scripts/start-prod.sh --foreground     # run Next.js in foreground for supervisors
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3000}"
FOREGROUND=false

while [ $# -gt 0 ]; do
  case "$1" in
    --foreground) FOREGROUND=true; shift ;;
    *) shift ;;
  esac
done

# Ensure Volta node/pnpm bins are in PATH for non-interactive shells
export PATH="/home/arch/.volta/bin:$PATH"

echo -e "\033[1;36m  ╔═══════════════════════════════════════╗\033[0m"
echo -e "\033[1;36m  ║   Arch Systems — Production Mode      ║\033[0m"
echo -e "\033[1;36m  ╚═══════════════════════════════════════╝\033[0m"
echo

# 1. Clean Stale Processes
fuser -k -9 "${PORT}/tcp" >/dev/null 2>&1 || true
# 2. Prune non-essential containers & Redis daemon for native in-process speed (~800 MB RAM saved)
docker stop arch-redis supabase_analytics_supabase portal-postgres >/dev/null 2>&1 || true

# 5. Start Production Next.js Portal Server
echo "  → Starting Production Next.js Portal on 0.0.0.0:${PORT}..."
cd "$REPO_ROOT"

# Build Rust engine for ops-babysitter daemon if not already built (production)
if [ ! -f "$REPO_ROOT/arch-engine/rust-wiki-builder/target/release/rust-wiki-builder" ]; then
  echo "  → Building Rust ops engine (first boot)..."
  if command -v cargo >/dev/null 2>&1; then
    (cd "$REPO_ROOT/arch-engine" && cargo build --release 2>&1 | grep -E "^   " | tail -2) || {
      echo "  ⚠ Rust engine build failed; starting portal without ops-babysitter daemon"
    }
  else
    echo "  ⚠ cargo not found; ops-babysitter daemon disabled"
  fi
fi

# Launch ops-babysitter daemon only if binary exists
babysitter_available=false
if [ -f "$REPO_ROOT/arch-engine/rust-wiki-builder/target/release/rust-wiki-builder" ]; then
  babysitter_available=true
fi

if [ "$FOREGROUND" = "true" ]; then
  if [ "$babysitter_available" = "true" ]; then
    node "$REPO_ROOT/arch-engine/ops-daemon/ops-babysitter.mjs" >/dev/null 2>&1 &
    echo $! > "$REPO_ROOT/.babysitter.pid"
  fi
  exec pnpm --filter portal start --hostname 0.0.0.0 --port "$PORT"
else
  if [ "$babysitter_available" = "true" ]; then
    node "$REPO_ROOT/arch-engine/ops-daemon/ops-babysitter.mjs" >/dev/null 2>&1 &
    echo $! > "$REPO_ROOT/.babysitter.pid"
  fi
  nohup pnpm --filter portal start --hostname 0.0.0.0 --port "$PORT" > "$REPO_ROOT/portal.log" 2>&1 &
  echo $! > "$REPO_ROOT/.portal.pid"
  disown

  cd "$REPO_ROOT"
  echo
  echo -e "\033[1;32m  ✓ Production Server is active and listening on 0.0.0.0:${PORT}\033[0m"
  echo -e "\033[0;36m  LAN URL: http://192.168.0.151:${PORT}\033[0m"
fi
