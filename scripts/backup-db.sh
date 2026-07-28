#!/usr/bin/env bash
# ── Automated PostgreSQL Backup Routine ──────────────────────────────────────
set -euo pipefail

BACKUP_DIR="${HOME}/backups/postgres"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

echo "[Backup] Creating PostgreSQL database backup at $BACKUP_FILE..."

if docker ps --format '{{.Names}}' | grep -qx 'supabase_db_supabase'; then
  docker exec supabase_db_supabase pg_dumpall -U postgres | gzip > "$BACKUP_FILE"
  echo "[Backup] Successfully created database backup: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  echo "[Backup] Error: supabase_db_supabase container is not running." >&2
  exit 1
fi

# Retain backups for 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
echo "[Backup] Maintenance complete."
