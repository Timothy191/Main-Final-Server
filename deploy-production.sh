#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# Arch-Systems — Production Deployment Script
#
# Phase-based deployment with checklist, auto-browser, and monitoring.
# Usage: bash deploy-production.sh [--force] [--skip-build] [--skip-validation] [--no-browser] [--no-monitors]
#
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

# ── Colours ───────────────────────────────────────────────────────────────────
DIM='\033[0;2m'; RED='\033[0;31m'; GREEN='\033[0;32m'
YELLOW='\033[0;33m'; CYAN='\033[0;36m'; MAGENTA='\033[0;35m'
BOLD='\033[1m'; NC='\033[0m'

OK="${GREEN}${BOLD}  ✓${NC}"; ERR="${RED}${BOLD}  ✗${NC}"
WARN="${YELLOW}${BOLD}  ⚠${NC}"; INFO="${CYAN}${BOLD}  →${NC}"
STEP="${MAGENTA}${BOLD}"

step() { echo; echo -e "  ${STEP}▶  $1${NC}"; }
ok()   { echo -e "  ${OK} $1${DIM}${2:+  $2}${NC}"; }
err()  { echo -e "  ${ERR} $1${RED}${2:+  $2}${NC}"; }
warn() { echo -e "  ${WARN} $1${YELLOW}${2:+  $2}${NC}"; }
info() { echo -e "  ${INFO} $1"; }
die()  { err "$1"; echo; exit 1; }

banner() {
  clear 2>/dev/null || true
  echo
  echo -e "  ${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "  ${BOLD}${CYAN}║   Arch Systems  ·  Production Deployment          ║${NC}"
  echo -e "  ${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${NC}"
  echo
  echo -e "  ${DIM}$(date '+%A, %d %B %Y  %H:%M:%S')${NC}"
  echo
}

# ── Parse Arguments ───────────────────────────────────────────────────────────

SKIP_VALIDATION=false
SKIP_BUILD=false
FORCE=false
OPEN_BROWSER=true
OPEN_MONITORS=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-validation)
      SKIP_VALIDATION=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --no-browser)
      OPEN_BROWSER=false
      shift
      ;;
    --no-monitors)
      OPEN_MONITORS=false
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo
      echo "Options:"
      echo "  --skip-validation    Skip environment validation (dangerous)"
      echo "  --skip-build        Skip Docker image rebuild"
      echo "  --force             Force deployment without confirmation"
      echo "  --no-browser        Don't auto-open browser after deployment"
      echo "  --no-monitors       Don't open monitoring terminals"
      echo "  --help, -h          Show this help message"
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

# ── Checklist Tracking ────────────────────────────────────────────────────────

CHECKLIST_PASSED=0
CHECKLIST_FAILED=0

checklist_pass() {
  local label="$1"
  echo -e "  ${OK} ${BOLD}$label${NC}"
  CHECKLIST_PASSED=$((CHECKLIST_PASSED + 1))
}

checklist_fail() {
  local label="$1" detail="${2:-}"
  echo -e "  ${ERR} ${BOLD}$label${NC}${RED}${detail:+  $detail}${NC}"
  CHECKLIST_FAILED=$((CHECKLIST_FAILED + 1))
}

checklist_warn() {
  local label="$1" detail="${2:-}"
  echo -e "  ${WARN} ${BOLD}$label${NC}${YELLOW}${detail:+  $detail}${NC}"
}

# ── Deployment Functions ────────────────────────────────────────────────────

check_docker() {
  step "Phase 1: Checking Docker availability"
  if ! command -v docker >/dev/null 2>&1; then
    checklist_fail "Docker installed"
    die "Docker is not installed or not in PATH"
  fi
  if ! command -v docker compose >/dev/null 2>&1; then
    checklist_fail "Docker Compose installed"
    die "Docker Compose is not installed or not in PATH"
  fi
  checklist_pass "Docker and Docker Compose available"
}

validate_environment() {
  step "Phase 2: Validating production environment"
  
  if [[ "$SKIP_VALIDATION" == true ]]; then
    checklist_warn "Environment validation skipped" "--skip-validation used"
    return 0
  fi
  
  # Run the environment validation script
  if ! bash "$SCRIPT_DIR/scripts/validate-env.sh" --production; then
    checklist_fail "Environment validation"
    die "Environment validation failed. Please fix the issues above."
  fi
  checklist_pass "Production environment validated"
}

