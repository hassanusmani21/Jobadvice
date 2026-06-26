#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/.local/logs"
AUTO_PUBLISH_LOG="${LOG_DIR}/auto-publish.log"
QUIET_PERIOD_SECONDS="${AUTO_PUBLISH_QUIET_PERIOD_SECONDS:-600}"
POLL_INTERVAL_SECONDS="${AUTO_PUBLISH_POLL_INTERVAL_SECONDS:-5}"

cleanup() {
  if [[ -n "${DEV_PID:-}" ]]; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "${AUTO_PUBLISH_PID:-}" ]]; then
    kill "$AUTO_PUBLISH_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

bash "$(dirname "${BASH_SOURCE[0]}")/reset-local-dev.sh"
mkdir -p "${LOG_DIR}"
rm -f "${AUTO_PUBLISH_LOG}"

echo "Starting local JobAdvice admin with auto publish..."
echo "Site:        http://localhost:3000"
echo "Admin app:   http://localhost:3000/admin/"
echo "Auto push:   enabled for content/ and public/uploads/"
echo "Auto wait:   ${QUIET_PERIOD_SECONDS}s quiet period, ${POLL_INTERVAL_SECONDS}s poll"
echo "Auto log:    ${AUTO_PUBLISH_LOG}"
echo
echo "If you want AI autofill locally, ensure Ollama is already running."
echo

npm run dev:local &
DEV_PID=$!

AUTO_PUBLISH_QUIET_PERIOD_SECONDS="${QUIET_PERIOD_SECONDS}" \
AUTO_PUBLISH_POLL_INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS}" \
npm run auto:publish >>"${AUTO_PUBLISH_LOG}" 2>&1 &
AUTO_PUBLISH_PID=$!

wait -n "$DEV_PID" "$AUTO_PUBLISH_PID"
