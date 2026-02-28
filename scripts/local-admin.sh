#!/usr/bin/env bash

set -euo pipefail

cleanup() {
  if [[ -n "${DEV_PID:-}" ]]; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "${CMS_PID:-}" ]]; then
    kill "$CMS_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

bash "$(dirname "${BASH_SOURCE[0]}")/reset-local-dev.sh"

echo "Starting local JobAdvice admin workflow..."
echo "Next.js app: http://localhost:3000"
echo "Decap CMS:   http://localhost:3000/admin/"
echo
echo "If you want AI autofill locally, make sure Ollama is already running."
echo "If you want automatic GitHub push after publish, use:"
echo "  npm run local:admin:auto"
echo

npm run dev:local &
DEV_PID=$!

npm run cms:proxy &
CMS_PID=$!

wait -n "$DEV_PID" "$CMS_PID"
