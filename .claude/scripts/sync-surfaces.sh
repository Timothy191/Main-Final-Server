#!/usr/bin/env bash
# Sync .claude/ mirrors to .cursor/ canonical AI surfaces.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

mkdir -p .claude/skills .claude/agents .claude/rules

# Skills: symlink each .cursor/skills/* folder
for dir in .cursor/skills/*/; do
  [[ -d "$dir" ]] || continue
  name=$(basename "$dir")
  target=".claude/skills/$name"
  rm -f "$target"
  ln -s "../../cursor/skills/$name" "$target"
done

# Agents: symlink each .cursor/agents/*.md entry
rm -f .claude/agents/*.md
for entry in .cursor/agents/*.md; do
  [[ -f "$entry" ]] || continue
  name=$(basename "$entry")
  ln -s "../../cursor/agents/$name" ".claude/agents/$name"
done

# Rules: symlink each .cursor/rules/*.mdc (Cursor rule format) as .md
for rule in .cursor/rules/*.mdc; do
  [[ -f "$rule" ]] || continue
  name=$(basename "$rule" .mdc).md
  target=".claude/rules/$name"
  rm -f "$target"
  ln -s "../../cursor/rules/$(basename "$rule")" "$target"
done

echo "Synced .claude/ mirrors from .cursor/"
