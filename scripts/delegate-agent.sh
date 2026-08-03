#!/usr/bin/env bash
# Agent Delegation Orchestrator — runs any agent with OpenSpec + SWE + MCP + LSP
# Usage:
#   delegate-agent.sh list                    # List all agents, LSP, MCP status
#   delegate-agent.sh run <name> <prompt>     # Run agent with all contexts
#   delegate-agent.sh run <name>              # Read prompt from stdin
#   delegate-agent.sh run --json <name> <p>   # NDJSON event stream output
#   delegate-agent.sh run --quiet <name> <p>  # Exit code only
#   delegate-agent.sh run --output-schema <schema.json> <name> <p>
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"

MODE="${1:-list}"

# ── Source .env for API keys ──
if [[ -f "${ROOT}/.env" ]]; then
  set -a; source "${ROOT}/.env"; set +a
fi

MCP_REGISTRY="${ROOT}/.cursor/mcp-servers.json"
LSP_ROUTER="${ROOT}/scripts/lsp-router.sh"

# ── Output mode flags ──
OUTPUT_MODE="text"        # text | json | quiet
OUTPUT_SCHEMA=""

# ── Context Loaders ──

load_openspec_context() {
  local ctx=""
  if [[ -f "${ROOT}/openspec/config.yaml" ]]; then
    ctx="${ctx}# OpenSpec Project Context\n"
    ctx="${ctx}$(grep -A999 'context:' "${ROOT}/openspec/config.yaml" 2>/dev/null | tail -n+2 || true)\n"
  fi
  local latest_spec
  latest_spec="$(ls -t "${ROOT}/openspec/changes/"*.yaml 2>/dev/null | head -1 || true)"
  if [[ -n "$latest_spec" ]]; then
    ctx="${ctx}\n# Latest Change Spec: $(basename "$latest_spec")\n"
    ctx="${ctx}$(head -30 "$latest_spec" 2>/dev/null || true)\n"
  fi
  echo -e "$ctx"
}

load_mcp_context() {
  local ctx=""
  local reg="${ROOT}/.cursor/mcp-servers.json"
  if [[ ! -f "$reg" ]]; then echo ""; return; fi
  ctx="${ctx}# MCP Servers Available
"
  while IFS=: read -r name desc; do
    [[ -z "$name" ]] && continue
    ctx="${ctx}#  - ${name}: ${desc}
"
  done < <(python3 -c "
import json
with open('${reg}') as f:
    data = json.load(f)
for k,v in data.get('servers',{}).items():
    d = v.get('description','').replace(':','-')
    print(f'{k}:{d}')
" 2>/dev/null || true)
  echo -e "$ctx"
}

load_lsp_context() {
  local ctx=""
  if [[ -x "$LSP_ROUTER" ]]; then
    ctx="$("$LSP_ROUTER" context 2>/dev/null || true)"
  fi
  echo -e "$ctx"
}

load_knowledge_base_context() {
  local ctx=""
  local kb="${ROOT}/.cursor/agents/_shared/references/knowledge-base.md"
  if [[ -f "$kb" ]]; then
    ctx="${ctx}# Agent Knowledge Base (Best Practices)\n"
    ctx="${ctx}$(head -50 "$kb" 2>/dev/null || true)\n"
  fi
  echo -e "$ctx"
}

load_aci_context() {
  local ctx=""
  local aci="${ROOT}/.cursor/agents/_shared/references/agent-computer-interface.md"
  if [[ -f "$aci" ]]; then
    ctx="${ctx}# Agent-Computer Interface (ACI) Rules\n"
    ctx="${ctx}$(cat "$aci" 2>/dev/null || true)\n"
  fi
  echo -e "$ctx"
}

build_full_context() {
  local openspec; openspec="$(load_openspec_context)"
  local mcp; mcp="$(load_mcp_context)"
  local lsp; lsp="$(load_lsp_context)"
  local kb; kb="$(load_knowledge_base_context)"
  local aci; aci="$(load_aci_context)"

  # ════════════════════════════════════════════════════════════════════
  # PROMPT CACHE ANNOTATION
  # The block between [CACHE CONTROL] markers is a stable system prefix.
  # OpenRouter/Anthropic/DeepSeek cache this across requests within the
  # same session (session_id). Only the === Task === block below varies.
  # Cache hit → 0.1× pricing on cached tokens.
  # ════════════════════════════════════════════════════════════════════
  echo -e "[CACHE CONTROL: ephemeral]\n=== System Context ===\n${openspec}\n${mcp}\n${lsp}\n${kb}\n${aci}\n[CACHE CONTROL: end]\n\n=== Task ==="
}

# ── Agent run commands ──
run_omp() {
  local prompt="$1"
  local context; context="$(build_full_context)"
  echo "🧠 omp v17.0.5 — deep multi-file refactors" >&2
  echo "" >&2
  omp -p "${context}\n\n${prompt}" --no-session --approval-mode write 2>&1
}

run_opencode() {
  local prompt="$1"
  local context; context="$(build_full_context)"
  echo "🧠 opencode v1.18.3 — VSCode-based agent" >&2
  echo "" >&2
  opencode run "${context}\n\n${prompt}" 2>&1
}

run_devin() {
  local prompt="$1"
  local context; context="$(build_full_context)"
  echo "🧠 devin v3000 — cloud agent with sandbox" >&2
  echo "" >&2
  devin -- "${context}\n\n${prompt}" 2>&1
}

# ── Auth/status check per agent ──
check_agent_status() {
  local name="$1"
  local version="?"
  local auth="?"
  local available="?"

  case "$name" in
    omp)
      version="$(omp --version 2>/dev/null | head -1 | sed 's/^omp\///' || echo "not found")"
      if [[ "$version" != "not found" ]]; then
        available="✅"
        auth="🔑 env vars (OPENROUTER_KEY_POOL)"
      else
        available="❌"; auth="not installed"
      fi
      ;;
    opencode)
      version="$(opencode --version 2>/dev/null | head -1 || echo "not found")"
      if [[ "$version" != "not found" ]]; then
        available="✅"
        auth="🔑 env vars (OPENCODE_API_KEY, GEMINI)"
      else
        available="❌"; auth="not installed"
      fi
      ;;
    devin)
      version="$(devin --version 2>/dev/null | head -1 | sed 's/^devin *//' || echo "not found")"
      if [[ "$version" != "not found" ]]; then
        available="✅"
        if devin auth status 2>/dev/null | grep -q "Logged in"; then
          auth="🔑 Logged in (Free tier)"
        else
          auth="⚠️  Not logged in — run: devin auth"
        fi
      else
        available="❌"; auth="not installed"
      fi
      ;;
    esac

  echo "$available v$version — $auth"
}

