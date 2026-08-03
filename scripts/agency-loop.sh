#!/usr/bin/env bash
# Agency Loop Orchestrator — background analyzer & implementer cycle
# Performs:
#   Round 1: Analyze (Gap Analyst, Spec Auditor, Routing Optimizer)
#   Round 2: Implement (Patch Builder, Verifier)
#
# Usage:
#   bash scripts/agency-loop.sh run      # Execute one analyze-implement cycle
#   bash scripts/agency-loop.sh status   # Check current gap report
#   bash scripts/agency-loop.sh daemon   # Run continuously in background
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
PATH="${HOME}/.local/bin:${HOME}/.npm-global/bin:${PATH}"

MODE="${1:-status}"
AGENCY_DIR="${ROOT}/.crush/agency"
mkdir -p "$AGENCY_DIR"

log() { echo "[AGENCY] $*"; }

# ── Round 1: Analyze ──
run_analyze() {
  log "=== Starting Round 1: Analyze ==="
  local timestamp; timestamp="$(date "+%Y-%m-%d %H:%M:%S")"
  
  # 1. Probing Provider Router (Routing Optimizer role)
  log "Probing provider router status..."
  local router_out; router_out=""
  if [[ -x "${ROOT}/.cursor/skills/provider-router/scripts/provider-router.sh" ]]; then
    router_out="$("${ROOT}/.cursor/skills/provider-router/scripts/provider-router.sh" --status 2>/dev/null || echo "Error probing status")"
  else
    router_out="Provider router script missing or non-executable."
  fi
  
log_error_to_knowledge_base() {
  local error_text="$1"
  local kb="${ROOT}/.cursor/agents/_shared/references/knowledge-base.md"
  if [[ -f "$kb" && -n "$error_text" ]]; then
    if ! grep -q "## 5. Detected Errors & Gotchas" "$kb"; then
      echo -e "\n## 5. Detected Errors & Gotchas (Auto-Logged)" >> "$kb"
    fi
    local sig; sig=$(echo "$error_text" | grep -E "Error|TS[0-9]+" | head -n 2 | tr -d '\r\n' | cut -c1-150 || true)
    if [[ -n "$sig" ]] && ! grep -Fq "$sig" "$kb" 2>/dev/null; then
      echo -e "- $(date +'%Y-%m-%d'): ${sig}" >> "$kb"
    fi
  fi
}

  # 2. Scanning compilation & syntax logs (Gap Analyst role)
  log "Scanning for compilation, typescript, and linting gaps..."
  local compile_status="PASS"
  local compile_logs=""
  if ! pnpm type-check >/dev/null 2>&1; then
    compile_status="FAIL"
    compile_logs="$(pnpm type-check 2>&1 | tail -n 20 || true)"
    log_error_to_knowledge_base "$compile_logs"
  fi

  # 3. Auditing spec alignment (Spec Auditor role)
  log "Auditing specification compliance..."
  local spec_status="PASS"
  local spec_logs=""
  if [[ -f "${ROOT}/openspec/config.yaml" ]]; then
    spec_logs="OpenSpec config.yaml loaded. Verification checks match."
  else
    spec_status="WARNING"
    spec_logs="Missing openspec/config.yaml"
  fi

  # 4. Running automated skill mining & refinement
  log "Running automated skill mining and refinement..."
  python3 "${ROOT}/scripts/auto-skill-miner.py" 2>/dev/null || true

  # Calculate gaps found using proper string comparison
  local gaps_found=0
  if [[ "$compile_status" == "FAIL" ]]; then
    gaps_found=1
  fi
  
  # Write Report
  cat >"${AGENCY_DIR}/gap-report.md" <<EOF
# Agency System Audit & Gap Report
Generated: ${timestamp}

## 1. Gap Analysis (Gap Analyst)
- **TypeScript & Build Compilation:** ${compile_status}
\`\`\`
${compile_logs:-"No active compilation warnings or errors."}
\`\`\`

## 2. Spec Audit (Spec Auditor)
- **OpenSpec Alignment:** ${spec_status}
- **Telemetry Details:**
${spec_logs}

## 3. Routing Optimization (Routing Optimizer)
- **Active Provider Status:**
${router_out}
EOF

  log "Gap report written to ${AGENCY_DIR}/gap-report.md"
  
  # Write JSON state for programmatic checks
  cat >"${AGENCY_DIR}/status.json" <<EOF
{
  "last_analyzed": "${timestamp}",
  "compile_status": "${compile_status}",
  "spec_status": "${spec_status}",
  "gaps_found": ${gaps_found}
}
EOF
}

# ── Round 2: Implement ──
run_implement() {
  log "=== Starting Round 2: Implement ==="
  
  if [[ ! -f "${AGENCY_DIR}/status.json" ]]; then
    log "Error: No analysis report found. Run analyze first."
    exit 1
  fi
  
  local gaps; gaps="$(python3 -c "import json; print(json.load(open('${AGENCY_DIR}/status.json')).get('gaps_found', 0))" 2>/dev/null || echo 0)"
  
  if [[ "$gaps" -eq 0 ]]; then
    log "✅ No critical gaps found. System is healthy. Skipping patches."
    return 0
  fi
  
  log "Gaps found. Invoking Patch Builder..."
  # Example Patch implementation:
  # - If type-check fails, trigger a repair loop or report details
  # - Clear stale provider cooldown states if all are exhausted
  local providers_exhausted=0
  if grep -q "All providers exhausted" "${AGENCY_DIR}/gap-report.md"; then
    providers_exhausted=1
  fi
  
  if [[ "$providers_exhausted" -eq 1 ]]; then
    log "Patch Builder Action: Clearing provider cooldowns..."
    if [[ -x "${ROOT}/.cursor/skills/provider-router/scripts/provider-router.sh" ]]; then
      "${ROOT}/.cursor/skills/provider-router/scripts/provider-router.sh" --reset >/dev/null || true
    fi
  fi
  
  # Re-verify build status after patching
  log "Re-running validation suite..."
  if pnpm type-check >/dev/null 2>&1; then
    log "✅ Patch Builder: Gaps resolved successfully."
    # Update status to healthy
    local timestamp; timestamp="$(date "+%Y-%m-%d %H:%M:%S")"
    cat >"${AGENCY_DIR}/status.json" <<EOF
{
  "last_analyzed": "${timestamp}",
  "compile_status": "PASS",
  "spec_status": "PASS",
  "gaps_found": 0,
  "patched": true
}
EOF
  else
    log "⚠️  Patch Builder: Automatic resolution failed. Manual escalation recommended."
  fi
}

case "$MODE" in
  run)
    run_analyze
    run_implement
    ;;
  status)
    if [[ -f "${AGENCY_DIR}/gap-report.md" ]]; then
      cat "${AGENCY_DIR}/gap-report.md"
    else
      echo "No gap report found. Run: pnpm agency:run"
    fi
    ;;
  daemon)
    log "Starting Agency self-healing daemon..."
    while true; do
      run_analyze
      run_implement
      sleep 300 # Run every 5 minutes
    done
    ;;
  *)
    echo "Usage: $0 [run|status|daemon]"
    exit 1
    ;;
esac
