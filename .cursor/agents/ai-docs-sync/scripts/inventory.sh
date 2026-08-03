#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
echo "=== AI surfaces inventory ==="
find .cursor/rules .cursor/skills .cursor/agents .cursor/hooks.json .cursor/hooks \
     .cursor/standards .qoder/rules .qoder/skills \
     .claude .kiro/agents .kiro/templates \
     -type f 2>/dev/null | sort
echo ""
echo "=== Human docs ==="
ls -la AGENTS.md CLAUDE.md .kiro/README.md 2>/dev/null || true
