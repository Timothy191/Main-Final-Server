#!/usr/bin/env bash
# ==============================================================================
# Script 3: AI-Integrated Local Live Next.js Launcher
# ==============================================================================
# 🤖 WHY AI IS REQUIRED FOR THIS NEXT.JS ARCHITECTURE:
# 1. Next.js AI Route Handlers (@ai-sdk/react / Vercel AI SDK):
#    The local live app runs server action endpoints and streaming chat API routes
#    that require active LLM model connections.
# 2. Local Production Health & Self-Healing Telemetry:
#    The AI agent runner continuously inspects local live server metrics and logs.
# 3. Dynamic Knowledge Processing:
#    Background tasks process operational data into local Knowledge Items (KI).
# ==============================================================================
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONOREPO_DIR="${PROJECT_ROOT}/monorepo"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"
MODE="${1:-dev}" # 'dev' or 'live'

echo "🤖 [AI NEXT.JS LAUNCHER] Initializing AI Agent Harness & Local Live Server..."
echo "📂 Project Root: ${PROJECT_ROOT}"
echo "🌐 Network Binding: http://${HOST}:${PORT} (Mode: ${MODE})"

cd "${MONOREPO_DIR}"

# 1. Verify Model Keys & Provider Setup
echo "🧠 Verifying AI Provider configuration..."
if [ -z "${OPENROUTER_API_KEY}" ] && [ -z "${OPENAI_API_KEY}" ] && [ -z "${ANTHROPIC_API_KEY}" ]; then
  echo "ℹ️  No cloud AI keys found. Falling back to local router..."
fi

# 2. Run AI Subsystem Readiness Check
if [ -f "scripts/ai.sh" ]; then
  echo "⚡ Executing AI Subsystem pre-flight checks..."
  bash scripts/ai.sh check || true
fi

# 3. Launch Local Live Next.js Application with AI Enabled
if [ "$MODE" = "live" ] || [ "$MODE" = "prod" ]; then
  echo "🚀 Launching Local Live Production Mode with AI Route Handlers..."
  NODE_ENV=production HOSTNAME="${HOST}" PORT="${PORT}" pnpm --filter portal start
else
  echo "🚀 Launching Local Live Development Mode with AI Route Handlers..."
  HOSTNAME="${HOST}" PORT="${PORT}" pnpm --filter portal dev
fi
