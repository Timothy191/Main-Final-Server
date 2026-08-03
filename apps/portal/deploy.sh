#!/usr/bin/env bash
set -euo pipefail

# Ensure we are in the project root
cd "$(dirname "$0")"

# Verify required tools
for cmd in pnpm git; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: $cmd is not installed" >&2
    exit 1
  fi
done

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build
echo "Building application..."
pnpm build

# Start server in background
echo "Starting server..."
pnpm start &
SERVER_PID=$!
# Wait for server to be ready (check port 3000)
echo "Waiting for server to start..."
while ! curl -s http://localhost:3000 >/dev/null; do
  sleep 2
done
echo "Server is up."

# Open login page
echo "Opening login page..."
xdg-open http://localhost:3000/login &

# Print checklist
cat << 'EOF'

=== Deployment Checklist ===
1. Verify server is running (process ID: $SERVER_PID)
2. Confirm login page opened in browser
3. Check environment variables are correct (`.env` file)
4. Ensure database migrations have run (if applicable)
5. Verify that all CI tests pass (`pnpm test`)
6. Confirm that the application is accessible at http://localhost:3000
7. Review logs for any warnings or errors
7. If everything looks good, mark deployment as complete.

EOF