#!/usr/bin/env bash

set -euo pipefail

CONTENT_PATHS=("content" "public/uploads")
ALLOWED_STAGED_PATTERN='^(content/|public/uploads/)'
POLL_INTERVAL_SECONDS="${AUTO_PUBLISH_POLL_INTERVAL_SECONDS:-5}"
QUIET_PERIOD_SECONDS="${AUTO_PUBLISH_QUIET_PERIOD_SECONDS:-600}"
DEPLOY_REMOTE="${CONTENT_DEPLOY_REMOTE:-public}"
DEPLOY_BRANCH="${CONTENT_DEPLOY_BRANCH:-main}"

last_signature=""
last_detected_at=0

get_content_status() {
  git status --porcelain -- "${CONTENT_PATHS[@]}"
}

has_content_changes() {
  [[ -n "$(get_content_status)" ]]
}

get_content_signature() {
  get_content_status | sha1sum | cut -d' ' -f1
}

has_staged_non_content_files() {
  git diff --cached --name-only | grep -vE "${ALLOWED_STAGED_PATTERN}" >/dev/null 2>&1
}

notify_google_indexing_api() {
  local previous_commit="$1"
  local current_commit="$2"

  if ! node ./scripts/google-indexing-notify.mjs "${previous_commit}" "${current_commit}"; then
    echo "Google Indexing API notification failed. Content is already pushed."
  fi
}

publish_content() {
  if has_staged_non_content_files; then
    echo "Skipping auto publish: non-content files are already staged."
    return 1
  fi

  git add -A -- "${CONTENT_PATHS[@]}"

  if git diff --cached --quiet -- "${CONTENT_PATHS[@]}"; then
    echo "No publishable content changes found."
    return 1
  fi

  local commit_message
  commit_message="Auto publish content $(date '+%Y-%m-%d %H:%M:%S')"

  git commit -m "${commit_message}"
  local current_commit
  local previous_commit
  current_commit="$(git rev-parse HEAD)"
  previous_commit="$(git rev-parse HEAD^ 2>/dev/null || git hash-object -t tree /dev/null)"
  echo "Pushing deploy content to ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}..."
  if ! bash ./scripts/sync-publishable-commit.sh "${DEPLOY_REMOTE}" "${DEPLOY_BRANCH}" "${current_commit}"; then
    echo "Auto publish failed. Commit ${current_commit} is still local and was not pushed to ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}."
    return 1
  fi

  notify_google_indexing_api "${previous_commit}" "${current_commit}"
  echo "Auto publish complete. Netlify will deploy from ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}."
  return 0
}

echo "Watching content/ and public/uploads/ for published changes..."
echo "Quiet period: ${QUIET_PERIOD_SECONDS}s | Poll interval: ${POLL_INTERVAL_SECONDS}s"

last_signature="$(get_content_signature)"
if has_content_changes; then
  echo "Existing local content changes detected at startup."
  echo "Auto publish will wait for the next content change after startup."
fi

while true; do
  if has_content_changes; then
    current_signature="$(get_content_signature)"
    current_time="$(date +%s)"

    if [[ "${current_signature}" != "${last_signature}" ]]; then
      last_signature="${current_signature}"
      last_detected_at="${current_time}"
      echo "Detected content change. Waiting for edits to settle..."
    elif (( current_time - last_detected_at >= QUIET_PERIOD_SECONDS )); then
      if publish_content; then
        last_signature=""
        last_detected_at=0
      else
        last_detected_at="${current_time}"
      fi
    fi
  else
    last_signature=""
    last_detected_at=0
  fi

  sleep "${POLL_INTERVAL_SECONDS}"
done
