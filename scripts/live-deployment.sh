#!/usr/bin/env bash
# ==============================================================================
# Script 2: Local Live Production Deployment Launcher for Next.js Portal
# ==============================================================================
# Performs a production-grade live deployment on the local network (0.0.0.0:3000).
# Reachable by all devices connected to the same Wi-Fi / Local Area Network (LAN).
# ==============================================================================
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONOREPO_DIR="${PROJECT_ROOT}/monorepo"

HOST="0.0.0.0"
PORT="${PORT:-3000}"

# Auto-detect local network (LAN) IP address
LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}' || echo "localhost")

echo "🌍 [LOCAL LIVE NETWORK DEPLOYMENT] Initializing Deployment..."
echo "📂 Project Root: ${PROJECT_ROOT}"
echo "🌐 Bound Network Interface: http://${HOST}:${PORT}"
echo "📱 Local Network (LAN) URL for other devices: http://${LAN_IP}:${PORT}"

cd "${MONOREPO_DIR}"

# 1. Environment Verification
echo "🛡️  Configuring Local Live Production Environment..."
if [ -f ".env.production" ]; then
  echo "📄 Loading .env.production..."
  set -a; source .env.production; set +a
elif [ -f ".env.local" ]; then
  echo "📄 Loading .env.local..."
  set -a; source .env.local; set +a
fi

# 2. Pre-flight Quality Verification
echo "🧪 Running Quality Assurance Checks (Type-Check & Lint)..."
pnpm --filter portal type-check
pnpm --filter portal lint

# 4. Compile Production Next.js Bundle
echo "🏗️  Building Optimized Production Next.js Bundle..."
NODE_ENV=production pnpm --filter portal build

# 4.5. Cache initialization for Redis module
echo "🔧 Initializing Redis Cache Module..."
if [ -d "${PROJECT_ROOT}/redis" ]; then
  cd "${PROJECT_ROOT}/redis"
  make -C modules/redis-facil test_thread || true
  make -C modules/redis-facil asan || true
  cd "${MONOREPO_DIR}"
fi

# 5. Start Next.js Production Server bound to 0.0.0.0 (all interfaces)
echo "🚀 Launching Production Server on http://0.0.0.0:${PORT}..."
echo "📱 Other devices on your Wi-Fi/LAN can access the app at: http://${LAN_IP}:${PORT}"

NODE_ENV=production HOSTNAME="${HOST}" PORT="${PORT}" pnpm --filter portal start &
SERVER_PID=$!

trap "echo 'Stopping local network server (PID: $SERVER_PID)'; kill $SERVER_PID 2>/dev/null || true" EXIT

# 5. Local Live Health Check Verification
echo "⏳ Verifying server health at http://localhost:${PORT}..."
MAX_ATTEMPTS=20
ATTEMPT=0
LIVE_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}" | grep -q "200\|302\|307"; then
    LIVE_READY=true
    break
  fi
  sleep 1
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "$LIVE_READY" = true ]; then
  echo "========================================================================="
  echo "🎉 [SUCCESS] Next.js Local Live Deployment is UP and RUNNING!"
  echo "💻 Host Machine URL:      http://localhost:${PORT}"
  echo "📱 LAN / Network URL:     http://${LAN_IP}:${PORT}"
  echo "========================================================================="
else
  echo "⚠️ Warning: Health check did not receive HTTP 200/302 within 20s, server process PID: $SERVER_PID"
fi

echo "Press Ctrl+C to shut down the local live deployment."
wait $SERVER_PID
