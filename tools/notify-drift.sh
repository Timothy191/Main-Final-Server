#!/usr/bin/env bash
# notify-drift.sh - Sends a notification if drift score meets threshold
#
# Reads the latest drift score from .agents/AGENT_TRACER.md
# Expects a line like: "DRIFT SCORE: 0.42"
# If score >= THRESHOLD (default 0.3) and DRIFT_ALERT_WEBHOOK is set,
# posts a JSON payload to the webhook.
#
# Usage: ./tools/notify-drift.sh [THRESHOLD]
#   THRESHOLD optional, default 0.3

set -euo pipefail

THRESHOLD=${1:-0.3}
TRACER_FILE=".agents/AGENT_TRACER.md"

if [[ ! -f "$TRACER_FILE" ]]; then
  echo "Error: $TRACER_FILE not found" >&2
  exit 1
fi

# Extract the latest drift score line (assuming format "DRIFT SCORE: 0.42")
SCORE_LINE=$(grep -i "DRIFT SCORE:" "$TRACER_FILE" | tail -n 1)
if [[ -z "$SCORE_LINE" ]]; then
  echo "No drift score found in $TRACER_FILE"
  exit 0
fi

# Extract numeric value (could be integer or decimal)
SCORE=$(echo "$SCORE_LINE" | grep -oE '[0-9]+(\.[0-9]+)?')
if [[ -z "$SCORE" ]]; then
  echo "Could not parse drift score from line: $SCORE_LINE"
  exit 1
fi

# Compare using bc for floating point
if (( $(echo "$SCORE >= $THRESHOLD" | bc -l) )); then
  WEBHOOK_URL="${DRIFT_ALERT_WEBHOOK_URL:-}"
  if [[ -z "$WEBHOOK_URL" ]]; then
    echo "Drift score $SCORE >= $THRESHOLD but DRIFT_ALERT_WEBHOOK_URL not set; skipping notification."
    exit 0
  fi
  # Prepare payload
  PAYLOAD=$(cat <<EOF
{
  "text": ":warning: *Drift Alert*: Drift score $SCORE (>= $THRESHOLD) detected. See $TRACER_FILE for details."
}
EOF
)
  echo "Sending drift alert for score $SCORE..."
  RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$WEBHOOK_URL" || true)
  echo "Notification sent. Response: $RESPONSE"
else
  echo "Drift score $SCORE below threshold $THRESHOLD; no alert sent."
fi
exit 0