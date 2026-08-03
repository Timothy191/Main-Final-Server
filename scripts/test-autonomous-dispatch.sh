#!/usr/bin/env bash
# Autonomous Agent Dispatcher - Diagnostic & Test Runner
# Verifies that keys, context (OpenSpec, ACI, KB), MCP servers, and LSPs are fully wired.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "============================================================"
echo "      Autonomous Agent Dispatcher - Diagnostic Check        "
echo "============================================================"

# 1. Check API Key Pool Configuration (Masked for Security)
echo -n "[1/4] Checking API key pools: "
if [[ -f ".env" ]]; then
  # Load env vars safely without printing them
  set +e
  # Read keys without printing them
  key_pool=$(grep "^OPENROUTER_KEY_POOL=" .env | cut -d'=' -f2- || echo "")
  set -e
  
  if [[ -n "$key_pool" ]]; then
    # Count comma-separated keys
    key_count=$(echo "$key_pool" | tr ',' '\n' | grep -c '^' || echo 0)
    echo -e "\e[32mOK\e[0m (Found $key_count keys in OPENROUTER_KEY_POOL)"
  else
    echo -e "\e[33mWARN\e[0m (OPENROUTER_KEY_POOL is empty or unset)"
  fi
else
  echo -e "\e[31mFAIL\e[0m (Missing .env file)"
fi

# 2. Check MCP Server Readiness
echo -n "[2/4] Checking MCP servers: "
set +e
active_mcp=$(bash scripts/mcp-manager.sh status | grep -c "\[OK\]")
set -e
if [[ "$active_mcp" -gt 0 ]]; then
  echo -e "\e[32mOK\e[0m ($active_mcp MCP servers running)"
else
  echo -e "\e[33mWARN\e[0m (0 MCP servers running. Standard profiles are ready to start)"
fi

# 3. Check LSP Context Providers
echo -n "[3/4] Checking Language Servers: "
set +e
active_lsps=$(bash scripts/lsp-router.sh status | grep -c -E "(typescript|gopls|python)")
set -e
if [[ "$active_lsps" -gt 0 ]]; then
  echo -e "\e[32mOK\e[0m ($active_lsps LSPs detected)"
else
  echo -e "\e[33mWARN\e[0m (No LSPs running in PATH)"
fi

# 4. Dry-Run Context Assembly Verification
echo "[4/4] Verifying Context Assembly (Dry-Run)..."
kb_file="${ROOT}/.cursor/agents/_shared/references/knowledge-base.md"
aci_file="${ROOT}/.cursor/agents/_shared/references/agent-computer-interface.md"

if [[ -f "$kb_file" && -f "$aci_file" ]]; then
  echo -e "\e[32mOK\e[0m (Agent Knowledge Base & ACI rules present)"
  # Print preview of injected system instructions
  echo "--- System Prompt Context Preview ---"
  echo "# System Rules:"
  head -n 5 "$kb_file"
  echo "..."
  head -n 5 "$aci_file"
  echo "-------------------------------------"
else
  echo -e "\e[31mFAIL\e[0m (Missing context reference files)"
  exit 1
fi

echo "Diagnostic complete: Agent delegation pipeline is ready for autonomous dispatch."
