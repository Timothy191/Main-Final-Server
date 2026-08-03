#!/bin/bash
# =============================================================================
# Arch Systems — Alertmanager Entrypoint
# =============================================================================
# Substitutes environment variables in alertmanager.yaml before starting
# Alertmanager. Uses envsubst (from GNU gettext) to replace ${VAR_NAME}
# patterns with actual environment variable values.
#
# Required env vars:
#   SLACK_API_URL          — Slack incoming webhook URL
#   PAGERDUTY_ROUTING_KEY  — PagerDuty integration key (for critical alerts)
#
# Optional env vars:
#   ALERTMANAGER_CONFIG    — Path to config template (default: /etc/alertmanager/alertmanager.yaml)
#   SMTP_HOST              — SMTP server for email notifications (default: localhost:25)
#   SMTP_FROM              — Sender email address
# =============================================================================

set -euo pipefail

# Ensure envsubst or sed fallback is available
USE_SED=0
if ! command -v envsubst &> /dev/null; then
  if command -v apk &> /dev/null; then
    echo "[INFO] Installing gettext (envsubst)..."
    apk add --no-cache gettext
  else
    echo "[INFO] envsubst/apk not found, using sed fallback for variable substitution."
    USE_SED=1
  fi
fi

CONFIG_TEMPLATE="${ALERTMANAGER_CONFIG_TEMPLATE:-/etc/alertmanager/alertmanager.yaml.tmpl}"
CONFIG_OUTPUT="${ALERTMANAGER_CONFIG:-/etc/alertmanager/alertmanager.yaml}"

# ---------------------------------------------------------------------------
# Validate required env vars
# ---------------------------------------------------------------------------
if [ -z "${SLACK_API_URL:-}" ]; then
  echo "[WARN] SLACK_API_URL is not set. Slack notifications will use default placeholder URL."
  echo "       Set SLACK_API_URL to your Slack incoming webhook URL."
fi

if [ -z "${PAGERDUTY_ROUTING_KEY:-}" ]; then
  echo "[WARN] PAGERDUTY_ROUTING_KEY is not set. PagerDuty notifications will fail."
  echo "       Set PAGERDUTY_ROUTING_KEY to your PagerDuty integration key."
fi

# ---------------------------------------------------------------------------
# Substitute environment variables in the config template
# ---------------------------------------------------------------------------
echo "[INFO] Substituting env vars in ${CONFIG_TEMPLATE} → ${CONFIG_OUTPUT}"

# Export values with defaults for envsubst
export SLACK_API_URL="${SLACK_API_URL:-http://localhost:9093/webhook/slack}"
export PAGERDUTY_ROUTING_KEY="${PAGERDUTY_ROUTING_KEY:-PLACEHOLDER_PAGERDUTY_KEY}"
export SMTP_SMARTHOST="${SMTP_HOST:-localhost:25}"
export SMTP_FROM="${SMTP_FROM:-alertmanager@archsystems.local}"

if [ "${USE_SED}" -eq 1 ]; then
  sed -e "s|\${SLACK_API_URL}|${SLACK_API_URL}|g" \
      -e "s|\${PAGERDUTY_ROUTING_KEY}|${PAGERDUTY_ROUTING_KEY}|g" \
      -e "s|\${SMTP_SMARTHOST}|${SMTP_SMARTHOST}|g" \
      -e "s|\${SMTP_FROM}|${SMTP_FROM}|g" \
      "${CONFIG_TEMPLATE}" > "${CONFIG_OUTPUT}"
else
  envsubst '${SLACK_API_URL} ${PAGERDUTY_ROUTING_KEY} ${SMTP_SMARTHOST} ${SMTP_FROM}' \
    < "${CONFIG_TEMPLATE}" \
    > "${CONFIG_OUTPUT}"
fi

echo "[INFO] Config written to ${CONFIG_OUTPUT}"

# ---------------------------------------------------------------------------
# Validate the output YAML (optional, requires yq or similar tool)
# ---------------------------------------------------------------------------
if command -v yq &> /dev/null; then
  echo "[INFO] Validating output YAML..."
  yq eval "${CONFIG_OUTPUT}" > /dev/null && echo "[OK] YAML is valid" || echo "[WARN] YAML validation failed"
fi

# ---------------------------------------------------------------------------
# Start Alertmanager
# ---------------------------------------------------------------------------
echo "[INFO] Starting Alertmanager..."
exec /bin/alertmanager "$@"
