#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

pkill -f "${PROJECT_ROOT}/node_modules/.bin/next dev" >/dev/null 2>&1 || true
pkill -f "netlify-cms-proxy-server" >/dev/null 2>&1 || true
pkill -f "auto-publish-content.sh" >/dev/null 2>&1 || true

for artifact_dir in "${PROJECT_ROOT}/.next" "${PROJECT_ROOT}/out"; do
  for attempt in 1 2 3; do
    rm -rf "${artifact_dir}" >/dev/null 2>&1 || true

    if [[ ! -e "${artifact_dir}" ]]; then
      break
    fi

    sleep 1
  done
done

echo "Stopped local Next.js, CMS proxy, and auto-publish processes for JobAdvice."
echo "Cleared stale Next.js build artifacts (.next, out)."
