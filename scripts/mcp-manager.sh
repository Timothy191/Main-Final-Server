#!/usr/bin/env bash
# MCP Manager — lifecycle for Model Context Protocol servers
# JSON parsing via python3 (reliable, always available)
# Usage:
#   mcp-manager.sh list             # List all servers + status
#   mcp-manager.sh start [name]     # Start server(s) — omit name = all auto-start
#   mcp-manager.sh stop [name]      # Stop server(s)
#   mcp-manager.sh status           # Show running MCP servers
#   mcp-manager.sh profile <name>   # Start servers in a named profile
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"

MCP_REGISTRY="${ROOT}/.cursor/mcp-servers.json"
MODE="${1:-list}"

# Source .env for API keys
if [[ -f "${ROOT}/.env" ]]; then
  set -a; source "${ROOT}/.env"; set +a
fi

# ── JSON helper — uses python3 (always available, no path issues) ──
py_json() {
  local file="$1"; shift
  local expr="$1"; shift
  python3 -c "
import json,sys
with open('$file') as f:
    data = json.load(f)
try:
    result = $expr
    if isinstance(result, list):
        for item in result:
            print(item)
    elif isinstance(result, dict):
        for k in result.keys():
            print(k)
    elif result is True:
        print('true')
    elif result is False:
        print('false')
    elif result is None:
        print('')
    else:
        print(str(result))
except Exception:
    sys.exit(1)
" 2>/dev/null || true
}

# ── Helpers ──
server_count()      { py_json "$MCP_REGISTRY" "len(list(data.get('servers',{}).keys()))"; }
server_names_raw()  { py_json "$MCP_REGISTRY" "list(data.get('servers',{}).keys())"; }

server_field() {
  local n="$1"; local f="$2"
  py_json "$MCP_REGISTRY" "data.get('servers',{}).get('${n}',{}).get('${f}','')"
}

server_env_keys() {
  local n="$1"
  py_json "$MCP_REGISTRY" "list(data.get('servers',{}).get('${n}',{}).get('env',{}).keys())"
}

server_args() {
  local n="$1"
  py_json "$MCP_REGISTRY" "data.get('servers',{}).get('${n}',{}).get('args',[])"
}

is_running() {
  local name="$1"
  hub ps 2>/dev/null | grep -q "mcp-$name" && return 0
  [[ -f "${ROOT}/.crush/mcp-${name}.pid" ]] && kill -0 "$(cat "${ROOT}/.crush/mcp-${name}.pid")" 2>/dev/null && return 0
  return 1
}

# ── Commands ──
cmd_list() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║          MCP Server Registry — All Servers              ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  printf "  %-22s %-12s %s\n" "Server" "Status" "Category"
  printf "  %-22s %-12s %s\n" "──────" "──────" "────────"
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    local cat; cat="$(server_field "$name" "category")"
    local auto; auto="$(server_field "$name" "auto_start")"
    local requires_key; requires_key="$(server_field "$name" "requires_key")"

    local status="❓"
    if is_running "$name"; then status="✅"
    elif [[ "$auto" == "true" ]]; then status="⚪"
    else status="💤"
    fi

    if [[ "$auto" == "true" ]] && [[ "$requires_key" == "true" ]]; then
      local env_key; env_key="$(server_env_keys "$name" | head -1 || true)"
      if [[ -n "$env_key" ]] && [[ -z "${!env_key:-}" ]]; then status="🔑"; fi
    fi

    printf "  %-22s %-12s %s\n" "$name" "$status" "$cat"
  done < <(server_names_raw)
  echo ""
  echo "  Commands: pnpm mcp:start <name> | pnpm mcp:stop <name>"
  echo "  Profile:  pnpm mcp:profile minimal|development|full"
  echo ""
}