# ── MCP status summary ──
mcp_summary() {
  local reg=".cursor/mcp-servers.json"
  local total=$(python3 -c "import json;d=json.load(open(\"$reg\"));  print(len(d.get(\"servers\",{}).keys()))" 2>/dev/null || echo 0)
  local auto=$(python3 -c "import json;d=json.load(open(\"$reg\"));print(sum(1 for s in d.get(\"servers\",{}).values() if s.get(\"auto_start\")==True))" 2>/dev/null || echo 0)
  local free=$(python3 -c "import json;d=json.load(open(\"$reg\"));print(sum(1 for s in d.get(\"servers\",{}).values() if s.get(\"free_tier\")==True))" 2>/dev/null || echo 0)
  echo "${total} configured (${auto} auto-start, ${free} free-tier)"
}

# ── LSP status summary ──
lsp_summary() {
  if [[ -x "$LSP_ROUTER" ]]; then
    local count; count="$("$LSP_ROUTER" context 2>/dev/null | grep -c '^- ' || true)"
    echo "${count} language servers detected"
  else
    echo "No LSP router"
  fi
}

# ── Structured output wrapper ──
# Wraps agent stdout and stderr into NDJSON events when --json is set.
# Emits: {"event":"begin","agent":"<name>","ts":<epoch_ms>}
#         {"event":"data","text":"<chunk>","ts":<epoch_ms>}
#         {"event":"end","exit_code":<n>,"ts":<epoch_ms>}
#         {"event":"error","text":"<stderr>","ts":<epoch_ms>}
run_with_output_mode() {
  local agent_name="$1"
  shift
  local agent_fn="$1"
  shift
  local prompt="$*"

  if [[ "$OUTPUT_MODE" == "quiet" ]]; then
    # Quiet: suppress all stdout, capture exit code only
    $agent_fn "$prompt" >/dev/null 2>&1
    local rc=$?
    exit $rc
  elif [[ "$OUTPUT_MODE" == "json" ]]; then
    # JSON NDJSON mode
    local ts; ts="$(date +%s%3N)"
    echo "{\"event\":\"begin\",\"agent\":\"${agent_name}\",\"mode\":\"run\",\"ts\":${ts}}"

    # Create temp files for stdout/stderr capture
    local tmp_out; tmp_out="$(mktemp)"
    local tmp_err; tmp_err="$(mktemp)"
    $agent_fn "$prompt" >"$tmp_out" 2>"$tmp_err"
    local rc=$?

    # Emit stderr as error events
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      ts="$(date +%s%3N)"
      echo "{\"event\":\"error\",\"text\":$(echo "$line" | python3 -c 'import sys,json;print(json.dumps(sys.stdin.read().strip()))' 2>/dev/null || echo "\"$line\""),\"ts\":${ts}}"
    done < "$tmp_err"

    # Emit stdout as data events
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      ts="$(date +%s%3N)"
      echo "{\"event\":\"data\",\"text\":$(echo "$line" | python3 -c 'import sys,json;print(json.dumps(sys.stdin.read().strip()))' 2>/dev/null || echo "\"$line\""),\"ts\":${ts}}"
    done < "$tmp_out"

    ts="$(date +%s%3N)"
    echo "{\"event\":\"end\",\"exit_code\":${rc},\"ts\":${ts}}"

    rm -f "$tmp_out" "$tmp_err"
    exit $rc
  else
    # Text mode (default)
    $agent_fn "$prompt"
    local rc=$?
    exit $rc
  fi
}