build_images() {
  step "Phase 3: Building production Docker images"
  
  if [[ "$SKIP_BUILD" == true ]]; then
    checklist_warn "Docker build skipped" "--skip-build used"
    return 0
  fi
  
  info "Building Next.js portal image..."
  if ! docker compose -f docker-compose.production.yml build --no-cache portal; then
    checklist_fail "Portal image build"
    die "Failed to build portal image"
  fi
  checklist_pass "Portal image built successfully"
}

stop_existing_services() {
  step "Phase 4: Stopping existing production services"
  
  # Check if services are running
  if docker compose -f docker-compose.production.yml ps --services --status running | grep -q .; then
    info "Stopping running production services..."
    if ! docker compose -f docker-compose.production.yml down; then
      checklist_warn "Failed to stop existing services" "continuing anyway"
    else
      checklist_pass "Existing services stopped"
    fi
  else
    checklist_pass "No production services running"
  fi
}

start_services() {
  step "Phase 5: Starting production services"
  
  info "Starting services in detached mode..."
  if ! docker compose -f docker-compose.production.yml up -d; then
    checklist_fail "Services started"
    die "Failed to start production services"
  fi
  checklist_pass "Production services started"
}

wait_for_health() {
  step "Phase 6: Waiting for services to become healthy"
  
  local max_attempts=30
  local attempt=1
  
  info "Waiting for portal health check..."
  
  while [[ $attempt -le $max_attempts ]]; do
    if curl -s -f http://localhost:3000/api/health >/dev/null 2>&1; then
      checklist_pass "Portal healthy" "attempt $attempt/$max_attempts"
      return 0
    fi
    
    if [[ $attempt -eq $max_attempts ]]; then
      checklist_fail "Portal health" "failed after $max_attempts attempts"
      info "Checking container logs..."
      docker compose -f docker-compose.production.yml logs portal --tail=20
      return 1
    fi
    
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  return 1
}

verify_deployment() {
  step "Phase 7: Verifying deployment"
  
  info "Checking service status..."
  if ! docker compose -f docker-compose.production.yml ps; then
    checklist_warn "Service status check" "failed to get status"
  else
    checklist_pass "Service status retrieved"
  fi
  
  info "Testing frontend accessibility..."
  if ! curl -s -f http://localhost:3000 >/dev/null 2>&1; then
    checklist_fail "Frontend accessible" "http://localhost:3000"
  else
    checklist_pass "Frontend accessible" "http://localhost:3000"
  fi
  
  info "Testing health endpoint..."
  if ! curl -s -f http://localhost:3000/api/health | grep -q '"status":"healthy"'; then
    checklist_warn "Health endpoint" "returned non-healthy status"
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
  else
    checklist_pass "Health endpoint reports healthy"
  fi
}

confirm_deployment() {
  if [[ "$FORCE" == true ]]; then
    return 0
  fi
  
  echo
  echo -e "  ${BOLD}${YELLOW}⚠  Production Deployment Confirmation${NC}"
  echo
  echo "  You are about to deploy to production."
  echo "  This will:"
  echo "    • Stop any running production services"
  echo "    • Build new Docker images"
  echo "    • Start all services"
  echo "    • Configure production networking"
  echo "    • Open browser to login page"
  echo "    • Open monitoring terminals"
  echo
  echo -e "  Target: ${BOLD}Port 3000${NC}"
  echo
  read -p "  Continue with deployment? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo
    err "Deployment cancelled"
    exit 0
  fi
}

open_browser_login() {
  if [[ "$OPEN_BROWSER" != true ]]; then
    return 0
  fi
  
  step "Phase 8: Opening browser to login page"
  
  local url="http://localhost:3000/login"
  local opened_with=""
  
  # Try common browsers
  for cmd in chromium chromium-browser google-chrome google-chrome-stable brave brave-browser firefox xdg-open open; do
    if command -v "$cmd" >/dev/null 2>&1; then
      case "$cmd" in
        chromium|chromium-browser|google-chrome|google-chrome-stable|brave|brave-browser|firefox)
          nohup "$cmd" --new-window "$url" >/dev/null 2>&1 &
          ;;
        *)
          nohup "$cmd" "$url" >/dev/null 2>&1 &
          ;;
      esac
      opened_with="$cmd"
      break
    fi
  done
  
  if [[ -n "$opened_with" ]]; then
    checklist_pass "Browser opened" "via $opened_with → $url"
  else
    checklist_warn "No browser found" "open manually: $url"
  fi
}

