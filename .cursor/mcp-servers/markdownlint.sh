#!/usr/bin/env bash
# Portable launcher for the markdownlint MCP server.
# Override install path by setting MARKDOWNLINT_MCP_HOME env var.
MARKDOWNLINT_MCP_HOME="${MARKDOWNLINT_MCP_HOME:-$HOME/.local/share/mcp-servers/markdownlint}"
exec node "$MARKDOWNLINT_MCP_HOME/dist/index.js"
