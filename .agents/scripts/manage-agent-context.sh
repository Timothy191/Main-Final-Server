#!/usr/bin/env bash

# Centralized Agent Context Manager
# Manages fetching and cleaning of rules/skills to prevent IDE context bloat.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
AGENTS_DIR="${REPO_ROOT}/.agents"
CURSOR_RULES_DIR="${REPO_ROOT}/.cursor/rules"
CONTINUE_RULES_DIR="${REPO_ROOT}/.continue/rules"

usage() {
  echo "Usage: $0 [load|clean|list]"
  echo "  load <rule-or-skill-name>...  Copies specified rules/skills into active IDE directories."
  echo "  clean                         Removes all active rules/skills from IDE directories."
  echo "  list                          Lists all available rules and skills in the registry."
  exit 1
}

if [ $# -lt 1 ]; then
  usage
fi

ACTION="$1"
shift

case "${ACTION}" in
  load)
    if [ $# -lt 1 ]; then
      echo "Error: Specify at least one rule or skill name to load."
      usage
    fi
    mkdir -p "${CURSOR_RULES_DIR}" "${CONTINUE_RULES_DIR}"
    for name in "$@"; do
      found=false
      # Search in .agents/rules/
      for file in "${AGENTS_DIR}/rules"/*"${name}"*; do
        if [ -f "$file" ]; then
          filename=$(basename "$file")
          echo "Fetching rule: ${filename}"
          if [[ "$filename" == *.mdc ]]; then
            cp "$file" "${CURSOR_RULES_DIR}/"
          else
            cp "$file" "${CONTINUE_RULES_DIR}/"
          fi
          found=true
        fi
      done
      
      # Search in .agents/skills/
      for dir in "${AGENTS_DIR}/skills"/*"${name}"*; do
        if [ -d "$dir" ] && [ -f "${dir}/SKILL.md" ]; then
          filename="$(basename "$dir").md"
          echo "Fetching skill: ${filename}"
          cp "${dir}/SKILL.md" "${CONTINUE_RULES_DIR}/${filename}"
          found=true
        fi
      done
      
      if [ "$found" = false ]; then
        echo "Warning: No matching rule or skill found for '${name}'"
      fi
    done
    echo "Active context loaded successfully."
    ;;

  clean)
    echo "Discarding all active rules and skills from IDE folders to prevent context bloat..."
    rm -rf "${CURSOR_RULES_DIR}"/*
    rm -rf "${CONTINUE_RULES_DIR}"/*
    # Re-create empty directories
    mkdir -p "${CURSOR_RULES_DIR}" "${CONTINUE_RULES_DIR}"
    # Keep gitignore or placeholder if needed
    touch "${CURSOR_RULES_DIR}/.gitkeep" "${CONTINUE_RULES_DIR}/.gitkeep"
    echo "IDE active directories cleaned."
    ;;

  list)
    echo "=== Available Rules (in .agents/rules/) ==="
    ls -1 "${AGENTS_DIR}/rules"
    echo ""
    echo "=== Available Skills (in .agents/skills/) ==="
    ls -1 "${AGENTS_DIR}/skills"
    ;;

  *)
    usage
    ;;
esac
