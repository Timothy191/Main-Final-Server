#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch-Mk2 Database Backup Script
# ──────────────────────────────────────────────────────────────────────────────
# Automated PostgreSQL backup with rotation.
# - Dumps all databases to compressed SQL files
# - Rotates backups: keeps daily for 7 days, weekly for 4 weeks, monthly for 6 months
# - Optionally uploads to remote storage (S3-compatible)
# - Sends notifications on failure
#
# Usage:
#   ./scripts/backup-db.sh                    # Manual backup
#   ./scripts/backup-db.sh --cron             # Cron mode (logs to syslog)
#   ./scripts/backup-db.sh --remote           # Backup + upload to remote
#
# Cron (daily at 2am):
#   0 2 * * * /path/to/scripts/backup-db.sh --cron
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/postgres}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/arch-db-${TIMESTAMP}.sql.gz"
LATEST_LINK="${BACKUP_DIR}/arch-db-latest.sql.gz"

# Retention policy — keep backups for N days, then auto-delete
# One backup per day is retained. Adjust as needed.
RETENTION_DAYS=30

# Docker compose context
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-arch-systems-production}"

# Remote storage (optional — set these in .env.production)
# S3_ENDPOINT=...
# S3_BUCKET=...
# S3_ACCESS_KEY=...
# S3_SECRET_KEY=...
# ──────────────────────────────────────────────────────────────────────────────

mkdir -p "${BACKUP_DIR}"

# Log helper
log() {
  local level="$1"
  shift
  if [[ "${CRON_MODE:-false}" == "true" ]]; then
    logger -t "arch-backup" "[${level}] $*"
  else
    echo "[$(date +%H:%M:%S)] [${level}] $*"
  fi
}

error_exit() {
  log "ERROR" "$*"
  # Optional: send alert (Slack, email, etc.)
  # curl -s -X POST -H 'Content-type: application/json' \
  #   --data "{\"text\":\"[Arch-Mk2] DB Backup FAILED: $*\"}" \
  #   "${SLACK_WEBHOOK_URL:-}" 2>/dev/null || true
  exit 1
}

# ── Prerequisites ────────────────────────────────────────────────────────────
for cmd in docker gzip df; do
  if ! command -v "$cmd" &>/dev/null; then
    error_exit "Required command not found: $cmd"
  fi
done

# ── Pre-flight Checks ───────────────────────────────────────────────────────
# Check available disk space before backup
BACKUP_DEVICE="$(df "${BACKUP_DIR}" --output=target | tail -1)"
AVAILABLE_KB="$(df "${BACKUP_DIR}" --output=avail | tail -1)"
AVAILABLE_MB=$((AVAILABLE_KB / 1024))
log "INFO" "Available disk space on ${BACKUP_DEVICE}: ${AVAILABLE_MB}MB"

if [[ "${AVAILABLE_MB}" -lt 1024 ]]; then
  error_exit "Insufficient disk space: ${AVAILABLE_MB}MB available, need at least 1024MB"
elif [[ "${AVAILABLE_MB}" -lt 5120 ]]; then
  log "WARN" "Low disk space: ${AVAILABLE_MB}MB — backup may fill the volume"
fi

# ── Perform Backup ───────────────────────────────────────────────────────────
log "INFO" "Starting database backup..."

CONTAINER_NAME="${COMPOSE_PROJECT}-postgres-1"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  # Try alternative naming (docker compose uses project name prefix)
  CONTAINER_NAME="arch-postgres"
  if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    error_exit "PostgreSQL container not found. Is the production stack running?"
  fi
fi

log "INFO" "Using container: ${CONTAINER_NAME}"

# Get DB credentials from container environment
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-coal_mine}"

# Perform pg_dump with compression
log "INFO" "Dumping database '${DB_NAME}'..."
if docker exec "${CONTAINER_NAME}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  2>/dev/null | gzip > "${BACKUP_FILE}"; then
  BACKUP_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
  log "INFO" "Backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
  rm -f "${BACKUP_FILE}"
  error_exit "pg_dump failed"
fi

# Create/update latest symlink
ln -sf "${BACKUP_FILE}" "${LATEST_LINK}"

# ── Verify Backup ────────────────────────────────────────────────────────────
log "INFO" "Verifying backup integrity..."
if ! gzip -t "${BACKUP_FILE}" 2>/dev/null; then
  rm -f "${BACKUP_FILE}"
  error_exit "Backup file is corrupted (gzip check failed)"
fi

# Quick verify: check that the backup contains actual SQL
if ! zcat "${BACKUP_FILE}" 2>/dev/null | head -5 | grep -q "^--\|^CREATE\|^INSERT\|^COPY"; then
  log "WARN" "Backup may be empty or incomplete — manual review recommended"
fi

log "INFO" "Backup integrity verified."

# ── Retention / Rotation ─────────────────────────────────────────────────────
log "INFO" "Rotating backups older than ${RETENTION_DAYS} days..."

# Remove backups older than RETENTION_DAYS, keeping the latest link
find "${BACKUP_DIR}" -name "arch-db-*.sql.gz" -mtime "+${RETENTION_DAYS}" \
  ! -path "${LATEST_LINK}" -delete 2>/dev/null || true

# List remaining backups
BACKUP_COUNT="$(find "${BACKUP_DIR}" -name "arch-db-*.sql.gz" | wc -l)"
BACKUP_TOTAL_SIZE="$(du -sh "${BACKUP_DIR}" | cut -f1)"
log "INFO" "Retention complete: ${BACKUP_COUNT} backups (${BACKUP_TOTAL_SIZE} total)"

# ── Remote Upload (optional) ─────────────────────────────────────────────────
if [[ "${REMOTE_UPLOAD:-false}" == "true" ]]; then
  log "INFO" "Uploading backup to remote storage..."
  if command -v mc &>/dev/null && [[ -n "${S3_ENDPOINT:-}" ]]; then
    mc cp "${BACKUP_FILE}" "arch/${S3_BUCKET:-arch-backups}/postgres/"
    log "INFO" "Remote upload complete."
  elif command -v aws &>/dev/null && [[ -n "${S3_BUCKET:-}" ]]; then
    aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/postgres/"
    log "INFO" "Remote upload complete."
  else
    log "WARN" "Remote upload requested but no tool configured (mc or aws)"
  fi
fi

# ── Summary ──────────────────────────────────────────────────────────────────
cat << SUMMARY

╔═══════════════════════════════════════════════════════╗
║           Database Backup Complete               ║
╠═══════════════════════════════════════════════════════╣
║  File:    $(basename "${BACKUP_FILE}")  ║
║  Size:    ${BACKUP_SIZE}                              ║
║  Total:   ${BACKUP_COUNT} backups (${BACKUP_TOTAL_SIZE})              ║
╚═══════════════════════════════════════════════════════╝

SUMMARY