cmd_start() {
  local target="${1:-auto}"
  if [[ "$target" != "auto" ]]; then
    echo "Starting MCP server: $target..."
    _start_one "$target"
    return
  fi
  echo "Starting auto-configured MCP servers..."
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    local auto; auto="$(server_field "$name" "auto_start")"
    [[ "$auto" == "true" ]] && _start_one "$name" || true
  done < <(server_names_raw)
}

_start_one() {
  local name="$1"
  if is_running "$name"; then
    echo "  ✅ mcp-${name} already running"
    return 0
  fi

  local cmd; cmd="$(server_field "$name" "command")"
  [[ -z "$cmd" ]] && { echo "  ⚠️  ${name}: no command configured"; return 1; }

  # Build args array
  local args=()
  while IFS= read -r arg; do
    [[ -n "$arg" ]] && args+=("$arg")
  done < <(server_args "$name")

  # Check if key required but missing
  local requires_key; requires_key="$(server_field "$name" "requires_key")"
  if [[ "$requires_key" == "true" ]]; then
    local env_key; env_key="$(server_env_keys "$name" | head -1 || true)"
    if [[ -n "$env_key" ]] && [[ -z "${!env_key:-}" ]]; then
      echo "  🔑 ${name}: requires ${env_key} — set in .env first"
      return 1
    fi
  fi

  echo "  🚀 Starting mcp-${name}..."
  hub start "mcp-${name}" \
    --application "$cmd" \
    --args "${args[@]}" \
    --restart on-failure \
    --pty false 2>/dev/null || {
    local pid_file="${ROOT}/.crush/mcp-${name}.pid"
    mkdir -p "${ROOT}/.crush"
    setsid nohup "$cmd" "${args[@]}" > "${ROOT}/.crush/mcp-${name}.log" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    disown $pid 2>/dev/null || true
    echo "  ✅ mcp-${name} started (PID: $pid)"
  }
}

cmd_stop() {
  local target="${1:-all}"
  if [[ "$target" != "all" ]]; then _stop_one "$target"; return; fi
  echo "Stopping all MCP servers..."
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    _stop_one "$name"
  done < <(server_names_raw)
}

_stop_one() {
  local name="$1"
  is_running "$name" || return 0
  hub stop "mcp-${name}" 2>/dev/null && echo "  ⏹️  Stopped mcp-${name}" && return 0
  local pid_file="${ROOT}/.crush/mcp-${name}.pid"
  if [[ -f "$pid_file" ]]; then
    kill "$(cat "$pid_file")" 2>/dev/null || true
    rm -f "$pid_file"
    echo "  ⏹️  Stopped mcp-${name}"
  fi
}

cmd_status() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║          MCP Server Status — Running Servers            ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  local running=0
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    if is_running "$name"; then
      echo "  ✅ mcp-${name}"
      running=$((running + 1))
    fi
  done < <(server_names_raw)
  [[ "$running" -eq 0 ]] && echo "  No MCP servers running."
  echo "  ${running} running"
  echo ""
}

cmd_profile() {
  local profile_name="${1:-minimal}"
  echo "Loading MCP profile: ${profile_name}"
  local servers
  servers="$(py_json "$MCP_REGISTRY" "data.get('profiles',{}).get('${profile_name}',{}).get('servers',[])")"
  if [[ -z "$servers" ]]; then
    echo "  Unknown profile: ${profile_name} (available: minimal, development, full)"
    exit 1
  fi
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    _start_one "$name" || true
  done <<< "$servers"
  echo "Profile ${profile_name} loaded."
}

# ── Main ──
case "$MODE" in
  list|--list|-l)    cmd_list    ;;
  start|--start)     shift; cmd_start "$@" ;;
  stop|--stop)       shift; cmd_stop "$@"  ;;
  status|--status|-s) cmd_status ;;
  profile|--profile|-p) shift; cmd_profile "$@" ;;
  *)
    echo "Usage: $0 {list|start|stop|status|profile}"
    exit 1
    ;;
esac
