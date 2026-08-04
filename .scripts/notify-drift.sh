#!/usr/bin/env bash
# notify-drift.sh - Sends a notification to a webhook when drift score exceeds threshold
#
# This script expects two arguments:
#   $1 - DRIFT_SCORE: The current drift score to evaluate
#   $2 - WEBHOOK_URL: The webhook URL to send notifications to
#
# If DRIFT_SCORE >= 0.3 (the threshold), it sends a notification to WEBHOOK_URL.
#
# Usage: ./.scripts/notify-drift.sh <DRIFT_SCORE> <WEBHOOK_URL>

set -euo pipefail

# Validate inputs
if [[ $# -ne 2 ]]; then
  echo "Error: Usage: ./.scripts/notify-drift.sh <DRIFT_SCORE> <WEBHOOK_URL>"
  exit 1
fi

DRIFT_SCORE=$1
WEBHOOK_URL=$2

# Validate numeric score
if ! [[ "$DRIFT_SCORE" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
  echo "Error: Invalid drift score '$DRIFT_SCORE'. Must be a positive number."
  exit 1
fi

# Validate webhook URL
if [[ ! "$WEBHOOK_URL" =~ ^https?:// ]]; then
  echo "Error: Invalid webhook URL '$WEBHOOK_URL'. Must be a valid HTTP/HTTPS URL."
  exit 1
fi

# Check if threshold is exceeded (threshold = 0.3)
THRESHOLD=0.3
if (( $(echo "$DRIFT_SCORE >= $THRESHOLD" | bc -l) )); then
  echo "Drift score $DRIFT_SCORE >= threshold $THRESHOLD. Sending notification to webhook."

  # Prepare JSON payload for Slack/Teams style webhook
  PAYLOAD=$(cat <<EOF
{
  "text": ":warning: **Drift Alert**: Drift score $DRIFT_SCORE (>= $THRESHOLD) detected.",
  "attachments": [
    {
      "color": "warning",
      "fields": [
        {
          "title": "Drift Score",
          "value": "$DRIFT_SCORE",
          "short": true
        },
        {
          "title": "Threshold",
          "value": "$THRESHOLD",
          "short": true
        },
        {
          "title": "Action Required",
          "value": "Check ./.agents/AGENT_TRACER.md for details.",
          "short": false
        }
      ],
      "ts": $(date +%s)
    }
  ]
}
EOF
)

  # Send webhook notification
  HTTP_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/webhook-response.json -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$WEBHOOK_URL" 2>/dev/null)

  HTTP_CODE=${HTTP_RESPONSE: -3}
  RESPONSE_BODY=$(cat /tmp/webhook-response.json 2>/dev/null || echo "{}")

  # Check if webhook was successful
  if [[ "$HTTP_CODE" =~ ^2[0-9][0-9]$ ]]; then
    echo "✓ Notification sent successfully (HTTP $HTTP_CODE)."
  else
    echo "❌ Notification failed (HTTP $HTTP_CODE). Response: $RESPONSE_BODY"
    exit 1
  fi
else
  echo "Drift score $DRIFT_SCORE is below threshold $THRESHOLD. No notification sent."
fi

exit 0