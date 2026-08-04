#!/usr/bin/env bash
# retry-high-drift.sh - Handles automated retry when a drift score reaches critical level (>= 0.5)
#
# Looks for fields in .agents/AGENT_TRACER.md:
#   RETRY_COUNT: <number>
#   MAX_RETRIES: <number>
#   If DRift Score >= 0.5 and COUNT < MAX, increment count, sleep, and re-run itself.
#
# Used by check_context.sh when a critical drift is detected.

set -euo pipefail

TRACER_FILE=".agents/AGENT_TRACER.md"

if [[ ! -f "$TRACER_FILE" ]]; then
  echo "Error: $TRACER_FILE not found" >&2
  exit 1
fi

# Extract retry count and max retries
COUNT=$(grep -i '^RETRY_COUNT:' "$TRACER_FILE" | tail -1 | awk '{print $2}')
MAX=$(grep -i '^MAX_RETRIES:' "$TRACER_FILE" | tail -1 | awk '{print $2}')

# Initialize if missing
: "${COUNT:=0}"
: "${MAX:=1}"

if (( COUNT >= MAX )); then
  echo "Exceeded maximum retries ($MAX). Aborting further retries."
  exit 1
fi

# Increment count
NEW_COUNT=$((COUNT + 1))
echo "Retrying high-drift workflow (attempt $NEW_COUNT of $MAX)..."
sed -i "s/^RETRY_COUNT:.*/RETRY_COUNT: $NEW_COUNT/" "$TRACER_FILE"

# Simple back‑off (30 seconds) before retrying
echo "Sleeping 30 seconds before retry..."
sleep 30

# Re‑execute this script to trigger the next checkpoint
exec "$0"