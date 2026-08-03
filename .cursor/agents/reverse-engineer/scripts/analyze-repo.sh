#!/usr/bin/env bash
set -euo pipefail

# Helper script for automated temp-cloning, codebase analysis, testing, and addition mapping
REPO_URL="${1:-}"

if [ -z "$REPO_URL" ]; then
  echo "Usage: $0 <github-repo-url> [target-dir-name]"
  echo "Example: $0 https://github.com/example/repo example-repo"
  exit 1
fi

REPO_NAME="${2:-$(basename "$REPO_URL" .git)}"
TEMP_DIR="/tmp/reverse-engineer/${REPO_NAME}"

echo "=== Step 1: Ingesting repository into temporary workspace ==="
mkdir -p /tmp/reverse-engineer
if [ -d "$TEMP_DIR" ]; then
  echo "Cleaning pre-existing temp directory: $TEMP_DIR"
  rm -rf "$TEMP_DIR"
fi

echo "Cloning $REPO_URL to $TEMP_DIR..."
git clone --depth 1 "$REPO_URL" "$TEMP_DIR"

echo "=== Step 2: Codebase Structure Overview ==="
cd "$TEMP_DIR"
echo "Directory structure (top 2 levels):"
find . -maxdepth 2 -not -path '*/.*'

echo "=== Step 3: Inspecting dependencies & build configuration ==="
if [ -f "package.json" ]; then
  echo "package.json detected:"
  grep -E '"name"|"version"|"scripts"|"dependencies"|"devDependencies"' package.json -A 10 || head -n 30 package.json
fi

echo "=== Step 4: Running automated tests / verification if scripts exist ==="
if [ -f "package.json" ]; then
  if grep -q '"test"' package.json; then
    echo "Running test suite in temp workspace..."
    pnpm test --passWithNoTests 2>/dev/null || npm test 2>/dev/null || echo "Test execution finished with warnings/errors"
  fi
fi

echo "=== Analysis complete for $REPO_NAME in $TEMP_DIR ==="
