#!/usr/bin/env bash
# Extract high-signal patterns from transcript files

TRANSCRIPT_DIR="${1:-$HOME/.local/share/devin/sessions/}"
INDEX_FILE="/home/timothy/Projects/.cursor/hooks/state/continual-learning-index.json"

# Create temp output for signals
SIGNALS_OUTPUT=$(mktemp)

# Process transcripts
find "$TRANSCRIPT_DIR" -name "*.json" -o -name "*.md" 2>/dev/null | while read -r transcript; do
  # Check if file is newer than index entry
  TRANSCRIPT_MTIME=$(stat -c %Y "$transcript" 2>/dev/null || echo "0")
  INDEXED_MTIME=$(jq -r --arg path "$transcript" '.transcripts[$path] // 0' "$INDEX_FILE" 2>/dev/null || echo "0")

  if [ "$TRANSCRIPT_MTIME" -gt "$INDEXED_MTIME" ]; then
    echo "Processing: $transcript"
    # Extract patterns (simplified - actual implementation would use NLP/pattern matching)
    # Look for user corrections, preferences, explicit statements
    grep -i "actually\|prefer\|always\|never\|remember\|don't.*that" "$transcript" 2>/dev/null >> "$SIGNALS_OUTPUT" || true
  fi
done

cat "$SIGNALS_OUTPUT"
rm -f "$SIGNALS_OUTPUT"
