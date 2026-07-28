#!/usr/bin/env bash
# Open follow-log terminals for local monitoring using tmux splits.
# Usage: bash scripts/open-monitoring-terminals.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORTAL_LOG="${REPO_ROOT}/portal.log"
STUDIO_URL="http://127.0.0.1:54323"

# Setup tmux session only if tmux is installed
if command -v tmux >/dev/null 2>&1; then
  # Kill existing monitor session if any
  tmux kill-session -t "arch-monitor" 2>/dev/null || true

  # Start new session, detached, running portal logs
  tmux new-session -d -s "arch-monitor" -n "Services" "echo -e '\033[1;35m=== PORTAL WEB SERVICE LOGS ===\033[0m' && tail -F '${PORTAL_LOG}'"

  # Split horizontally to create middle column
  tmux split-window -h -t "arch-monitor:0" "echo -e '\033[1;32m=== REDIS CACHE ENGINE LOGS ===\033[0m' && docker logs -f arch-redis"

  # Split middle column horizontally to create right column
  tmux split-window -h -t "arch-monitor:0.1" "clear && echo -e '\033[1;36m      /\\\\\n     /  \\\\\n    /\\\\\\   \\\\\n   /  __  \\\\\n  /  (  )  \\\\\n /  (    )  \\\\\n/____________\\\\\033[0m\n\033[1;34m   ARCH LINUX SYSTEMS MONITOR\033[0m\n' && (command -v htop >/dev/null && htop || top)"

  # Split middle column vertically to stack Supabase logs under Redis
  tmux split-window -v -t "arch-monitor:0.1" "echo -e '\033[1;36m=== SUPABASE GATEWAY LOGS ===\033[0m' && docker logs -f supabase_kong_supabase"

  # Split right column vertically to stack interactive CLI under resources
  tmux split-window -v -t "arch-monitor:0.2" "echo -e '\033[1;33m=== ARCH INTERACTIVE SHELL ===\033[0m\nUse this pane to execute workspace commands.\n' && bash"

  # Configure layout sizes
  tmux select-layout -t "arch-monitor" tiled
  tmux resize-pane -t "arch-monitor:0.0" -x "45%"
  tmux resize-pane -t "arch-monitor:0.1" -x "27%"
  tmux resize-pane -t "arch-monitor:0.2" -x "28%"

  # Apply styling to make it look "official"
  tmux set-option -t "arch-monitor" status-style "bg=colour235,fg=colour136" # Dark grey status bar, gold text
  tmux set-option -t "arch-monitor" status-left "#[fg=green,bold][Arch Systems] #[default]"
  tmux set-option -t "arch-monitor" status-right "#[fg=cyan]%Y-%m-%d #[fg=white,bold]%H:%M:%S#[default]"
  tmux set-option -t "arch-monitor" pane-border-style "fg=colour238"
  tmux set-option -t "arch-monitor" pane-active-border-style "fg=colour33" # Blue active border
fi

# Open terminal emulator and attach to session
open_terminal() {
  local title="Arch Systems Operations Center"
  local cmd="tmux attach-session -t arch-monitor"

  if command -v tmux >/dev/null 2>&1; then
    if command -v konsole >/dev/null 2>&1; then
      konsole --title "$title" -e bash -c "$cmd" >/dev/null 2>&1 &
      return 0
    fi
    if command -v kitty >/dev/null 2>&1; then
      kitty --title "$title" -e bash -c "$cmd" >/dev/null 2>&1 &
      return 0
    fi
    if command -v gnome-terminal >/dev/null 2>&1; then
      gnome-terminal --title="$title" -- bash -c "$cmd" >/dev/null 2>&1 &
      return 0
    fi
    if command -v x-terminal-emulator >/dev/null 2>&1; then
      x-terminal-emulator -T "$title" -e bash -c "$cmd" >/dev/null 2>&1 &
      return 0
    fi
  else
    # Fallback: If tmux is missing, use Konsole tabs if Konsole is available
    if command -v konsole >/dev/null 2>&1; then
      local tabs_file
      tabs_file=$(mktemp)
      echo "title: Portal Logs ;; command: bash -c \"echo -e '\\033[1;35m=== PORTAL WEB SERVICE ===\\033[0m' && tail -F '${PORTAL_LOG}'\"" > "$tabs_file"
      echo "title: Redis Logs ;; command: bash -c \"echo -e '\\033[1;32m=== REDIS CACHE ===\\033[0m' && docker logs -f arch-redis\"" >> "$tabs_file"
      echo "title: Supabase Logs ;; command: bash -c \"echo -e '\\033[1;36m=== SUPABASE GATEWAY ===\\033[0m' && docker logs -f supabase_kong_supabase\"" >> "$tabs_file"
      
      konsole --title "$title (Tabs Fallback)" --tabs-from-file "$tabs_file" >/dev/null 2>&1 &
      # Remove temp file after a short delay to allow Konsole to read it
      (sleep 3 && rm -f "$tabs_file") &
      return 0
    fi
  fi
  return 1
}

if open_terminal; then
  if ! command -v tmux >/dev/null 2>&1; then
    echo -e "  \033[0;33m\033[1m⚠\033[0m tmux not found in environment PATH. Opened Konsole tabs instead."
  else
    echo -e "  \033[0;32m\033[1m✓\033[0m Opened operations center terminal (tmux split-pane)"
  fi
  echo -e "  \033[0;2mStudio:\033[0m \033[0;36m${STUDIO_URL}\033[0m"
  exit 0
fi

echo -e "  \033[0;33m\033[1m⚠\033[0m No terminal emulator or tmux session attachment succeeded."
exit 0
