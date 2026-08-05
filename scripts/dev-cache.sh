#!/usr/bin/env bash
# ==============================================================================
# Script 3: Cache Management for Redis Module
# ==============================================================================
# This script handles Redis cache operations for the native offline-first
# caching system with SQLite and AddressSanitizer support.
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONOREPO_DIR="${PROJECT_ROOT}"

# Set up environment
cd "${MONOREPO_DIR}"
echo "🔧 [CACHE MANAGEMENT] Preparing Redis cache environment..."

# Create cache directory structure if needed
CLOUD_DIR="${MONOREPO_DIR}/packages/redis/cloud"
mkdir -p "${CLOUD_DIR}/.cache" "${CLOUD_DIR}/.cache/state" "${CLOUD_DIR}/.cache/config"

# Initialize Redis cache module
echo "🔧 Initializing Redis cache module..."
if [ -d "${MONOREPO_DIR}/packages/redis/modules/redis-facil" ]; then
  cd "${MONOREPO_DIR}/packages/redis"
  make -C modules/redis-facil test_thread || echo "⚠️  Warning: Thread safety test failed"

  # Build module with ASan support
  echo "🔨 Building Redis module with AddressSanitizer..."
  make -C modules/redis-facil asan
fi

# Start Redis server with cache module loaded
echo "🚀 Starting Redis server with cache module..."
REDIS_PORT=6385
REDIS_SERVER_BIN="${MONOREPO_DIR}/packages/redis/redis-unstable/src/redis-server"
MODULE_PATH="${MONOREPO_DIR}/packages/redis/modules/redis-facil.so"

if [ -f "${REDIS_SERVER_BIN}" ] && [ -f "${MODULE_PATH}" ]; then
  "${REDIS_SERVER_BIN}" \
      --port "${REDIS_PORT}" \
      --loadmodule "${MODULE_PATH}" \
      dir="${CLOUD_DIR}" \
      port=8080 \
      &
else
  echo "⚠️  Redis server binary or custom module not found. Starting standard redis-server..."
  redis-server --port "${REDIS_PORT}" &
fi

REDIS_PID=$!

# Wait for Redis to start
echo "⏳ Waiting for Redis server to become available..."
sleep 5

# Test basic cache functionality
echo "🧪 Testing cache operations..."
redis-cli "CACHE.INIT" 2>/dev/null
redis-cli "CACHE.SET test_key 'test_value'" 2>/dev/null
redis-cli "CACHE.GET test_key" 2>/dev/null

# Test thread safety
echo "🔄 Running thread safety test..."
redis-cli "TEST_THREAD" 2>/dev/null || echo "⚠️  Test thread safety module not built"

# Clean up
kill $REDIS_PID 2>/dev/null || true
echo "✅ [CACHE MANAGEMENT] Setup complete. Use 'scripts/live-deployment.sh' for full deployment."

exit 0