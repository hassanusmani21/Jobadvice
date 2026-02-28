#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

pkill -f "${PROJECT_ROOT}/node_modules/.bin/next dev" >/dev/null 2>&1 || true
pkill -f "netlify-cms-proxy-server" >/dev/null 2>&1 || true

echo "Stopped local Next.js and CMS proxy processes for JobAdvice."
