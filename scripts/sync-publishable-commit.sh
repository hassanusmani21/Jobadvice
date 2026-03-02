#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: bash ./scripts/sync-publishable-commit.sh <remote> <branch> <commit>"
  exit 1
fi

REMOTE_NAME="$1"
REMOTE_BRANCH="$2"
COMMIT_SHA="$3"
TEMP_WORKTREE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/jobadvice-publish-sync.XXXXXX")"

cleanup() {
  git worktree remove --force "${TEMP_WORKTREE_DIR}" >/dev/null 2>&1 || true
  rm -rf "${TEMP_WORKTREE_DIR}"
}

trap cleanup EXIT

git fetch "${REMOTE_NAME}" "${REMOTE_BRANCH}"
git worktree add --detach "${TEMP_WORKTREE_DIR}" "${REMOTE_NAME}/${REMOTE_BRANCH}" >/dev/null

(
  cd "${TEMP_WORKTREE_DIR}"
  git cherry-pick "${COMMIT_SHA}" >/dev/null
  git push "${REMOTE_NAME}" HEAD:"${REMOTE_BRANCH}"
)