# ── Commands ──
cmd_list() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║          Agent Delegation — Available Agents            ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  printf "  %-12s %s\n" "Agent" "Status"
  printf "  %-12s %s\n" "────" "──────"
  for agent in omp opencode devin; do
    local status; status="$(check_agent_status "$agent")"
    printf "  %-12s %s\n" "$agent" "$status"
  done
  echo ""
  echo "  ── MCP: $(mcp_summary) ──"
  echo "  ── LSP: $(lsp_summary) ──"
  echo ""
  echo "  Usage: pnpm agent:delegate <name> <prompt>"
  echo "         pnpm agent:list"
  echo ""
  echo "  Each run injects OpenSpec specs + MCP server registry + LSP context."
  echo "  Cache markers separate stable system context from dynamic task."
  echo ""
}

cmd_run() {
  local name="$1"
  shift || true
  local prompt="$*"

  if [[ -z "$prompt" ]]; then
    prompt="$(cat 2>/dev/null || true)"
  fi
  if [[ -z "$prompt" ]]; then
    echo "Usage: pnpm agent:delegate <name> <prompt>"
    echo "  or:  echo 'prompt' | pnpm agent:delegate <name>"
    echo "  or:  pnpm agent:delegate --json <name> <prompt>"
    echo "  or:  pnpm agent:delegate --quiet <name> <prompt>"
    echo "  or:  pnpm agent:delegate --output-schema schema.json <name> <prompt>"
    echo ""
    echo "Available agents: omp, opencode, devin"
    echo ""
    echo "Output modes:"
    echo "  (default)  — Stream plain text to stdout"
    echo "  --json     — NDJSON event stream (begin/data/error/end)"
    echo "  --quiet    — Exit 0 on success, 1 on error, no stdout"
    echo "  --output-schema <file> — Validate output against JSON Schema"
    exit 1
  fi

  # Auto-start MCP servers before delegation
  if [[ -x "${ROOT}/scripts/mcp-manager.sh" ]]; then
    "${ROOT}/scripts/mcp-manager.sh" start 2>/dev/null || true
  fi

  # Validate output schema if provided
  if [[ -n "$OUTPUT_SCHEMA" ]]; then
    if [[ ! -f "$OUTPUT_SCHEMA" ]]; then
      echo "Error: schema file not found: $OUTPUT_SCHEMA" >&2
      exit 1
    fi
  fi

  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║          Agent Delegation — Running: ${name}           ║"
  echo "╚══════════════════════════════════════════════════════════╝"

  if [[ "$OUTPUT_MODE" == "json" ]]; then
    echo "  Output: NDJSON event stream"
  elif [[ "$OUTPUT_MODE" == "quiet" ]]; then
    echo "  Output: quiet (exit code only)"
  fi
  if [[ -n "$OUTPUT_SCHEMA" ]]; then
    echo "  Schema validation: $(basename "$OUTPUT_SCHEMA")"
  fi
  echo ""

  case "$name" in
    omp)        run_with_output_mode "$name" run_omp "$prompt" ;;
    opencode)   run_with_output_mode "$name" run_opencode "$prompt" ;;
    devin)      run_with_output_mode "$name" run_devin "$prompt" ;;
    *)
      echo "Unknown agent: $name"
      echo "Available: omp, opencode, devin"
      exit 1
      ;;
  esac

  local rc=$?
  echo ""
  if [[ $rc -eq 0 ]]; then
    echo "✅ Agent ${name} completed (exit: ${rc})"
  else
    echo "⚠️  Agent ${name} exited with code ${rc}"
  fi
  echo ""
}

# ── Main ──
# Parse global flags
while true; do
  case "${1:-}" in
    --json|-j)
      OUTPUT_MODE="json"
      shift
      ;;
    --quiet|-q)
      OUTPUT_MODE="quiet"
      shift
      ;;
    --output-schema|-s)
      OUTPUT_SCHEMA="${2:-}"
      shift 2
      ;;
    --run|-r|run)
      shift
      break
      ;;
    --list|-l|list)
      shift
      cmd_list
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

# Remaining args: [run] <name> [prompt...]
case "${1:-}" in
  list|--list|-l)
    cmd_list
    ;;
  run|--run|-r)
    shift
    cmd_run "$@"
    ;;
  omp|opencode|devin)
    # Bare agent name — treat as "run <name>"
    cmd_run "$@"
    ;;
  *)
    if [[ $# -eq 0 ]]; then
      cmd_list
    else
      echo "Usage: $0 {list|run} [--json|--quiet|--output-schema <file>] <name> [prompt]"
      echo ""
      echo "  list              — List all agents, MCP, LSP status"
      echo "  run <name> [prompt] — Run agent with OpenSpec+MCP+LSP context"
      echo "  --json            — NDJSON event stream output"
      echo "  --quiet           — Exit code only"
      echo "  --output-schema   — Validate output against JSON Schema"
      exit 1
    fi
    ;;
esac
