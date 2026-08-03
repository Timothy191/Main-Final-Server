#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch-Mk2 Production Deployment Script
# ──────────────────────────────────────────────────────────────────────────────
# Deploys the full production stack locally using Docker Compose.
#
# Features:
#   - Prerequisite verification (Docker, env files, directories)
#   - Image building with production optimizations
#   - Graceful stack startup with health polling
#   - Database backup cron setup
#   - Health check verification
#   - Status dashboard
#
# Usage:
#   ./scripts/deploy-production.sh              # Deploy with prompts
#   ./scripts/deploy-production.sh --yes        # Deploy non-interactively
#   ./scripts/deploy-production.sh --build      # Force rebuild images
#   ./scripts/deploy-production.sh --restart    # Restart stack
#   ./scripts/deploy-production.sh --status     # Show stack status
#   ./scripts/deploy-production.sh --logs       # Tail logs
#   ./scripts/deploy-production.sh --stop       # Stop stack
#   ./scripts/deploy-production.sh --backup     # Manual database backup
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="docker-compose.production.yml"
COMPOSE_PROJECT="arch-systems-production"
ENV_FILE=".env.production"
ENV_FLAG="--env-file ${ENV_FILE}"

cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Help / Arg Parsing ──────────────────────────────────────────────────────
show_help() {
  cat << 'HELP'
Arch-Mk2 Production Deployment

Usage:
  ./scripts/deploy-production.sh [options]

Options:
  --yes        Deploy non-interactively (auto-accept prompts)
  --build      Force rebuild Docker images
  --restart    Restart the production stack
  --status     Show stack status and health
  --logs       Tail logs from all services
  --stop       Stop the production stack
  --backup     Run a manual database backup
  --help       Show this help message

Examples:
  ./scripts/deploy-production.sh                   # Interactive deploy
  ./scripts/deploy-production.sh --yes             # Unattended deploy
  ./scripts/deploy-production.sh --restart         # Quick restart
  ./scripts/deploy-production.sh --status          # Health check
HELP
  exit 0
}

INTERACTIVE=true
FORCE_BUILD=false
ACTION="deploy"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)        INTERACTIVE=false; shift ;;
    --build)      FORCE_BUILD=true; shift ;;
    --restart)    ACTION="restart"; shift ;;
    --status)     ACTION="status"; shift ;;
    --logs)       ACTION="logs"; shift ;;
    --stop)       ACTION="stop"; shift ;;
    --backup)     ACTION="backup"; shift ;;
    --help|-h)    show_help ;;
    *)            echo "Unknown option: $1"; show_help ;;
  esac
done

