#!/usr/bin/env bash
set -euo pipefail
curl -fs "http://localhost:${PORT:-3000}/api/health" 2>/dev/null && echo "Already running" || echo "Not running"
