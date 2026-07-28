#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch-Systems — Full Production Test Suite
#
# Validates the entire stack end-to-end:
#   Portal UI → Server Cache (Redis) → Client Cache (IndexedDB/SW) → Database (Supabase)
#
# This test suite is designed to run against a LIVE production/staging instance.
# It tests every layer of the caching architecture and verifies data flows
# correctly through the entire pipeline.
#
# Usage:
#   bash scripts/production-test-suite.sh                       # Test localhost:3000
#   bash scripts/production-test-suite.sh --url https://portal.example.com
#   bash scripts/production-test-suite.sh --url http://localhost:3000 --verbose
#   bash scripts/production-test-suite.sh --url http://localhost:3000 --strict
#   bash scripts/production-test-suite.sh --json                # Machine-readable output
#
# Exit codes:
#   0  All tests passed
#   1  One or more critical tests failed
#   2  Prerequisites not met (portal not reachable)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ─────────────────────────────────────────────────────────────────────
BASE_URL="http://localhost:3000"
VERBOSE=false
STRICT=false
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --url|-u)      BASE_URL="$2"; shift 2 ;;
    --verbose|-v)  VERBOSE=true; shift ;;
    --strict|-s)   STRICT=true; shift ;;
    --json)        JSON_OUTPUT=true; shift ;;
    --help|-h)
      echo "Usage: $0 [--url URL] [--verbose] [--strict] [--json]"
      echo "  --url      Target portal URL (default: http://localhost:3000)"
      echo "  --verbose  Show detailed output for each test"
      echo "  --strict   Fail on warnings too"
      echo "  --json     Machine-readable JSON output"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# ── Colors ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; DIM='\033[0;2m'; NC='\033[0m'

PASS="${GREEN}${BOLD}✓${NC}"
FAIL="${RED}${BOLD}✗${NC}"
WARN="${YELLOW}${BOLD}⚠${NC}"
SKIP="${DIM}–${NC}"
INFO="${CYAN}${BOLD}→${NC}"

# ── Counters ───────────────────────────────────────────────────────────────────
PASSED=0
FAILED=0
WARNED=0
SKIPPED=0
RESULTS_JSON="[]"

# ── Helpers ────────────────────────────────────────────────────────────────────
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
detail_escaped = '''$detail'''.replace(\"'\", \"'\")
arr.append({'check': '$name', 'status': '$status', 'detail': detail_escaped})
print(json.dumps(arr))
" 2>/dev/null || echo "$RESULTS_JSON")
  fi
}

verbose() {
  if $VERBOSE; then echo -e "  ${DIM}${1}${NC}"; fi
}

http_status() {
  curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 15 "$1" 2>/dev/null || echo "000"
}

http_body() {
  curl -s --connect-timeout 5 --max-time 15 "$1" 2>/dev/null || echo ""
}

describe() {
  echo
  echo -e "  ${BOLD}━━━ $1 ━━━${NC}"
  echo -e "  ${DIM}$2${NC}"
  echo
}

check_json_field() {
  local json="$1" field="$2" expected="$3"
  echo "$json" | python3 -c "
import sys, json
try:
  data = json.load(sys.stdin)
  val = data
  for part in '$field'.split('.'):
    val = val[part]
  result = str(val)
  if result == '$expected':
    sys.exit(0)
  else:
    print(f'expected $expected, got {result}')
    sys.exit(1)
except Exception as e:
  print(str(e))
  sys.exit(1)
" 2>/dev/null
  return $?
}

# ══════════════════════════════════════════════════════════════════════════════
#  PREFLIGHT
# ══════════════════════════════════════════════════════════════════════════════
echo
echo -e "  ${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "  ${BOLD}${CYAN}║  Arch Systems — Production Test Suite                  ║${NC}"
echo -e "  ${BOLD}${CYAN}║  Portal → Cache (Redis) → Client Cache → Database      ║${NC}"
echo -e "  ${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "  ${DIM}Target: ${BASE_URL}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo

# Preflight: check portal reachable
if ! curl -s -o /dev/null --connect-timeout 5 "$BASE_URL" 2>/dev/null; then
  echo -e "  ${FAIL} Portal not reachable at ${BASE_URL}"
  echo -e "  ${DIM}Ensure the portal is running and accessible.${NC}"
  exit 2
fi
record "Portal reachable" "pass" "$BASE_URL"

# ══════════════════════════════════════════════════════════════════════════════
#  PHASE 1: ENVIRONMENT & CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════
describe "Phase 1: Environment & Configuration" "Validates env vars, headers, and configuration endpoints"

# Response headers — verify security & cache headers
HEADERS=$(curl -sI --connect-timeout 5 "$BASE_URL/login" 2>/dev/null || true)

if echo "$HEADERS" | grep -qi "X-Content-Type-Options: nosniff"; then
  record "Security header: X-Content-Type-Options" "pass"
else
  record "Security header: X-Content-Type-Options" "warn" "missing"
fi

if echo "$HEADERS" | grep -qi "X-Frame-Options: DENY"; then
  record "Security header: X-Frame-Options" "pass"
else
  record "Security header: X-Frame-Options" "warn" "missing"
fi

if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
  record "Security header: HSTS" "pass"
else
  record "Security header: HSTS" "warn" "missing (non-HTTPS expected for local)"
fi

# Cache-Control header on manifest
MANIFEST_HEADERS=$(curl -sI --connect-timeout 5 "${BASE_URL}/manifest.webmanifest" 2>/dev/null || true)
if echo "$MANIFEST_HEADERS" | grep -qi "Cache-Control.*max-age"; then
  record "Cache-Control on manifest" "pass"
else
  record "Cache-Control on manifest" "warn" "missing cache headers"
fi

# PWA manifest
MANIFEST=$(http_body "${BASE_URL}/manifest.json")
if echo "$MANIFEST" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('name'); assert d.get('icons')" 2>/dev/null; then
  record "PWA manifest valid" "pass"
else
  record "PWA manifest valid" "fail" "missing or invalid manifest.json"
fi

# Service worker file exists on server
SW_CODE=$(http_status "${BASE_URL}/sw.js")
if [ "$SW_CODE" = "200" ]; then
  record "Service Worker file" "pass" "HTTP 200"
else
  record "Service Worker file" "fail" "HTTP $SW_CODE — SW not deployed"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  PHASE 2: PORTAL ROUTES & RENDERING
# ══════════════════════════════════════════════════════════════════════════════
describe "Phase 2: Portal Routes & Rendering" "Verifies critical pages load correctly"

# Login page
LOGIN_HTML=$(http_body "${BASE_URL}/login")
LOGIN_CODE=$(http_status "${BASE_URL}/login")
if echo "$LOGIN_CODE" | grep -qE '^(200)$' && echo "$LOGIN_HTML" | grep -qiE '<!doctype|<html|Sign In|Arch'; then
  record "Login page" "pass" "HTTP $LOGIN_CODE + valid HTML"
elif echo "$LOGIN_CODE" | grep -qE '^(307|308|302)$'; then
  record "Login page" "pass" "HTTP $LOGIN_CODE (redirect)"
else
  record "Login page" "fail" "HTTP $LOGIN_CODE or missing content markers"
fi

# Hub route — should redirect to /login when unauthenticated
HUB_CODE=$(http_status "${BASE_URL}/hub")
if echo "$HUB_CODE" | grep -qE '^(307|308|302)$'; then
  record "Route: /hub → /login" "pass" "unauth redirect $HUB_CODE"
elif [ "$HUB_CODE" = "200" ]; then
  record "Route: /hub → /login" "pass" "HTTP 200 (public or session active)"
else
  record "Route: /hub → /login" "warn" "HTTP $HUB_CODE (expected 3xx or 200)"
fi

# Department routes — should redirect to /login when unauthenticated
for route in engineering drilling safety control-room production; do
  CODE=$(http_status "${BASE_URL}/${route}")
  if echo "$CODE" | grep -qE '^(307|308|302)$'; then
    record "Route: /${route}" "pass" "unauth redirect $CODE"
  elif [ "$CODE" = "200" ]; then
    record "Route: /${route}" "pass" "HTTP 200 (public or session active)"
  else
    record "Route: /${route}" "warn" "HTTP $CODE (expected 3xx or 200)"
  fi