# ── Status ───────────────────────────────────────────────────────────────────
show_status() {
  echo -e "\n${CYAN}═══════════════════════════════════════════════${NC}"
  echo -e "${CYAN}   Arch-Mk2 Production Stack Status${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════${NC}\n"

  if ! docker compose ${ENV_FLAG} -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null; then
    echo -e "${YELLOW}Stack is not running.${NC}"
    echo "Deploy with: ./scripts/deploy-production.sh"
    exit 0
  fi

  echo ""
  echo -e "${CYAN}Health Check URLs:${NC}"
  echo -e "  Portal:  ${BLUE}http://localhost:${NGINX_HTTP_PORT:-80}${NC}"
  echo -e "  API:     ${BLUE}http://localhost:${NGINX_HTTP_PORT:-80}/api/health/live${NC}"
  echo -e "  Ops-Gateway:${BLUE}http://localhost:${NGINX_HTTP_PORT:-80}/ops/health${NC}"
  echo -e "  Nginx:   ${BLUE}http://localhost:${NGINX_HTTP_PORT:-80}/health${NC}"

  echo ""
  echo -e "${CYAN}Service Endpoints (via nginx proxy):${NC}"
  echo -e "  Portal:       ${BLUE}http://localhost:${NGINX_HTTP_PORT:-80}${NC}"
  echo -e "  API:          ${BLUE}http://localhost:${NGINX_HTTP_PORT:-80}/api/health/live${NC}"
  echo -e "  Ops-Gateway:  ${BLUE}http://localhost:${NGINX_HTTP_PORT:-80}/ops/health${NC}"
  echo -e "  Nginx Health: ${BLUE}http://localhost:${NGINX_HTTP_PORT:-80}/health${NC}"

  echo ""
  echo -e "${CYAN}Internal Endpoints (direct, no proxy):${NC}"
  echo -e "  API:         ${BLUE}localhost:${API_PORT:-3001}${NC}"
  echo -e "  Portal:      ${BLUE}localhost:${PORTAL_PORT:-3000}${NC}"
  echo -e "  Ops-Gateway: ${BLUE}localhost:${OPS_GATEWAY_PORT:-3100}${NC}"

  # Quick health probe
  echo ""
  echo -e "${CYAN}Health Probe:${NC}"
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${NGINX_HTTP_PORT:-80}/api/health/live" 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" ]]; then
    echo -e "  ${GREEN}✓${NC} API health endpoint: ${http_code}"
  else
    echo -e "  ${RED}✗${NC} API health endpoint: ${http_code} (expected 200)"
  fi
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${NGINX_HTTP_PORT:-80}" 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" || "$http_code" == "302" || "$http_code" == "301" ]]; then
    echo -e "  ${GREEN}✓${NC} Portal frontend: ${http_code}"
  else
    echo -e "  ${RED}✗${NC} Portal frontend: ${http_code} (expected 2xx/3xx)"
  fi
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${NGINX_HTTP_PORT:-80}/ops/health" 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" ]]; then
    echo -e "  ${GREEN}✓${NC} Ops-Gateway health: ${http_code}"
  else
    echo -e "  ${YELLOW}⚠${NC} Ops-Gateway health: ${http_code} (optional service)"
  fi

  echo ""
}

# ── Quick actions ────────────────────────────────────────────────────────────
if [[ "$ACTION" == "status" ]]; then
  show_status
  exit 0
fi

if [[ "$ACTION" == "logs" ]]; then
  echo -e "${CYAN}Tailing logs (Ctrl+C to stop)...${NC}"
  docker compose ${ENV_FLAG} -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" logs -f
  exit 0
fi

if [[ "$ACTION" == "stop" ]]; then
  echo -e "${YELLOW}Stopping production stack...${NC}"
  docker compose ${ENV_FLAG} -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" down
  echo -e "${GREEN}Stack stopped.${NC}"
  exit 0
fi

if [[ "$ACTION" == "restart" ]]; then
  echo -e "${YELLOW}Restarting production stack...${NC}"
  docker compose ${ENV_FLAG} -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" down
  docker compose ${ENV_FLAG} -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" up -d
  echo -e "${GREEN}Stack restarted.${NC}"
  exit 0
fi

if [[ "$ACTION" == "backup" ]]; then
  exec "$SCRIPT_DIR/backup-db.sh"
fi

# ── Prerequisites ────────────────────────────────────────────────────────────
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${CYAN}   Arch-Mk2 Production Deployment${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}[1/6]${NC} Checking prerequisites..."

# Docker
if ! command -v docker &>/dev/null; then
  echo -e "${RED}  ✗ Docker is not installed.${NC}"
  echo "    Install: https://docs.docker.com/engine/install/"
  exit 1
fi
echo -e "${GREEN}  ✓${NC} Docker $(docker --version)"

# Docker Compose
if ! docker compose version &>/dev/null; then
  echo -e "${RED}  ✗ Docker Compose is not installed.${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓${NC} Docker Compose $(docker compose version --short 2>/dev/null || echo 'available')"

# Environment file
if [[ ! -f "${ENV_FILE}" ]]; then
  echo -e "${YELLOW}  ⚠  ${ENV_FILE} not found.${NC}"
  if [[ -f ".env.production.example" ]]; then
    echo "     Copying from .env.production.example..."
    cp .env.production.example "${ENV_FILE}"
    echo -e "${YELLOW}     !!! Please edit ${ENV_FILE} with your actual secrets before continuing !!!${NC}"
    if [[ "$INTERACTIVE" == "true" ]]; then
      read -rp "     Press Enter after editing ${ENV_FILE}, or Ctrl+C to abort..."
    else
      echo -e "${RED}     Aborting: edit ${ENV_FILE} first or use --yes after configuring.${NC}"
      exit 1
    fi
  else
    echo -e "${RED}  ✗ No ${ENV_FILE} or .env.production.example found.${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}  ✓${NC} Environment file: ${ENV_FILE}"

