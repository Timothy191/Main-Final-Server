#!/usr/bin/env bash
set -euo pipefail

# Registry.sh: Generate a dependency map of the monorepo
# Uses LSP references to map file dependencies.

ROOT="$(git rev-parse --show-toplevel)"
MAP_FILE="${ROOT}/.repo-map.json"

echo "Generating dependency map..."

# Initialize JSON map
echo "{}" > "$MAP_FILE"

# Find all TS/TSX files
files=$(find "${ROOT}/apps" "${ROOT}/packages" -name "*.ts" -o -name "*.tsx")

for file in $files; do
  # Use LSP to get references for the file itself (as an export map)
  # This is a conceptual approximation. In reality, we need 
  # to map file exports -> call sites.
  
  # Placeholder for complex LSP reference resolution logic
  # For now, we store basic file association.
  echo "Mapping: $file"
  
  # Update map using temporary file
  tmp=$(mktemp)
  jq --arg f "$file" '. + {($f): []}' "$MAP_FILE" > "$tmp"
  mv "$tmp" "$MAP_FILE"
done

echo "Dependency map generated at $MAP_FILE"