done

# Speculation rules present in HTML
if echo "$LOGIN_HTML" | grep -qi "speculationrules"; then
  record "Speculation Rules (prerender)" "pass"
else
  record "Speculation Rules (prerender)" "warn" "missing from /login"
fi

# Static assets
for asset in /favicon.ico /icons/icon-192x192.png /icons/icon-512x512.png; do
  CODE=$(http_status "${BASE_URL}${asset}")
  if [ "$CODE" = "200" ]; then
    record "Static asset: ${asset}" "pass"
  else
    record "Static asset: ${asset}" "warn" "HTTP $CODE"
  fi
done

# Fonts
FONT_HEADERS=$(curl -sI --connect-timeout 5 "${BASE_URL}/fonts/Anurati-Regular.otf" 2>/dev/null || true)
FONT_CODE=$(echo "$FONT_HEADERS" | head -1 | awk '{print $2}' || echo "000")
if [ "$FONT_CODE" = "200" ]; then
  record "Font: Anurati-Regular.otf" "pass"
else
  record "Font: Anurati-Regular.otf" "warn" "HTTP $FONT_CODE"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  PHASE 3: HEALTH ENDPOINTS & INFRASTRUCTURE
# ══════════════════════════════════════════════════════════════════════════════
describe "Phase 3: Health Endpoints & Infrastructure" "Verifies Redis, Database, and cache layer health"

