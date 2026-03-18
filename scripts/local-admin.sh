#!/usr/bin/env bash

set -euo pipefail

cleanup() {
  if [[ -n "${DEV_PID:-}" ]]; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

bash "$(dirname "${BASH_SOURCE[0]}")/reset-local-dev.sh"

echo "Starting local JobAdvice admin workflow..."
echo "Site:      http://localhost:3000"
echo "Admin app: http://localhost:3000/admin/"
echo
echo "If you want AI autofill locally, make sure Ollama is already running."
echo "If you want automatic GitHub push after publish, use:"
echo "  npm run local:admin:auto"
echo

npm run dev:local &
DEV_PID=$!

wait "$DEV_PID"
