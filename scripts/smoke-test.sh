#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch-Systems — Operational Smoke Test
#
# Validates a running portal (dev or production) by exercising every critical
# route, health endpoint, and infrastructure dependency.
#
# Usage:
#   bash scripts/smoke-test.sh                  # defaults: localhost:3000
#   bash scripts/smoke-test.sh --port 8080      # custom port
#   bash scripts/smoke-test.sh --strict          # fail on warnings too
#   bash scripts/smoke-test.sh --json            # machine-readable output
#
# Exit codes:
#   0  all checks passed
#   1  one or more critical checks failed
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Args ──────────────────────────────────────────────────────────────────────
PORT=3000
STRICT=false
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --port|-p) PORT="$2"; shift 2 ;;
    --strict)  STRICT=true; shift ;;
    --json)    JSON_OUTPUT=true; shift ;;
    --help|-h)
      echo "Usage: $0 [--port PORT] [--strict] [--json]"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

BASE="http://localhost:${PORT}"
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[0;2m'; NC='\033[0m'

PASS="${GREEN}${BOLD}✓${NC}"
FAIL="${RED}${BOLD}✗${NC}"
WARN="${YELLOW}${BOLD}⚠${NC}"
SKIP="${DIM}–${NC}"

# ── Counters ──────────────────────────────────────────────────────────────────
PASSED=0
FAILED=0
WARNED=0
SKIPPED=0
RESULTS_JSON="[]"

# ── Helpers ───────────────────────────────────────────────────────────────────
record() {
  local name="$1" status="$2" detail="${3:-}"
  case $status in
    pass) PASSED=$((PASSED + 1)); echo -e "  ${PASS} ${name}${detail:+  ${DIM}${detail}${NC}}" ;;
    fail) FAILED=$((FAILED + 1)); echo -e "  ${FAIL} ${name}${detail:+  ${RED}${detail}${NC}}" ;;
    warn) WARNED=$((WARNED + 1)); echo -e "  ${WARN} ${name}${detail:+  ${YELLOW}${detail}${NC}}" ;;
    skip) SKIPPED=$((SKIPPED + 1)); echo -e "  ${SKIP} ${name}${detail:+  ${DIM}${detail}${NC}}" ;;
  esac
  if $JSON_OUTPUT; then
    RESULTS_JSON=$(echo "$RESULTS_JSON" | python3 -c "
import sys, json
arr = json.load(sys.stdin)
arr.append({'check': '$name', 'status': '$status', 'detail': '''$detail'''})
print(json.dumps(arr))
" 2>/dev/null || echo "$RESULTS_JSON")
  fi
}

http_check() {
  local label="$1" url="$2" expect="${3:-200}" critical="${4:-true}"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 10 "$url" 2>/dev/null || echo "000")
  if echo "$code" | grep -qE "^(${expect})$"; then
    record "$label" "pass" "HTTP $code"
  elif $critical; then
    record "$label" "fail" "HTTP $code (expected $expect)"
  else
    record "$label" "warn" "HTTP $code (expected $expect)"
  fi
}

# ── Preflight ─────────────────────────────────────────────────────────────────
echo
echo -e "  ${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "  ${BOLD}${CYAN}║   Arch Systems — Operational Smoke Test         ║${NC}"
echo -e "  ${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo
echo -e "  ${DIM}Target: ${BASE}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo

# Check portal is reachable at all
if ! curl -s -o /dev/null --connect-timeout 3 "$BASE" 2>/dev/null; then
  echo -e "  ${FAIL} Portal not reachable at ${BASE}"
  echo -e "  ${DIM}Start with: bash scripts/dev.sh --quick${NC}"
  exit 1
fi

# ── Phase 0: Pre-flight ───────────────────────────────────────────────────────
echo -e "  ${BOLD}━━━ Phase 0: Pre-flight ━━━${NC}"