open_monitoring_terminals() {
  if [[ "$OPEN_MONITORS" != true ]]; then
    return 0
  fi
  
  step "Phase 9: Opening monitoring terminals"
  
  local portal_log="${REPO_ROOT}/portal.log"
  local opened=0
  
  # Function to open terminal
  open_term() {
    local title="$1"
    local cmd="$2"
    
    if command -v kitty >/dev/null 2>&1; then
      kitty --title "$title" -e bash -lc "$cmd" >/dev/null 2>&1 &
      return 0
    fi
    if command -v gnome-terminal >/dev/null 2>&1; then
      gnome-terminal --title="$title" -- bash -lc "$cmd; exec bash" >/dev/null 2>&1 &
      return 0
    fi
    if command -v konsole >/dev/null 2>&1; then
      konsole -p tabtitle="$title" -e bash -lc "$cmd; exec bash" >/dev/null 2>&1 &
      return 0
    fi
    if command -v x-terminal-emulator >/dev/null 2>&1; then
      x-terminal-emulator -T "$title" -e bash -lc "$cmd; exec bash" >/dev/null 2>&1 &
      return 0
    fi
    return 1
  }
  
  # Open monitoring terminals
  if open_term "Arch portal.log" "tail -F '${portal_log}'"; then
    opened=$((opened + 1))
  fi
  if open_term "Arch Redis" "docker logs -f arch-redis"; then
    opened=$((opened + 1))
  fi
  if open_term "Arch Supabase Kong" "docker logs -f supabase_kong_supabase"; then
    opened=$((opened + 1))
  fi
  
  if [[ $opened -gt 0 ]]; then
    checklist_pass "Monitoring terminals opened" "$opened terminal(s)"
  else
    checklist_warn "No terminal emulator found" "monitoring URLs printed below"
    echo
    echo -e "  ${BOLD}Monitoring URLs:${NC}"
    echo -e "    ${CYAN}Portal log:${NC}  tail -F ${portal_log}"
    echo -e "    ${CYAN}Redis:${NC}       docker logs -f arch-redis"
    echo -e "    ${CYAN}Supabase:${NC}    docker logs -f supabase_kong_supabase"
  fi
}

show_checklist_summary() {
  echo
  echo -e "${BOLD}─────────────────────────────────────────────────────────────${NC}"
  echo
  echo -e "  ${BOLD}Deployment Checklist Summary${NC}"
  echo
  echo -e "    ${GREEN}${BOLD}✓${NC} Passed: ${BOLD}${CHECKLIST_PASSED}${NC}"
  echo -e "    ${YELLOW}${BOLD}⚠${NC} Warnings: ${BOLD}$((CHECKLIST_FAILED))${NC}"
  echo -e "    ${RED}${BOLD}✗${NC} Failed: ${BOLD}${CHECKLIST_FAILED}${NC}"
  echo
}

# ── Main Deployment Flow ──────────────────────────────────────────────────────

main() {
  banner
  
  step "Starting production deployment"
  
  # 1. Check prerequisites
  check_docker
  
  # 2. Confirm deployment
  confirm_deployment
  
  # 3. Validate environment
  validate_environment
  
  # 4. Stop existing services
  stop_existing_services
  
  # 5. Build images
  build_images
  
  # 6. Start services
  start_services
  
  # 7. Wait for health
  if ! wait_for_health; then
    err "Services did not become healthy in time"
    info "Check logs with: docker compose -f docker-compose.production.yml logs"
    show_checklist_summary
    exit 1
  fi
  
  # 8. Verify deployment
  verify_deployment
  
  # 9. Open browser to login
  open_browser_login
  
  # 10. Open monitoring terminals
  open_monitoring_terminals
  
  # 11. Show checklist summary
  show_checklist_summary
  
  # 12. Success
  echo
  echo -e "${BOLD}─────────────────────────────────────────────────────────────${NC}"
  echo
  echo -e "  ${BOLD}${GREEN}✓ Production deployment completed successfully${NC}"
  echo
  echo "  Services:"
  echo "    • Frontend: http://localhost:3000"
  echo "    • Login:    http://localhost:3000/login"
  echo "    • Health:   http://localhost:3000/api/health"
  echo
  echo "  Useful commands:"
  echo "    • View logs:    docker compose -f docker-compose.production.yml logs -f"
  echo "    • Stop:        docker compose -f docker-compose.production.yml down"
  echo "    • Status:      docker compose -f docker-compose.production.yml ps"
  echo "    • Restart:     docker compose -f docker-compose.production.yml restart"
  echo
  echo "  Next steps:"
  echo "    • Verify login functionality"
  echo "    • Test all application pages"
  echo "    • Monitor service health in opened terminals"
  echo
}