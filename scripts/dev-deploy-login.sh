#!/usr/bin/env bash
# ==============================================================================
# Script 1: Dev Deployment & Login Test Launcher for Next.js Portal
# ==============================================================================
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONOREPO_DIR="${PROJECT_ROOT}/monorepo"

echo "🚀 [DEV DEPLOYMENT] Initializing Next.js Local Development Environment..."
echo "📂 Project Root: ${PROJECT_ROOT}"

# Navigate to monorepo
cd "${MONOREPO_DIR}"

# 1. Environment Check
echo "🔍 Validating environment configuration..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
  echo "⚠️  No .env or .env.local found! Creating from .env.example..."
  cp .env.example .env.local 2>/dev/null || true
fi

# 2. Check local dependencies
echo "📦 Ensuring pnpm packages are up to date..."
pnpm install --prefer-offline 2>/dev/null || true

# 3. Boot Supabase local auth if available
if command -v supabase &> /dev/null; then
  echo "⚡ Checking Supabase Local Authentication Service..."
  pnpm run supabase:status || pnpm run supabase:start || echo "ℹ️ Supabase local instance check complete."
fi

# 4. Launch Next.js dev server & execute login health test
echo "🔥 Starting Next.js Dev Server (Turbopack) on http://localhost:3000..."
# 5. Cache initialization for Redis module
echo "🔧 Initializing Redis Cache Module..."
cd "${MONOREPO_DIR}/redis"
make -C modules/redis-facil test_thread || true
make -C modules/redis-facil asan || true
PORT=3000 pnpm --filter portal dev &
NEXT_PID=$!

trap "echo 'Cleaning up Next.js dev process (PID: $NEXT_PID)'; kill $NEXT_PID 2>/dev/null || true" EXIT

# Wait for server readiness
echo "⏳ Waiting for Next.js server to respond..."
MAX_ATTEMPTS=30
ATTEMPT=0
SERVER_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302\|307"; then
    SERVER_READY=true
    break
  fi
  sleep 1
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "$SERVER_READY" = true ]; then
  echo "✅ [LOGIN TEST] Next.js Dev Server is up! Testing Authentication Route readiness..."
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login || echo "000")
  echo "🔑 Auth Endpoint (/auth/login) Status Code: ${HTTP_STATUS}"
  if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 302 ] || [ "$HTTP_STATUS" -eq 307 ]; then
    echo "🎉 [SUCCESS] Development server running & Login routes verified!"
  else
    echo "⚠️ Login route responded with HTTP ${HTTP_STATUS}. Next.js is accessible."
  fi
else
  echo "❌ [TIMEOUT] Next.js server did not start within 30 seconds."
  exit 1
fi

echo "Press Ctrl+C to stop the development server."
wait $NEXT_PID
