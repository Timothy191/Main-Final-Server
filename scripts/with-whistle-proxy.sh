#!/usr/bin/env bash
# Helper script to launch dev processes using Whistle proxy on port 8899
export HTTP_PROXY="http://127.0.0.1:8899"
export HTTPS_PROXY="http://127.0.0.1:8899"
export http_proxy="http://127.0.0.1:8899"
export https_proxy="http://127.0.0.1:8899"

echo "[Whistle Proxy] Traffic auto-routed via http://127.0.0.1:8899"
exec "$@"
