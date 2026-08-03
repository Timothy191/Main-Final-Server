#!/usr/bin/env bash
exec "$(git rev-parse --show-toplevel)/.cursor/standards/claude-code/scripts/validate-claude-code.sh" "$@"
