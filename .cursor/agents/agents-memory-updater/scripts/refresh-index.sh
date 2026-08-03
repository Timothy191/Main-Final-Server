#!/usr/bin/env bash
# Refresh continual-learning index with current mtimes

INDEX_FILE="/home/timothy/Projects/.cursor/hooks/state/continual-learning-index.json"
TRANSCRIPT_DIR="${1:-$HOME/.local/share/devin/sessions/}"

# Create new index object with structure
NEW_INDEX=$(jq '{"version":1,"lastUpdated":'$(date +%s)000',"transcripts":{}}' <<< '{}')

# Process all transcripts
find "$TRANSCRIPT_DIR" -name "*.json" -o -name "*.md" 2>/dev/null | while read -r transcript; do
  MTIME=$(stat -c %Y "$transcript" 2>/dev/null || echo "0")
  NEW_INDEX=$(jq --arg path "$transcript" --argjson mtime "$MTIME" '.transcripts[$path] = $mtime' <<< "$NEW_INDEX")
done

# Write new index
echo "$NEW_INDEX" > "$INDEX_FILE"
echo "Index refreshed at $INDEX_FILE"
