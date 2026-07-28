#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch Systems — Ops Babysitter Terminal Daemon
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORTAL_LOG="$REPO_ROOT/portal.log"

echo -e "\033[1;36m  🔍 Ops Babysitter Active — Monitoring Logs & Cache Drift...\033[0m"
echo "  Watching: $PORTAL_LOG"
echo "  Press [CTRL+C] to exit."
echo

# Ensure log file exists
touch "$PORTAL_LOG"

# Tail portal logs and intercept anomalies
tail -n 0 -F "$PORTAL_LOG" | while read -r line; do
  # Print the log line to stdout
  echo "$line"

  # Match warnings or errors to trigger self-healing
  if [[ "$line" == *"ERROR"* ]] || [[ "$line" == *"WARN"* ]]; then
    # Grab the exception type or route if present in log
    EXTRACTED_TYPE="system_error"
    if [[ "$line" == *"cache"* ]]; then
      EXTRACTED_TYPE="cache_invalidation"
    elif [[ "$line" == *"drift"* ]] || [[ "$line" == *"schema"* ]]; then
      EXTRACTED_TYPE="db_drift"
    fi

    echo -e "\033[1;33m  [Babysitter Warning] Anomaly detected in logs. Triggering Mini-SWE-Agent self-healing...\033[0m"
    
    # Trigger in-process self-healing via the HTTP event API endpoint
    curl -s -X POST "http://localhost:3000/api/ops/trigger" \
      -H "Content-Type: application/json" \
      -d "{\"triggerType\": \"${EXTRACTED_TYPE}\", \"severity\": \"warning\", \"context\": {\"logSnippet\": \"${line:0:100}\"}}" >/dev/null 2>&1 || true
  fi
done
