#!/bin/bash
# Doctrine Compliance Enforcement Hook Script
# Enforces "No emojis in commits, comments, or professional output" rule.

set -e

# Regex for emojis (covers Unicode Emoji, Pictographs, Symbols, and Emoticons)
EMOJI_REGEX=$'[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF\u2300-\u23FF\u2B50\u2B06\u2190-\u21FF]'

# Mode 1: Commit Message Validation
if [ "$1" == "--commit-msg" ]; then
  COMMIT_MSG_FILE="$2"
  if [ -f "$COMMIT_MSG_FILE" ]; then
    COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")
    # Check for emojis in commit message
    if echo "$COMMIT_MSG" | grep -qE "$EMOJI_REGEX" 2>/dev/null; then
      echo "❌ FAIL: Commit message contains emojis (violates Doctrine Professional Communication rule)"
      echo "  Message: \"$COMMIT_MSG\""
      exit 1
    fi
  fi
  exit 0
fi

# Mode 2: Staged Files Comment Validation
echo "=== Doctrine Compliance Checks ==="

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

EMOJI_FOUND=0

for file in $STAGED_FILES; do
  # Check only TS/JS source files
  if [[ "$file" =~ \.(ts|tsx|js|jsx|mjs|cjs)$ ]]; then
    # Extract only the added lines (lines starting with + but not +++)
    ADDED_LINES=$(git diff --cached "$file" | grep -E '^\+[^+]' | sed 's/^+//' || true)
    
    if [ -n "$ADDED_LINES" ]; then
      # Check if any added comment contains emojis
      # Matches comments: // ... or /* ... or * ... (within comment blocks)
      COMMENT_EMOJIS=$(echo "$ADDED_LINES" | grep -E '(//|/\*|\*)' | grep -E "$EMOJI_REGEX" || true)
      
      if [ -n "$COMMENT_EMOJIS" ]; then
        echo "❌ FAIL: Emojis detected in added comments inside file: $file"
        echo "  Lines:"
        echo "$COMMENT_EMOJIS" | sed 's/^/    /'
        EMOJI_FOUND=1
      fi
    fi
  fi
done

if [ "$EMOJI_FOUND" -ne 0 ]; then
  exit 1
fi

echo "  ✓ PASS: No emojis detected in staged comments or code."
exit 0