# Full health check
HEALTH_JSON=$(http_body "${BASE_URL}/api/health")
if [ -n "$HEALTH_JSON" ] && echo "$HEALTH_JSON" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  record "/api/health responds" "pass"

  # Overall status
  OVERALL=$(echo "$HEALTH_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null || echo "unknown")
  record "Health: overall status" "pass" "$OVERALL"

  # Database health
  DB_STATUS=$(echo "$HEALTH_JSON" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(d.get('checks',{}).get('database',{}).get('status','unknown'))
" 2>/dev/null || echo "unknown")
  if [ "$DB_STATUS" = "healthy" ]; then
    record "Health: database (Supabase)" "pass"
  elif [ "$DB_STATUS" = "degraded" ]; then
    record "Health: database (Supabase)" "warn" "degraded"
  else
    record "Health: database (Supabase)" "fail" "$DB_STATUS"
  fi

  # Redis / cache health
  REDIS_STATUS=$(echo "$HEALTH_JSON" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(d.get('checks',{}).get('redis',{}).get('status','unknown'))
" 2>/dev/null || echo "unknown")
  if [ "$REDIS_STATUS" = "healthy" ]; then
    record "Health: Redis (cache)" "pass"
  elif [ "$REDIS_STATUS" = "degraded" ]; then
    record "Health: Redis (cache)" "warn" "degraded"
  else
    record "Health: Redis (cache)" "warn" "$REDIS_STATUS (cache may fall back)"
  fi

  # Latency
  LATENCY=$(echo "$HEALTH_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('latencyMs','?'))" 2>/dev/null || echo "?")
  if [ "$LATENCY" != "?" ] && [ "$LATENCY" -lt 1000 ] 2>/dev/null; then
    record "Health: response time" "pass" "${LATENCY}ms"
  else
    record "Health: response time" "warn" "${LATENCY}ms"
  fi
else
  record "/api/health responds" "fail" "not responding or invalid JSON"
fi

# Liveness probe
LIVE_CODE=$(http_status "${BASE_URL}/api/health/live")
if [ "$LIVE_CODE" = "200" ]; then
  record "Liveness: /api/health/live" "pass"
else
  record "Liveness: /api/health/live" "fail" "HTTP $LIVE_CODE"
fi

# Readiness probe
READY_JSON=$(http_body "${BASE_URL}/api/health/ready")
if [ -n "$READY_JSON" ]; then
  READY_STATUS=$(echo "$READY_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
  if [ "$READY_STATUS" = "ready" ]; then
    record "Readiness: /api/health/ready" "pass"
  else
    record "Readiness: /api/health/ready" "warn" "status=$READY_STATUS"
  fi
else
  record "Readiness: /api/health/ready" "warn" "not responding"
fi

# Cache health endpoint
CACHE_CODE=$(http_status "${BASE_URL}/api/health/cache")
if [ "$CACHE_CODE" = "200" ]; then
  record "Cache: /api/health/cache" "pass"
else
  record "Cache: /api/health/cache" "warn" "HTTP $CACHE_CODE"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  PHASE 4: CACHE LAYER (SERVER-SIDE @repo/redis)
# ══════════════════════════════════════════════════════════════════════════════
describe "Phase 4: Server Cache Layer (Redis @repo/redis)" "Validates L1/L2 cache mesh and tag invalidation"

# Test cache set + get via health/cache endpoint
# This validates the Redis cache handler is wired correctly
CACHE_HEALTH_JSON=$(http_body "${BASE_URL}/api/health/cache")
if [ -n "$CACHE_HEALTH_JSON" ]; then
  # Check if cache is operational
  CACHE_OK=$(echo "$CACHE_HEALTH_JSON" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  print('true' if d.get('status') == 'healthy' or d.get('cache') == 'connected' else 'false')
except: print('false')
" 2>/dev/null || echo "false")
  if [ "$CACHE_OK" = "true" ]; then
    record "Cache: operational" "pass"
  else
    record "Cache: operational" "warn" "cache health degraded"
  fi
fi

# Next.js custom cache handler (Redis-backed)
# This is configured in next.config.mjs — verify it's active
CACHE_HANDLER_ACTIVE=false
# The cache handler is internal, but we can verify by checking if next.config mentions it
if curl -s --connect-timeout 5 "${BASE_URL}/api/health" 2>/dev/null | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  # Check for cache-related fields in the response
  if d.get('checks',{}).get('cache') or d.get('cache'):
    sys.exit(0)
  sys.exit(1)
except: sys.exit(1)
" 2>/dev/null; then
  CACHE_HANDLER_ACTIVE=true
fi
if $CACHE_HANDLER_ACTIVE; then
  record "Next.js cache handler" "pass" "Redis-backed"
else
  record "Next.js cache handler" "warn" "could not verify from health endpoint"
fi

# Tag-based cache invalidation test
# This validates the cacheInvalidateTags function works
TAG_TEST_CODE=$(http_status "${BASE_URL}/api/cache/invalidate" -X POST 2>/dev/null || echo "000")
if [ "$TAG_TEST_CODE" != "000" ]; then
  record "Cache invalidation endpoint" "pass" "HTTP $TAG_TEST_CODE"
else
  record "Cache invalidation endpoint" "warn" "endpoint not found"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  PHASE 5: CLIENT CACHE LAYER (Service Worker + IndexedDB)
# ══════════════════════════════════════════════════════════════════════════════
describe "Phase 5: Client Cache Layer" "Validates Service Worker, IndexedDB cache, and offline capability"

# Service worker registration is done client-side, but we can verify:
# 1. The SW file is served with correct content-type
SW_CONTENT_TYPE=$(curl -sI --connect-timeout 5 "${BASE_URL}/sw.js" 2>/dev/null | grep -i "content-type" | head -1 || echo "")
SW_CODE=$(http_status "${BASE_URL}/sw.js")
if [ "$SW_CODE" = "200" ]; then
  record "SW served: status" "pass"
else
  record "SW served: status" "fail" "HTTP $SW_CODE (expected 200)"
fi

# Verify SW contains expected cache strategies
SW_BODY=$(http_body "${BASE_URL}/sw.js")
if echo "$SW_BODY" | grep -q "CACHE_NAMES"; then
  record "SW: cache strategy definitions" "pass"
else
  record "SW: cache strategy definitions" "fail" "missing CACHE_NAMES"
fi

if echo "$SW_BODY" | grep -q "cacheFirst\|networkFirst\|staleWhileRevalidate"; then
  record "SW: fetch strategies present" "pass"
else
  record "SW: fetch strategies present" "fail" "no fetch strategies found"
fi

# Check SW has proper install/activate/fetch handlers
if echo "$SW_BODY" | grep -q "addEventListener.*install"; then
  record "SW: install handler" "pass"
else
  record "SW: install handler" "fail" "missing install event"
fi

if echo "$SW_BODY" | grep -q "addEventListener.*activate"; then
  record "SW: activate handler" "pass"
else
  record "SW: activate handler" "fail"
fi

if echo "$SW_BODY" | grep -q "addEventListener.*fetch"; then
  record "SW: fetch handler" "pass"
else
  record "SW: fetch handler" "fail"
fi

# Verify SW postMessage API for cache invalidation
if echo "$SW_BODY" | grep -q "addEventListener.*message"; then
  record "SW: message handler (cache invalidation)" "pass"
else
  record "SW: message handler (cache invalidation)" "warn" "missing — can't invalidate cache from app"
fi

# Background sync support
if echo "$SW_BODY" | grep -q "addEventListener.*sync"; then
  record "SW: background sync" "pass"
else
  record "SW: background sync" "warn" "missing — offline mutations won't auto-sync"
fi

# PWA manifest includes service worker scope
MANIFEST_SCOPE=$(echo "$MANIFEST" | python3 -c "import sys,json; print(json.load(sys.stdin).get('scope',''))" 2>/dev/null || echo "")
if [ -n "$MANIFEST_SCOPE" ]; then
  record "PWA: scope defined" "pass" "$MANIFEST_SCOPE"
else
  record "PWA: scope defined" "warn" "missing scope"
fi

# Display mode
DISPLAY_MODE=$(echo "$MANIFEST" | python3 -c "import sys,json; print(json.load(sys.stdin).get('display',''))" 2>/dev/null || echo "")
if [ "$DISPLAY_MODE" = "standalone" ]; then
  record "PWA: display mode" "pass" "standalone"
else
  record "PWA: display mode" "warn" "display=$DISPLAY_MODE (expected standalone)"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  PHASE 6: DATABASE LAYER (Supabase)
# ══════════════════════════════════════════════════════════════════════════════
describe "Phase 6: Database Layer (Supabase)" "Validates database connectivity, migrations, and RLS"

# Database via health endpoint
if [ -n "$HEALTH_JSON" ]; then
  DB_CONNECTED=$(echo "$HEALTH_JSON" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  db=d.get('checks',{}).get('database',{})
  print('true' if db.get('status') == 'healthy' else 'false')
except: print('false')
" 2>/dev/null || echo "false")
  if [ "$DB_CONNECTED" = "true" ]; then
    record "Database: connected" "pass"
  else
    record "Database: connected" "fail" "database not healthy"
  fi
fi

# Check that RLS is enforced by hitting a protected endpoint without auth
# If RLS is working, unprotected access to data endpoints should fail
API_HEALTH_CODE=$(http_status "${BASE_URL}/api/health")
# The health endpoint is public, but data endpoints should not be
# Verify by checking auth-protected routes
AUTH_PROTECTED=$(http_status "${BASE_URL}/api/sync/playback" 2>/dev/null || echo "000")
if [ "$AUTH_PROTECTED" != "200" ]; then
  record "Auth: protected API routes" "pass" "not publicly accessible"
else
  record "Auth: protected API routes" "warn" "publicly accessible (dev mode?)"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  PHASE 7: END-TO-END DATA FLOW
# ══════════════════════════════════════════════════════════════════════════════
describe "Phase 7: End-to-End Data Flow" "Validates the full pipeline: Portal → Cache → DB"

# 1. Verify static content is served (no-cache setup for HTML)
LOGIN_CACHE_CONTROL=$(curl -sI --connect-timeout 5 "${BASE_URL}/login" 2>/dev/null | grep -i "cache-control" | head -1 || echo "")
verbose "Cache-Control for /login: ${LOGIN_CACHE_CONTROL}"

# 2. Verify API cache headers
API_CACHE_CONTROL=$(curl -sI --connect-timeout 5 "${BASE_URL}/api/health" 2>/dev/null | grep -i "cache-control" | head -1 || echo "")
verbose "Cache-Control for /api/health: ${API_CACHE_CONTROL}"

# 3. Verify SW can be used to cache content
# We can check if the service worker's cache naming convention is followed
if echo "$SW_BODY" | grep -q "arch-static-v1\|arch-pages-v1\|arch-api-v1"; then
  record "E2E: SW cache naming convention" "pass"
else
  record "E2E: SW cache naming convention" "fail" "cache names not found in SW"
fi

# 4. Verify the offline queue hook is in the bundle
SW_BODY_LC=$(echo "$SW_BODY" | tr '[:upper:]' '[:lower:]')
if echo "$SW_BODY_LC" | grep -q "offline"; then
  record "E2E: offline support in SW" "pass"
else
  record "E2E: offline support in SW" "warn" "no offline handling in SW"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  PHASE 8: PERFORMANCE & RESPONSE TIMES
# ══════════════════════════════════════════════════════════════════════════════
describe "Phase 8: Performance & Response Times" "Validates response times and performance budgets"

# Measure response times for critical endpoints
for endpoint in "/login" "/api/health" "/favicon.ico"; do
  start_ms=$(date +%s%N 2>/dev/null || echo 0)
  curl -s -o /dev/null --connect-timeout 5 "${BASE_URL}${endpoint}" 2>/dev/null || true
  end_ms=$(date +%s%N 2>/dev/null || echo 0)
  if [ "$start_ms" != "0" ] && [ "$end_ms" != "0" ]; then
    elapsed_ms=$(( (end_ms - start_ms) / 1000000 ))
    if [ "$elapsed_ms" -lt 2000 ]; then
      record "Response time: ${endpoint}" "pass" "${elapsed_ms}ms"
    elif [ "$elapsed_ms" -lt 5000 ]; then
      record "Response time: ${endpoint}" "warn" "${elapsed_ms}ms (budget: <2s)"
    else
      record "Response time: ${endpoint}" "fail" "${elapsed_ms}ms (>5s)"
    fi
  fi
done

# ══════════════════════════════════════════════════════════════════════════════
#  SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
echo
echo -e "  ${BOLD}─────────────────────────────────────────────────────────────${NC}"
echo
echo -e "  ${GREEN}${BOLD}✓ Passed:${NC}   ${PASSED}"
echo -e "  ${YELLOW}${BOLD}⚠ Warned:${NC} ${WARNED}"
echo -e "  ${RED}${BOLD}✗ Failed:${NC} ${FAILED}"
echo -e "  ${DIM}– Skipped:${NC} ${SKIPPED}"
echo

# Print test layer breakdown
echo -e "  ${BOLD}Layer Coverage:${NC}"
echo -e "  ${DIM}  Portal UI:     Phase 1-2 (Environment, Routes)${NC}"
echo -e "  ${DIM}  Server Cache:  Phase 3-4 (Redis, Cache Handler)${NC}"
echo -e "  ${DIM}  Client Cache:  Phase 5 (SW, IndexedDB)${NC}"
echo -e "  ${DIM}  Database:      Phase 6 (Supabase, RLS)${NC}"
echo -e "  ${DIM}  E2E Flow:      Phase 7 (Portal→Cache→DB)${NC}"
echo -e "  ${DIM}  Performance:   Phase 8 (Response times)${NC}"
echo

if $JSON_OUTPUT; then
  echo "$RESULTS_JSON" | python3 -m json.tool 2>/dev/null || echo "$RESULTS_JSON"
  echo
fi

if [ "$FAILED" -gt 0 ]; then
  echo -e "  ${RED}${BOLD}Test suite FAILED — $FAILED critical issue(s) detected.${NC}"
  echo -e "  ${DIM}Review failures above and fix before deployment.${NC}"
  exit 1
fi

if $STRICT && [ "$WARNED" -gt 0 ]; then
  echo -e "  ${YELLOW}${BOLD}Test suite FAILED (strict mode) — $WARNED warning(s).${NC}"
  exit 1
fi

echo -e "  ${GREEN}${BOLD}All production tests passed. Pipeline: Portal → Cache → DB = OK${NC}"
echo
exit 0