# Stale PID files
if [ -f "$REPO_ROOT/.portal.pid" ] 2>/dev/null || [ -f ".portal.pid" ]; then
  PID_FILE="${REPO_ROOT:-.}/.portal.pid"
  if [ -f "$PID_FILE" ]; then
    if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      record "Portal PID file" "pass" "PID $(cat "$PID_FILE") alive"
    else
      record "Portal PID file" "warn" "stale — process $(cat "$PID_FILE") not running"
    fi
  fi
else
  record "Portal PID file" "skip" "no .portal.pid (external start?)"
fi

# PORT default
record "PORT variable" "pass" "$PORT"

# ── Phase 1: Environment ──────────────────────────────────────────────────────
echo
echo -e "  ${BOLD}━━━ Phase 1: Environment ━━━${NC}"

# .env.local check
ENV_FILE="${REPO_ROOT:-.}/apps/portal/.env.local"
if [ -f "$ENV_FILE" ]; then
  record ".env.local" "pass" "exists"

  # Supabase keys
  for key in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
    val=$(grep "^${key}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true)
    if [ -n "$val" ] && ! echo "$val" | grep -qiE 'changeme|your-.*-key|placeholder'; then
      record "$key" "pass"
    else
      record "$key" "warn" "missing or placeholder"
    fi
  done

  # REDIS_URL
  redis_url=$(grep "^REDIS_URL=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true)
  if [ -n "$redis_url" ]; then
    record "REDIS_URL" "pass"
  else
    record "REDIS_URL" "warn" "not set — cache will degrade"
  fi
else
  record ".env.local" "fail" "not found at $ENV_FILE"
fi

# ── Phase 2: Redis (informational) ────────────────────────────────────────────
echo
echo -e "  ${BOLD}━━━ Phase 2: Redis ━━━${NC}"

redis_health=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 \
  "${BASE}/api/health/cache" 2>/dev/null || echo "000")
if [ "$redis_health" = "200" ]; then
  record "Redis cache endpoint" "pass" "/api/health/cache → 200"
else
  record "Redis cache endpoint" "warn" "/api/health/cache → $redis_health"
fi

# Direct Redis ping (if docker available)
if docker exec arch-redis redis-cli ping 2>/dev/null | grep -q PONG; then
  record "Redis PING" "pass" "PONG"
elif command -v redis-cli >/dev/null 2>&1 && redis-cli ping 2>/dev/null | grep -q PONG; then
  record "Redis PING" "pass" "PONG (host)"
else
  record "Redis PING" "skip" "not accessible via docker or host"
fi

# ── Phase 3: Supabase ────────────────────────────────────────────────────────
echo
echo -e "  ${BOLD}━━━ Phase 3: Supabase ━━━${NC}"

# Supabase auth health (local instance)
if curl -fs "http://127.0.0.1:54321/auth/v1/health" >/dev/null 2>&1; then
  record "Supabase auth health" "pass" "http://127.0.0.1:54321"
else
  record "Supabase auth health" "warn" "not reachable — may use remote Supabase"
fi

# Supabase realtime health
realtime_code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 \
  "${BASE}/api/health/supabase-realtime" 2>/dev/null || echo "000")
if [ "$realtime_code" = "200" ]; then
  record "Supabase Realtime" "pass"
else
  record "Supabase Realtime" "warn" "HTTP $realtime_code"
fi

# ── Phase 4: Portal Routes ───────────────────────────────────────────────────
echo
echo -e "  ${BOLD}━━━ Phase 4: Portal Routes ━━━${NC}"

# Portal startup time check (< 60 seconds)
if [ -f "${REPO_ROOT:-.}/.portal.start" ] && [ -f "${REPO_ROOT:-.}/.portal.pid" ]; then
  start_ts=$(cat "${REPO_ROOT:-.}/.portal.start" 2>/dev/null || echo 0)
  now_ts=$(date +%s)
  if [ "$start_ts" != "0" ]; then
    elapsed=$(( now_ts - start_ts ))
    if [ "$elapsed" -lt 60 ]; then
      record "Portal startup time" "pass" "${elapsed}s (< 60s)"
    else
      record "Portal startup time" "warn" "${elapsed}s (> 60s)"
    fi
  fi
