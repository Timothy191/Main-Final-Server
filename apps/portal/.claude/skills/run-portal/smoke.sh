#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch Systems — portal smoke harness
#
# Boots the Next.js dev server, waits for readiness, and reports the state:
#   • HTTP 200/307/308 on a target URL → PASS (page rendered)
#   • HTTP 500 with "Module not found" / "Failed to compile" in the log
#     → FAIL with a brief diagnosis
#   • Server fails to start within timeout → FAIL with last log lines
#
# Optional: --shoot <url> <out.png> takes a headless chromium screenshot.
#
# Exit code is 0 on pass, 1 on fail. Always cleans up the dev server on exit.
#
# Usage (from apps/portal/):
#   .claude/skills/run-portal/smoke.sh                     # boot + wait
#   .claude/skills/run-portal/smoke.sh --shoot /login shot.png
#   .claude/skills/run-portal/smoke.sh --no-launch         # just probe a running server
#   .claude/skills/run-portal/smoke.sh --port 4000
# ──────────────────────────────────────────────────────────────────────────────
set -uo pipefail

# Skill lives at apps/portal/.claude/skills/run-portal/ — three levels up
# gets us to the monorepo root.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_DIR="$REPO_ROOT/apps/portal"
PORT="${PORT:-3000}"
LOG="$REPO_ROOT/portal.log"
PIDFILE="$REPO_ROOT/.portal.pid"
SCREENSHOT_URL=""
SCREENSHOT_OUT=""
NO_LAUNCH=0

while [ $# -gt 0 ]; do
  case "$1" in
    --shoot)    SCREENSHOT_URL="$2"; SCREENSHOT_OUT="$3"; shift 3 ;;
    --no-launch) NO_LAUNCH=1; shift ;;
    --port)     PORT="$2"; shift 2 ;;
    --help|-h)
      sed -n '2,20p' "$0"; exit 0 ;;
    *)          shift ;;
  esac
done

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[0;2m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}${BOLD}✓${NC} $1"; }
fail() { echo -e "  ${RED}${BOLD}✗${NC} $1"; }
warn() { echo -e "  ${YELLOW}${BOLD}⚠${NC} $1"; }
info() { echo -e "  ${CYAN}${BOLD}→${NC} $1"; }

# ── Cleanup ───────────────────────────────────────────────────────────────────
cleanup() {
  if [ -f "$PIDFILE" ]; then
    pid=$(cat "$PIDFILE" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      info "Stopped portal (PID $pid)"
    fi
    rm -f "$PIDFILE"
  fi
}
trap cleanup EXIT INT TERM

# ── Helpers ───────────────────────────────────────────────────────────────────
wait_ready() {
  local target="${1:-/login}" max="${2:-60}"
  for i in $(seq 1 "$max"); do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}${target}" 2>/dev/null || echo "000")
    case "$code" in
      200|307|308) echo "$code"; return 0 ;;
      500)
        # Compile error — fail fast rather than waiting the full timeout
        if grep -qiE "Module not found|Failed to compile|Cannot find module|SyntaxError" "$LOG" 2>/dev/null; then
          echo "500"; return 1
        fi
        ;;
    esac
    sleep 1
  done
  echo "000"
  return 1
}

# ── Banner ────────────────────────────────────────────────────────────────────
echo
echo -e "  ${BOLD}${CYAN}Arch Systems — portal smoke test${NC}"
echo -e "  ${DIM}Port $PORT  ·  Log: $LOG${NC}"
echo

# ── If a server is already on the port, kill it first ────────────────────────
if [ "$NO_LAUNCH" = "0" ]; then
  if ss -tlnH 2>/dev/null | grep -qE ":${PORT} "; then
    pid=$(lsof -ti :"$PORT" 2>/dev/null | head -n1 || true)
    if [ -n "$pid" ]; then
      info "Port $PORT in use (PID $pid) — freeing"
      kill "$pid" 2>/dev/null || true
      sleep 1
    fi
  fi

  # pnpm on this system lives at /home/timothy/.npm-global/bin/pnpm and is not
  # always on PATH; resolve it explicitly so this works in a fresh shell.
  PNPM_BIN="$(command -v pnpm || echo /home/timothy/.npm-global/bin/pnpm)"
  if [ ! -x "$PNPM_BIN" ]; then
    fail "pnpm not found"; exit 1
  fi

  # Rotate log and spawn dev server
  : > "$LOG"
  info "Starting Next.js dev server..."
  ( cd "$APP_DIR" && PORT="$PORT" "$PNPM_BIN" dev > "$LOG" 2>&1 & echo $! > "$PIDFILE" )
  sleep 2  # let the server bind before we start polling
fi

# ── Wait for readiness (or compile error) ────────────────────────────────────
info "Waiting for http://localhost:${PORT}/login ..."
wait_ready /login 90
wait_status=$?
# Re-read the code from the log via curl directly (the function printed to stdout)
final_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/login" 2>/dev/null || echo "000")

if [ "$wait_status" = "0" ] && echo "$final_code" | grep -qE "^(200|307|308)$"; then
  ok "Portal ready (HTTP $final_code)"
  PASS=1
elif [ "$final_code" = "500" ] && grep -qiE "Module not found|Failed to compile|Cannot find module|SyntaxError" "$LOG" 2>/dev/null; then
  echo
  fail "Portal returned HTTP 500 — source code has compile errors"
  echo
  echo -e "  ${BOLD}Missing modules detected in log:${NC}"
  grep "Module not found" "$LOG" 2>/dev/null | sort -u | sed 's/^/    /' | head -20
  echo
  echo -e "  ${DIM}Full log: $LOG${NC}"
  PASS=0
elif [ "$final_code" = "000" ]; then
  echo
  fail "Portal did not respond within 90s"
  echo
  echo -e "  ${BOLD}Last 20 lines of portal.log:${NC}"
  tail -20 "$LOG" 2>/dev/null | sed 's/^/    /'
  PASS=0
else
  echo
  fail "Portal returned unexpected HTTP $final_code"
  echo
  echo -e "  ${BOLD}Last 20 lines of portal.log:${NC}"
  tail -20 "$LOG" 2>/dev/null | sed 's/^/    /'
  PASS=0
fi

# ── Screenshot (optional) ─────────────────────────────────────────────────────
if [ -n "$SCREENSHOT_URL" ] && [ -n "$SCREENSHOT_OUT" ]; then
  if [ "$PASS" = "1" ]; then
    outpath="$SCREENSHOT_OUT"
    [ "${outpath:0:1}" != "/" ] && outpath="$REPO_ROOT/$outpath"
    info "Screenshot → $outpath"
    /usr/bin/chromium \
      --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
      --hide-scrollbars --window-size=1280,800 \
      --screenshot="$outpath" \
      "http://localhost:${PORT}${SCREENSHOT_URL}" 2>&1 | grep -vE "^\[" | head -3 || true
    if [ -f "$outpath" ]; then
      ok "Saved screenshot ($(stat -c%s "$outpath" 2>/dev/null || stat -f%z "$outpath" 2>/dev/null) bytes)"
    else
      warn "Screenshot not produced (chromium missing?)"
    fi
  else
    warn "Skipping screenshot — portal not ready"
  fi
fi

echo
[ "$PASS" = "1" ] && { ok "Smoke test PASSED"; exit 0; } || { fail "Smoke test FAILED"; exit 1; }
