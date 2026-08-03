#!/usr/bin/env bash
# LSP Router — detect and start language servers for agent delegation
# JSON parsing via python3 (always available)
# Usage:
#   lsp-router.sh status        # List detected LSP servers
#   lsp-router.sh start <lang>  # Start LSP for specific language
#   lsp-router.sh start --all   # Start all detected LSP servers
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"

MODE="${1:-status}"

# ── Detect available LSP servers ──
detect_lsp() {
  local servers_json="{"

  # TypeScript / JavaScript
  local ts_ls=""
  if command -v typescript-language-server &>/dev/null; then
    ts_ls="typescript-language-server"
  elif [[ -f "${ROOT}/node_modules/.bin/typescript-language-server" ]]; then
    ts_ls="${ROOT}/node_modules/.bin/typescript-language-server"
  elif [[ -f "${ROOT}/apps/portal/node_modules/.bin/typescript-language-server" ]]; then
    ts_ls="${ROOT}/apps/portal/node_modules/.bin/typescript-language-server"
  fi
  if [[ -n "$ts_ls" ]]; then
    servers_json="${servers_json}\"typescript\":{\"command\":\"${ts_ls}\",\"args\":[\"--stdio\"],\"languages\":[\"typescript\",\"javascript\",\"typescriptreact\",\"javascriptreact\"]},"
    servers_json="${servers_json}\"javascript\":{\"command\":\"${ts_ls}\",\"args\":[\"--stdio\"],\"languages\":[\"javascript\",\"javascriptreact\"]},"
  fi

  # Go
  if command -v gopls &>/dev/null; then
    servers_json="${servers_json}\"go\":{\"command\":\"gopls\",\"args\":[\"serve\"],\"languages\":[\"go\"]},"
  fi

  # Python
  if command -v pyright &>/dev/null; then
    servers_json="${servers_json}\"python\":{\"command\":\"pyright\",\"args\":[\"--stdio\"],\"languages\":[\"python\"]},"
  elif command -v pylsp &>/dev/null; then
    servers_json="${servers_json}\"python\":{\"command\":\"pylsp\",\"args\":[],\"languages\":[\"python\"]},"
  fi

  # Rust
  if command -v rust-analyzer &>/dev/null; then
    servers_json="${servers_json}\"rust\":{\"command\":\"rust-analyzer\",\"args\":[],\"languages\":[\"rust\"]},"
  fi

  # JSON
  if [[ -f "${ROOT}/node_modules/.bin/vscode-json-languageserver" ]]; then
    servers_json="${servers_json}\"json\":{\"command\":\"${ROOT}/node_modules/.bin/vscode-json-languageserver\",\"args\":[\"--stdio\"],\"languages\":[\"json\"]},"
  fi

  # YAML
  if [[ -f "${ROOT}/node_modules/.bin/yaml-language-server" ]]; then
    servers_json="${servers_json}\"yaml\":{\"command\":\"${ROOT}/node_modules/.bin/yaml-language-server\",\"args\":[\"--stdio\"],\"languages\":[\"yaml\"]},"
  fi

  # Remove trailing comma, close JSON
  servers_json="${servers_json%,}}"
  echo "$servers_json"
}

# ── LSP context for agent injection ──
lsp_context() {
  local tmpf; tmpf="$(mktemp /tmp/lsp-ctx-XXXXXX.json)"
  detect_lsp > "$tmpf"
  python3 -c "
import json
with open('${tmpf}') as f:
    d = json.load(f)
for k,v in d.items():
    cmd = v.get('command','')
    langs = ', '.join(v.get('languages',[]))
    print(f'- {k}: {cmd} ({langs})')
" 2>/dev/null || echo "No language servers available."
  rm -f "$tmpf"
}


# ── Commands ──
cmd_status() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║          LSP Router — Detected Language Servers         ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  local detected; detected="$(detect_lsp)"

  # Count entries via python3
  local count; count="$(python3 -c "
import json,sys
print(len(json.loads(sys.stdin.read())))
" <<< "$detected" 2>/dev/null || echo 0)"

  if [[ "$count" -eq 0 ]]; then
    echo "  No language servers detected."
    echo ""
    echo "  Install via:"
    echo "    pnpm add -g typescript-language-server"
    echo "    sudo apt install gopls"
    echo "    pip install python-lsp-server"
    echo ""
    return
  fi

  # Display each server
  python3 -c "
import json,sys
d=json.loads(sys.stdin.read())
for k,v in d.items():
    langs=', '.join(v.get('languages',[]))
    print(f'  {k}: {v.get(\"command\",\"\")} ({langs})')
" <<< "$detected" 2>/dev/null
  echo ""
  echo "  ${count} language server(s) available"
  echo ""
}

cmd_start() {
  local lang="${1:-}"
  local detected; detected="$(detect_lsp)"

  if [[ -z "$lang" ]] || [[ "$lang" == "--all" ]]; then
    echo "Starting all detected LSP servers..."
    # Parse into pipe-separated records and iterate
    while IFS='|' read -r l cmd args_str; do
      [[ -z "$l" ]] && continue
      echo "  🚀 lsp-${l}: ${cmd} ${args_str}"
    done < <(python3 -c "
import json,sys
d=json.loads(sys.stdin.read())
for k,v in d.items():
    args=' '.join(v.get('args',[]))
    print(f'{k}|{v.get(\"command\",\"\")}|{args}')
" <<< "$detected" 2>/dev/null || true)
    echo "  Note: Language servers run in-process per agent, not as services."
    echo "  The 'lsp' tool device handles this automatically."
    return
  fi

  local cmd; cmd="$(python3 -c "
import json,sys
d=json.loads(sys.stdin.read())
print(d.get('${lang}',{}).get('command',''))
" <<< "$detected" 2>/dev/null || true)"
  if [[ -z "$cmd" ]]; then
    local known; known="$(python3 -c "
import json,sys
d=json.loads(sys.stdin.read())
print(' '.join(d.keys()))
" <<< "$detected" 2>/dev/null || true)"
    echo "  Unknown language: ${lang}. Known: ${known}"
    exit 1
  fi
  echo "  ✅ LSP available for ${lang}: ${cmd}"
}

# ── Main ──
case "$MODE" in
  status|--status|-s)
    cmd_status
    ;;
  start|--start)
    shift || true
    cmd_start "$@"
    ;;
  context)
    lsp_context
    ;;
  *)
    echo "Usage: $0 {status|start|context}"
    exit 1
    ;;
esac