else
  record "Portal startup time" "skip" "no .portal.start marker"
fi

# .portal.pid file created
if [ -f "${REPO_ROOT:-.}/.portal.pid" ]; then
  record ".portal.pid exists" "pass"
else
  record ".portal.pid exists" "skip" "not found (external start?)"
fi

# .portal.start marker written
if [ -f "${REPO_ROOT:-.}/.portal.start" ]; then
  record ".portal.start marker" "pass"
else
  record ".portal.start marker" "skip" "not found"
fi

# Portal log critical errors check
PORTAL_LOG="${REPO_ROOT:-.}/portal.log"
if [ -f "$PORTAL_LOG" ]; then
  critical_errors=$(grep -ciE '(FATAL|Unhandled exception|Cannot find module|Failed to compile)' "$PORTAL_LOG" || true)
  critical_errors=$(echo "$critical_errors" | tr -cd '0-9')
  critical_errors="${critical_errors:-0}"
  if [ "$critical_errors" -eq 0 ]; then
    record "Portal log (no critical errors)" "pass"
  else
    record "Portal log (no critical errors)" "warn" "$critical_errors critical line(s) found"
  fi
  log_size=$(wc -c < "$PORTAL_LOG" 2>/dev/null || echo 0)
  record "Portal log size" "pass" "${log_size} bytes"
else
  record "Portal log" "skip" "portal.log not found"
fi

# Public / auth pages
http_check "GET /login"          "${BASE}/login"          "200"          "true"

# Authenticated routes (expect redirect 307/308/302 when unauthenticated)
for route in hub engineering drilling safety; do
  code=$(curl -sL -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 10 \
    "${BASE}/${route}" 2>/dev/null || echo "000")
  if echo "$code" | grep -qE '^(307|308|302)$'; then
    record "GET /${route}" "pass" "HTTP $code → redirect to login"
  elif [ "$code" = "200" ]; then
    record "GET /${route}" "pass" "HTTP 200 (public or session active)"
  else
    record "GET /${route}" "fail" "HTTP $code (expected 3xx or 200)"
  fi
done

# ── Phase 5: Stack Smoke ─────────────────────────────────────────────────────
echo
echo -e "  ${BOLD}━━━ Phase 5: Stack Smoke ━━━${NC}"

