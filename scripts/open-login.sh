#!/usr/bin/env bash
# Open the portal login page in the system browser.
# Usage: bash scripts/open-login.sh [PORT]
set -euo pipefail

PORT="${1:-${PORT:-3000}}"
URL="http://localhost:${PORT}/login"

DIM='\033[0;2m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# Prefer real browsers before generic openers (xdg-open can noop in some sessions)
CANDIDATES=(
  chromium
  chromium-browser
  google-chrome
  google-chrome-stable
  brave
  brave-browser
  firefox
  xdg-open
  open
)

opened_with=""
for cmd in "${CANDIDATES[@]}"; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    continue
  fi
  case "$cmd" in
    chromium|chromium-browser|google-chrome|google-chrome-stable|brave|brave-browser)
      # new-window avoids reusing a background profile silently
      nohup "$cmd" --new-window "$URL" >/dev/null 2>&1 &
      ;;
    firefox)
      nohup "$cmd" --new-window "$URL" >/dev/null 2>&1 &
      ;;
    *)
      nohup "$cmd" "$URL" >/dev/null 2>&1 &
      ;;
  esac
  opened_with="$cmd"
  break
done

if [ -n "$opened_with" ]; then
  echo -e "  ${GREEN}${BOLD}✓${NC} Browser opened via ${CYAN}${opened_with}${NC} → ${BOLD}${URL}${NC}"
  exit 0
fi

echo -e "  ${YELLOW}${BOLD}⚠${NC} No browser found. Open manually: ${BOLD}${URL}${NC}"
echo -e "  ${DIM}Tried: ${CANDIDATES[*]}${NC}"
exit 1
