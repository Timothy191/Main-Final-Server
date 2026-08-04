#!/usr/bin/env bash
#
# Apply Arch-System's Supabase migrations to a remote/other database.
#
# The repo is local-first, but when pointing the portal at an external Supabase
# instance you must replay packages/supabase/migrations/ onto it. This helper
# does exactly that with the Supabase CLI.
#
# Usage:
#   bash scripts/migrate-remote-db.sh "postgresql://USER:PASS@HOST:6543/postgres"
#   SUPABASE_REMOTE_DB_URL="postgresql://..." bash scripts/migrate-remote-db.sh
#
# Notes:
#   - Do NOT hardcode secrets (the URL arg is intentionally NOT stored here).
#   - Use the pooler/direct DSN that the target exposes (e.g. 6543 pooler).
#   - The Supabase pooler requires the role as `postgres.<project>` (e.g.
#     postgres.arch_sys_db).
#   - Run from repo root so it finds packages/supabase/migrations.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_DIR="$REPO_ROOT/packages/supabase"

DB_URL="${1:-${SUPABASE_REMOTE_DB_URL:-}}"
if [ -z "$DB_URL" ]; then
  echo "Usage: bash scripts/migrate-remote-db.sh \"postgresql://USER:PASS@HOST:PORT/postgres\""
  echo "   or: SUPABASE_REMOTE_DB_URL=\"postgresql://...\" bash scripts/migrate-remote-db.sh"
  exit 1
fi

echo "Applying migrations from $SUPABASE_DIR to target database..."
echo "(this may take a while; Supavisor circuit-breaker may temporarily reject new links)"
cd "$SUPABASE_DIR"
npx --yes supabase@latest db push --db-url "$DB_URL"
echo "✅ Migrations applied."