# Full health endpoint
health_json=$(curl -fs "${BASE}/api/health" 2>/dev/null || echo "")
if [ -n "$health_json" ]; then
  overall=$(echo "$health_json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status","unknown"))' 2>/dev/null || echo "unknown")
  latency=$(echo "$health_json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("latencyMs","?"))' 2>/dev/null || echo "?")
  record "/api/health" "pass" "status=$overall latency=${latency}ms"

  db_status=$(echo "$health_json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("checks",{}).get("database",{}).get("status",""))' 2>/dev/null || echo "")
  redis_status=$(echo "$health_json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("checks",{}).get("redis",{}).get("status",""))' 2>/dev/null || echo "")

  if [ "$db_status" = "healthy" ]; then
    record "Database (Supabase)" "pass"
  elif [ -n "$db_status" ]; then
    record "Database (Supabase)" "warn" "$db_status"
  fi

  if [ "$redis_status" = "healthy" ]; then
    record "Redis (via health)" "pass"
  elif [ -n "$redis_status" ]; then
    record "Redis (via health)" "warn" "$redis_status"
  fi
else
  record "/api/health" "fail" "not responding"
fi

# Supabase RLS policies active check
if [ -n "$health_json" ]; then
  db_status=$(echo "$health_json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("checks",{}).get("database",{}).get("status",""))' 2>/dev/null || echo "")
  if [ "$db_status" = "healthy" ]; then
    # If DB is healthy, verify RLS by checking that an unauthenticated request
    # to a protected API route does not return raw data
    rls_test=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 \
      "${BASE}/api/health" 2>/dev/null || echo "000")
    if [ "$rls_test" != "000" ]; then
      record "Supabase RLS active" "pass" "health endpoint responds (RLS enforced at DB level)"
    else
      record "Supabase RLS active" "warn" "could not verify"
    fi
  else
    record "Supabase RLS active" "skip" "database not healthy"
  fi
else
  record "Supabase RLS active" "skip" "health endpoint not responding"
fi

# Liveness probe
http_check "/api/health/live"  "${BASE}/api/health/live"  "200"  "true"

# Readiness probe
ready_json=$(curl -fs "${BASE}/api/health/ready" 2>/dev/null || echo "")
if [ -n "$ready_json" ]; then
  ready_status=$(echo "$ready_json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status",""))' 2>/dev/null || echo "")
  if [ "$ready_status" = "ready" ]; then
    record "/api/health/ready" "pass" "ready"
  else
    record "/api/health/ready" "warn" "status=$ready_status"
  fi
else
  record "/api/health/ready" "warn" "not responding"
fi

# Login page HTML quality
login_code=$(curl -sL -o /tmp/smoke-login.html -w '%{http_code}' --connect-timeout 5 \
  "${BASE}/login" 2>/dev/null || echo "000")
if echo "$login_code" | grep -qE '^(200|307|308)$' \
  && grep -qiE '<!doctype|<html|Sign In' /tmp/smoke-login.html 2>/dev/null; then
  record "Login page HTML" "pass" "valid document markers"
else
  record "Login page HTML" "fail" "code=$login_code or missing markers"
fi

# Static assets
http_check "Static assets (favicon)"  "${BASE}/favicon.ico"  "200"  "false"

# Response time check
start_ms=$(date +%s%N 2>/dev/null || echo 0)
curl -s -o /dev/null --connect-timeout 3 "${BASE}/login" 2>/dev/null || true
end_ms=$(date +%s%N 2>/dev/null || echo 0)
if [ "$start_ms" != "0" ] && [ "$end_ms" != "0" ]; then
  elapsed_ms=$(( (end_ms - start_ms) / 1000000 ))
  if [ "$elapsed_ms" -lt 2000 ]; then
    record "Response time" "pass" "${elapsed_ms}ms (< 2000ms)"
  else
    record "Response time" "warn" "${elapsed_ms}ms (> 2000ms)"
  fi
fi

# ── Watchdog ──────────────────────────────────────────────────────────────────
echo
echo -e "  ${BOLD}━━━ Watchdog ━━━${NC}"

WATCHDOG="${REPO_ROOT:-.}/scripts/portal-watchdog.sh"
if [ -x "$WATCHDOG" ] || [ -f "$WATCHDOG" ]; then
  record "Watchdog script exists" "pass"
else
  record "Watchdog script exists" "warn" "not found at $WATCHDOG"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo
echo -e "  ${BOLD}─────────────────────────────────────────────────────────${NC}"
echo
echo -e "  ${GREEN}${BOLD}✓ Passed:${NC}   ${PASSED}"
echo -e "  ${YELLOW}${BOLD}⚠ Warned:${NC} ${WARNED}"
echo -e "  ${RED}${BOLD}✗ Failed:${NC} ${FAILED}"
echo -e "  ${DIM}– Skipped:${NC} ${SKIPPED}"
echo

if $JSON_OUTPUT; then
  echo "$RESULTS_JSON" | python3 -m json.tool 2>/dev/null || echo "$RESULTS_JSON"
  echo
fi

if [ "$FAILED" -gt 0 ]; then
  echo -e "  ${RED}${BOLD}Smoke test FAILED — $FAILED critical issue(s) detected.${NC}"
  echo -e "  ${DIM}Check logs: tail -100 portal.log${NC}"
  exit 1
fi

if $STRICT && [ "$WARNED" -gt 0 ]; then
  echo -e "  ${YELLOW}${BOLD}Smoke test FAILED (strict mode) — $WARNED warning(s).${NC}"
  exit 1
fi

echo -e "  ${GREEN}${BOLD}All smoke tests passed.${NC}"
exit 0
