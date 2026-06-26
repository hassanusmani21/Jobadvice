#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: bash ./scripts/sync-publishable-commit.sh <remote> <branch> <commit>"
  exit 1
fi

REMOTE_NAME="$1"
REMOTE_BRANCH="$2"
COMMIT_SHA="$3"
SOURCE_REPO_ROOT="$(git rev-parse --show-toplevel)"
TEMP_WORKTREE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/jobadvice-publish-sync.XXXXXX")"
REMOTE_URL="$(git remote get-url "${REMOTE_NAME}")"
PUBLISHABLE_PATHS=("content" "public/uploads")

uses_github_ssh() {
  [[ "${REMOTE_URL}" == git@github.com:* ]] ||
    [[ "${REMOTE_URL}" == ssh://git@github.com/* ]] ||
    [[ "${REMOTE_URL}" == ssh://git@ssh.github.com:* ]]
}

print_transport_hint() {
  if uses_github_ssh; then
    echo "Remote ${REMOTE_NAME} uses GitHub SSH." >&2
    echo "If port 22 is blocked, switch the remote to HTTPS or configure SSH over port 443 via ssh.github.com." >&2
  fi
}

cleanup() {
  git worktree remove --force "${TEMP_WORKTREE_DIR}" >/dev/null 2>&1 || true
  rm -rf "${TEMP_WORKTREE_DIR}"
}

trap cleanup EXIT

if ! git -C "${SOURCE_REPO_ROOT}" rev-parse --verify "${COMMIT_SHA}^{commit}" >/dev/null 2>&1; then
  echo "Commit ${COMMIT_SHA} does not exist in the source repository." >&2
  exit 1
fi

if ! git fetch "${REMOTE_NAME}" "${REMOTE_BRANCH}"; then
  echo "Failed to fetch ${REMOTE_NAME}/${REMOTE_BRANCH} before publishing." >&2
  print_transport_hint
  exit 1
fi

SOURCE_COMMIT_SUBJECT="$(git -C "${SOURCE_REPO_ROOT}" log -1 --format=%s "${COMMIT_SHA}")"
PUBLISH_COMMIT_MESSAGE="Publish content from ${COMMIT_SHA:0:7}: ${SOURCE_COMMIT_SUBJECT}"

ARCHIVE_PATHS=()
for publishable_path in "${PUBLISHABLE_PATHS[@]}"; do
  if git -C "${SOURCE_REPO_ROOT}" cat-file -e "${COMMIT_SHA}:${publishable_path}" 2>/dev/null; then
    ARCHIVE_PATHS+=("${publishable_path}")
  fi
done

git worktree add --detach "${TEMP_WORKTREE_DIR}" "${REMOTE_NAME}/${REMOTE_BRANCH}" >/dev/null

(
  cd "${TEMP_WORKTREE_DIR}"
  echo "Syncing publishable content snapshot from ${COMMIT_SHA:0:7} to ${REMOTE_NAME}/${REMOTE_BRANCH}..."

  git rm -r --quiet --ignore-unmatch -- "${PUBLISHABLE_PATHS[@]}" >/dev/null 2>&1 || true
  mkdir -p public

  if [[ ${#ARCHIVE_PATHS[@]} -gt 0 ]]; then
    git -C "${SOURCE_REPO_ROOT}" archive "${COMMIT_SHA}" -- "${ARCHIVE_PATHS[@]}" | tar -x -C "${TEMP_WORKTREE_DIR}"
  fi

  git add -A -- content public

  if git diff --cached --quiet -- content public; then
    echo "No publishable changes to push to ${REMOTE_NAME}/${REMOTE_BRANCH}."
    exit 0
  fi

  if ! git commit -m "${PUBLISH_COMMIT_MESSAGE}" >/dev/null; then
    echo "Failed to create a publishable content commit for ${REMOTE_NAME}/${REMOTE_BRANCH}." >&2
    exit 1
  fi

  if ! git push "${REMOTE_NAME}" HEAD:"${REMOTE_BRANCH}"; then
    echo "Failed to push publishable content to ${REMOTE_NAME}/${REMOTE_BRANCH}." >&2
    print_transport_hint
    exit 1
  fi
)