# Certs directory
if [[ ! -d "certs" ]]; then
  echo -e "${YELLOW}  ⚠  certs/ directory not found. Creating empty directory...${NC}"
  mkdir -p certs
  echo "     For SSL, place your certificate files in certs/:"
  echo "       - certs/fullchain.pem"
  echo "       - certs/privkey.pem"
  echo "       - certs/chain.pem"
  echo "     Without SSL certs, only HTTP (port 80) will work."
fi
echo -e "${GREEN}  ✓${NC} Certs directory: $([[ -d certs ]] && echo 'exists' || echo 'missing')"

# Backups directory
mkdir -p backups/postgres
echo -e "${GREEN}  ✓${NC} Backup directory: backups/postgres"

echo ""

# ── Confirmation ─────────────────────────────────────────────────────────────
if [[ "$INTERACTIVE" == "true" ]]; then
  echo -e "${YELLOW}This will deploy the Arch-Mk2 production stack:${NC}"
  echo "  - Nginx (reverse proxy, SSL termination)"
  echo "  - Portal (Next.js frontend)"
  echo "  - API (NestJS backend)"
  echo "  - Ops-Gateway (control plane / MCP)"
  echo ""
  echo -e "${YELLOW}Prerequisites (managed externally):${NC}"
  echo "  - PostgreSQL / Supabase"
  echo "  - Redis / Upstash"
  echo ""
  read -rp "Continue? [Y/n] " confirm
  if [[ "$confirm" =~ ^[Nn] ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# ── Build Images ─────────────────────────────────────────────────────────────
echo -e "${BLUE}[2/6]${NC} Building Docker images..."

BUILD_FLAGS=""
if [[ "$FORCE_BUILD" == "true" ]]; then
  BUILD_FLAGS="--no-cache"
  echo "     Force rebuild (no cache)..."
fi

docker compose ${ENV_FLAG} -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" build ${BUILD_FLAGS} 2>&1 | while IFS= read -r line; do
  echo "     ${line}"
done

echo -e "${GREEN}  ✓${NC} Images built"

# ── Deploy Stack ─────────────────────────────────────────────────────────────
echo -e "${BLUE}[3/6]${NC} Deploying production stack..."

docker compose ${ENV_FLAG} -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" up -d 2>&1 | while IFS= read -r line; do
  echo "     ${line}"
done

echo -e "${GREEN}  ✓${NC} Stack deployed"

# ── Wait for Health ──────────────────────────────────────────────────────────
echo -e "${BLUE}[4/6]${NC} Waiting for services to become healthy..."

MAX_RETRIES=30
RETRY_INTERVAL=5
ALL_HEALTHY=false

for i in $(seq 1 $MAX_RETRIES); do
  UNHEALTHY=$(docker compose ${ENV_FLAG} -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" ps --format "{{.Name}}\t{{.Status}}" 2>/dev/null | grep -v "(healthy)" | grep -v "Exit 0" | wc -l)
  if [[ "$UNHEALTHY" -eq 0 ]]; then
    ALL_HEALTHY=true
    break
  fi
  echo -e "     Waiting... ($i/${MAX_RETRIES})"
  sleep "$RETRY_INTERVAL"
done

if [[ "$ALL_HEALTHY" == "true" ]]; then
  echo -e "${GREEN}  ✓${NC} All services healthy"
else
  echo -e "${YELLOW}  ⚠  Some services may still be starting. Check with:${NC}"
  echo "     ./scripts/deploy-production.sh --status"
fi

# ── Verify Endpoints ─────────────────────────────────────────────────────────
echo -e "${BLUE}[5/6]${NC} Verifying endpoints..."

sleep 3

# Wait for nginx to be ready (it depends on portal + api)
NGINX_BASE="http://localhost:${NGINX_HTTP_PORT:-80}"

# Check API health via nginx
API_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${NGINX_BASE}/api/health/live" 2>/dev/null || echo "000")
if [[ "$API_CHECK" == "200" ]]; then
  echo -e "${GREEN}  ✓${NC} API health: ${API_CHECK}"
else
  echo -e "${RED}  ✗${NC} API health: ${API_CHECK} (expected 200)"
fi

# Check Portal via nginx
PORTAL_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${NGINX_BASE}" 2>/dev/null || echo "000")
if [[ "$PORTAL_CHECK" == "200" || "$PORTAL_CHECK" == "301" || "$PORTAL_CHECK" == "302" ]]; then
  echo -e "${GREEN}  ✓${NC} Portal: ${PORTAL_CHECK}"
else
  echo -e "${RED}  ✗${NC} Portal: ${PORTAL_CHECK}"
fi

# Check nginx health
NGINX_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${NGINX_BASE}/health" 2>/dev/null || echo "000")
if [[ "$NGINX_CHECK" == "200" ]]; then
  echo -e "${GREEN}  ✓${NC} Nginx health: ${NGINX_CHECK}"
fi

# ── Set Up Database Backups ──────────────────────────────────────────────────
echo -e "${BLUE}[6/6]${NC} Setting up database backups..."

# Run initial backup
echo "     Running initial backup..."
bash "$SCRIPT_DIR/backup-db.sh" 2>&1 | grep -v "^\[" | head -5

# Set up cron job if not already present
if ! crontab -l 2>/dev/null | grep -q "backup-db.sh"; then
  if command -v crontab &>/dev/null; then
    echo "     Adding cron job for daily backups at 2:00 AM..."
    (
      crontab -l 2>/dev/null || true
      echo "# Arch-Mk2: Daily database backup"
      echo "0 2 * * * cd ${PROJECT_ROOT} && ${SCRIPT_DIR}/backup-db.sh --cron >> ${PROJECT_ROOT}/backups/cron.log 2>&1"
    ) | crontab -
    echo -e "${GREEN}  ✓${NC} Cron job installed"
  else
    echo -e "${YELLOW}     ⚠  crontab not available — manual backup only.${NC}"
    echo "     To back up manually: ./scripts/backup-db.sh"
  fi
else
  echo -e "${GREEN}  ✓${NC} Cron job already exists"
fi

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Deployment Complete!${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}Portal:${NC}        http://localhost:${NGINX_HTTP_PORT:-80}"
echo -e "  ${BLUE}API Health:${NC}    http://localhost:${NGINX_HTTP_PORT:-80}/api/health/live"
echo -e "  ${BLUE}Nginx Health:${NC}  http://localhost:${NGINX_HTTP_PORT:-80}/health"
echo -e "  ${BLUE}Ops-Gateway:${NC}   http://localhost:${NGINX_HTTP_PORT:-80}/ops/health"
echo ""
echo -e "  ${YELLOW}Useful commands:${NC}"
echo -e "  ${GREEN}→${NC} ./scripts/deploy-production.sh --status    Show stack status"
echo -e "  ${GREEN}→${NC} ./scripts/deploy-production.sh --logs     Tail logs"
echo -e "  ${GREEN}→${NC} ./scripts/deploy-production.sh --backup   Manual backup"
echo -e "  ${GREEN}→${NC} ./scripts/deploy-production.sh --stop     Stop stack"
echo -e "  ${GREEN}→${NC} ./scripts/deploy-production.sh --restart  Restart stack"
echo ""
echo -e "  ${YELLOW}Data:${NC}"
echo -e "  ${GREEN}→${NC} Backups stored in: backups/postgres/"
echo -e "  ${GREEN}→${NC} DB volume:         arch-postgres-data"
echo -e "  ${GREEN}→${NC} Redis volume:      arch-redis-data"
echo ""
echo -e "  ${YELLOW}Logs:${NC}"
echo -e "  ${GREEN}→${NC} docker compose -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE} logs -f"
echo ""
echo -e "  ${YELLOW}Need to update?${NC}"
echo -e "  ${GREEN}→${NC} Rebuild & restart: ./scripts/deploy-production.sh --build"
echo ""
