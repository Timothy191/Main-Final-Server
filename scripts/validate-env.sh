#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Arch-Systems — Environment Variable Validation
#
# Validates that all required environment variables are set before deployment.
# Usage: bash scripts/validate-env.sh [--production|--local]
#
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

# ── Colours ───────────────────────────────────────────────────────────────────
DIM='\033[0;2m'; RED='\033[0;31m'; GREEN='\033[0;32m'
YELLOW='\033[0;33m'; CYAN='\033[0;36m'; MAGENTA='\033[0;35m'
BOLD='\033[1m'; NC='\033[0m'

OK="${GREEN}${BOLD}  ✓${NC}"; ERR="${RED}${BOLD}  ✗${NC}"
WARN="${YELLOW}${BOLD}  ⚠${NC}"; INFO="${CYAN}${BOLD}  →${NC}"

log_ok()   { echo -e "  ${OK} $1${DIM}${2:+  $2}${NC}"; }
log_err()  { echo -e "  ${ERR} $1${RED}${2:+  $2}${NC}"; }
log_warn() { echo -e "  ${WARN} $1${YELLOW}${2:+  $2}${NC}"; }
log_info() { echo -e "  ${INFO} $1"; }

banner() {
  clear 2>/dev/null || true
  echo
  echo -e "  ${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "  ${BOLD}${CYAN}║   Arch Systems  ·  Environment Validation        ║${NC}"
  echo -e "  ${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${NC}"
  echo
}

# ── Validation Functions ──────────────────────────────────────────────────────

validate_env_var() {
  local name="$1"
  local value="${!name:-}"
  local required="$2"
  local description="$3"
  
  if [[ -z "$value" ]]; then
    if [[ "$required" == "required" ]]; then
      log_err "Missing required environment variable: ${BOLD}$name${NC}"
      echo "    Description: $description"
      return 1
    else
      log_warn "Optional environment variable not set: ${BOLD}$name${NC}"
      echo "    Description: $description"
      return 0
    fi
  else
    log_ok "Environment variable set: ${BOLD}$name${NC}"
    if [[ "$name" == *"KEY"* ]] || [[ "$name" == *"SECRET"* ]] || [[ "$name" == *"PASSWORD"* ]]; then
      echo "    Value: [REDACTED]"
    else
      echo "    Value: ${value:0:50}$([[ ${#value} -gt 50 ]] && echo "...")"
    fi
    return 0
  fi
}

validate_supabase_url() {
  local url="${NEXT_PUBLIC_SUPABASE_URL:-}"
  local allow_local="${1:-false}"
  if [[ -z "$url" ]]; then
    return 0  # Already validated as required
  fi
  
  if [[ "$url" =~ ^https?://[a-zA-Z0-9.-]+\.(supabase\.co|supabase\.in)$ ]]; then
    log_ok "Supabase URL format valid"
  elif [[ "$allow_local" == "true" ]] && [[ "$url" =~ ^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?(/.*)?$ ]]; then
    log_ok "Supabase local URL accepted" "$url"
  else
    log_warn "Supabase URL format may be invalid: $url"
    echo "    Expected: https://[project-id].supabase.co"
    echo "    Or local: http://localhost:54321 (use --local)"
  fi
}

# ── Main Validation ──────────────────────────────────────────────────────────

main() {
  banner
  
  local mode="${1:-development}"
  local is_production=false
  local is_local=false
  local has_errors=0
  
  if [[ "$mode" == "--production" ]] || [[ "$mode" == "production" ]]; then
    is_production=true
    log_info "Running production environment validation"
  elif [[ "$mode" == "--local" ]] || [[ "$mode" == "local" ]]; then
    is_local=true
    log_info "Running local development environment validation"
  else
    log_info "Running development environment validation"
  fi
  
  echo
  log_info "Validating environment variables..."
  echo
  
  # ── Core Application Variables ──────────────────────────────────────────────
  validate_env_var "NODE_ENV" "required" "Node.js environment (development/production)"
  
  # ── Supabase Configuration ─────────────────────────────────────────────────
  echo
  log_info "Supabase Configuration"
  validate_env_var "NEXT_PUBLIC_SUPABASE_URL" "required" "Supabase project URL"
  validate_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "required" "Supabase anonymous client key"
  validate_env_var "SUPABASE_SERVICE_ROLE_KEY" "required" "Supabase service role key (server-only)"
  
  if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
    validate_supabase_url "$is_local"
  fi
  
  # ── Database & Cache ───────────────────────────────────────────────────────
  echo
  log_info "Database & Cache"
  
  if [[ "$is_production" == true ]]; then
    validate_env_var "DATABASE_URL" "required" "Production PostgreSQL connection string"
    validate_env_var "REDIS_URL" "required" "Production Redis connection URL"
  else
    validate_env_var "DATABASE_URL" "optional" "Local PostgreSQL connection string (defaults to docker-compose)"
    validate_env_var "REDIS_URL" "optional" "Local Redis connection URL (defaults to docker-compose)"
  fi
  
  # ── Production-only Variables ──────────────────────────────────────────────
  if [[ "$is_production" == true ]]; then
    echo
    log_info "Production Configuration"
    validate_env_var "SENTRY_DSN" "optional" "Sentry error monitoring DSN"
    validate_env_var "NEXT_PUBLIC_SENTRY_DSN" "optional" "Sentry client-side DSN"
    validate_env_var "OTEL_EXPORTER_OTLP_ENDPOINT" "optional" "OpenTelemetry OTLP endpoint"
  fi
  
  # ── Docker Compose Overrides ───────────────────────────────────────────────
  echo
  log_info "Docker Compose Configuration"
  validate_env_var "COMPOSE_PROJECT_NAME" "optional" "Docker Compose project name (default: arch-systems-dev)"
  
  # ── Summary ────────────────────────────────────────────────────────────────
  echo
  echo -e "${BOLD}─────────────────────────────────────────────────────────────${NC}"
  
  if [[ $has_errors -eq 0 ]]; then
    echo -e "  ${BOLD}${GREEN}✓ All environment variables validated successfully${NC}"
    echo
    if [[ "$is_production" == true ]]; then
      log_info "Production environment ready for deployment"
    else
      log_info "Development environment ready for deployment"
    fi
    return 0
  else
    echo -e "  ${BOLD}${RED}✗ Environment validation failed${NC}"
    echo
    log_err "Please set the missing environment variables before deployment."
    echo
    log_info "Check the following files for reference:"
    echo "  - apps/portal/.env.example"
    echo "  - apps/portal/env/.env.production.example"
    echo
    return 1
  fi
}

# Run validation
main "$@"
