#!/usr/bin/env bash
# Load or create continual-learning index file

INDEX_FILE="/home/timothy/Projects/.cursor/hooks/state/continual-learning-index.json"

if [ ! -f "$INDEX_FILE" ]; then
  echo '{"version":1,"lastUpdated":0,"transcripts":{}}' > "$INDEX_FILE"
  echo "Created new index at $INDEX_FILE"
fi

cat "$INDEX_FILE"
