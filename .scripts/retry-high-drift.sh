#!/usr/bin/env bash
# retry-high-drift.sh - Executes automated retry logic when drift reaches critical level
#
# This script should be called when drift score >= 0.5 (critical threshold).
# It increments the RETRY_COUNT in AGENT_TRACER.md and re-runs the checkpoint process.
#
# Usage: ./.scripts/retry-high-drift.sh <DRIFT_SCORE>

set -euo pipefail

# Validate input
if [[ $# -ne 1 ]]; then
  echo "Error: Usage: ./.scripts/retry-high-drift.sh <DRIFT_SCORE>"
  exit 1
fi

DRIFT_SCORE=$1

# Validate drift score
if ! [[ "$DRIFT_SCORE" =~ ^[0-9]+(\.[0-9]+)?$ ]] || (( $(echo "$DRIFT_SCORE < 0.5" | bc -l) )); then
  echo "Error: Invalid or non-critical drift score '$DRIFT_SCORE'. Must be >= 0.5 for retry to be triggered."
  exit 1
fi

TRACER_FILE=".agents/AGENT_TRACER.md"

if [[ ! -f "$TRACER_FILE" ]]; then
  echo "Error: $TRACER_FILE not found. Cannot retry without a tracer file."
  exit 1
fi

# Read existing retry count and max retries
EXISTING_COUNT=$(grep -i "^RETRY_COUNT:" "$TRACER_FILE" 2>/dev/null | tail -n 1 | awk '{print $2}' || echo "0")
MAX_RETRIES=$(grep -i "^MAX_RETRIES:" "$TRACER_FILE" 2>/dev/null | tail -n 1 | awk '{print $2}' || echo "1")

# Initialize values if not found
: "${EXISTING_COUNT:=0}"
: "${MAX_RETRIES:=1}"

echo "High drift score detected: $DRIFT_SCORE"
echo "Retry count: $EXISTING_COUNT / $MAX_RETRIES"

# Check if we've exceeded max retries
if [[ "$EXISTING_COUNT" -ge "$MAX_RETRIES" ]]; then
  echo "❌ MAXIMUM RETRIES ($MAX_RETRIES) EXCEEDED."
  echo "Manual intervention required. Please review the drift causing changes."
  echo "Suggested actions:"
  echo "  1. Re-examine scope deviation in AGENT_TRACER.md"
  echo "  2. Escalate to project lead if necessary"
  echo "  3. Consider creating a new checkpoint with corrected scope"
  exit 1
fi

# Increment retry count
NEW_COUNT=$((EXISTING_COUNT + 1))
echo "🔄 Initiating retry #$NEW_COUNT of $MAX_RETRIES..."

# Update the retry count in the tracer file
if grep -q "^RETRY_COUNT:" "$TRACER_FILE"; then
  sed -i "s/^RETRY_COUNT:.*/RETRY_COUNT: $NEW_COUNT/" "$TRACER_FILE"
else
  echo "RETRY_COUNT: $NEW_COUNT" >> "$TRACER_FILE"
fi

# Add timestamp for last retry
RETRY_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
if grep -q "^LAST_RETRY_TS:" "$TRACER_FILE"; then
  sed -i "s/^LAST_RETRY_TS:.*/LAST_RETRY_TS: $RETRY_TS/" "$TRACER_FILE"
else
  echo "LAST_RETRY_TS: $RETRY_TS" >> "$TRACER_FILE"
fi

echo "Last retry timestamp: $RETRY_TS"

# Apply exponential back-off (30 seconds per retry level)
BACKOFF=$((30 * NEW_COUNT))
echo "Sleeping for $BACKOFF seconds (back-off period)..."
sleep "$BACKOFF"

echo "🔄 Retry complete. Re-running checkpoint process..."
# Re-execute the main check script
exec "$PWD/.scripts/check_context.sh"