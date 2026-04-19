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
last_status_error_signature=""

read_content_status() {
  local status_output

  if ! status_output="$(git status --porcelain -- "${CONTENT_PATHS[@]}" 2>&1)"; then
    printf "%s" "${status_output}"
    return 1
  fi

  printf "%s" "${status_output}"
}

get_status_signature() {
  printf "%s" "$1" | sha1sum | cut -d' ' -f1
}

report_status_error() {
  local error_output="$1"
  local error_signature
  error_signature="$(get_status_signature "${error_output}")"

  if [[ "${error_signature}" == "${last_status_error_signature}" ]]; then
    return
  fi

  last_status_error_signature="${error_signature}"

  if [[ "${error_output}" == *".git/index.lock"* ]]; then
    echo "Auto publish paused: Git index is locked by .git/index.lock."
    echo "If no Git process is running, remove the stale lock file and retry."
  else
    echo "Auto publish paused: unable to inspect content changes."
  fi

  echo "${error_output}"
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

  if ! git add -A -- "${CONTENT_PATHS[@]}"; then
    echo "Unable to stage content changes."
    return 1
  fi

  if git diff --cached --quiet -- "${CONTENT_PATHS[@]}"; then
    echo "No publishable content changes found."
    return 1
  elif [[ $? -ne 1 ]]; then
    echo "Unable to inspect staged content changes."
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

startup_status=""
if startup_status="$(read_content_status)"; then
  last_status_error_signature=""
else
  report_status_error "${startup_status}"
  startup_status=""
fi

last_signature="$(get_status_signature "${startup_status}")"
if [[ -n "${startup_status}" ]]; then
  last_detected_at="$(date +%s)"
  echo "Existing local content changes detected at startup."
  echo "Waiting for edits to settle before auto publish."
fi

while true; do
  current_status=""
  if ! current_status="$(read_content_status)"; then
    report_status_error "${current_status}"
    sleep "${POLL_INTERVAL_SECONDS}"
    continue
  fi

  last_status_error_signature=""

  if [[ -n "${current_status}" ]]; then
    current_signature="$(get_status_signature "${current_status}")"
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
