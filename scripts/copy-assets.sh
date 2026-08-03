#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Arch-Systems — Copy Shared Assets
# Syncs root assets/ to apps/portal/public/assets/ as a single source of truth.
# Called by dev.sh during Phase 1d.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO_ROOT/assets"
DST="$REPO_ROOT/apps/portal/public/assets"

if [ ! -d "$SRC" ]; then
  echo "[copy-assets] WARNING: Source directory $SRC does not exist. Skipping."
  exit 0
fi

mkdir -p "$DST"
rsync -a --delete "$SRC/" "$DST/"
echo "[copy-assets] Synced $SRC → $DST"
