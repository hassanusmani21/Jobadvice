#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: npm run publish:content -- \"Commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"
CONTENT_PATHS=("content" "public/uploads")
ALLOWED_STAGED_PATTERN='^(content/|public/uploads/)'
DEPLOY_REMOTE="${CONTENT_DEPLOY_REMOTE:-public}"
DEPLOY_BRANCH="${CONTENT_DEPLOY_BRANCH:-main}"

get_content_status() {
  git status --porcelain -- "${CONTENT_PATHS[@]}"
}

notify_google_indexing_api() {
  local previous_commit="$1"
  local current_commit="$2"

  if ! node ./scripts/google-indexing-notify.mjs "${previous_commit}" "${current_commit}"; then
    echo "Google Indexing API notification failed. Content is already pushed."
  fi
}

if [[ -z "$(get_content_status)" ]]; then
  echo "No content changes found in content/ or public/uploads/."
  exit 1
fi

STAGED_NON_CONTENT_FILES="$(git diff --cached --name-only | grep -vE "${ALLOWED_STAGED_PATTERN}" || true)"

if [[ -n "${STAGED_NON_CONTENT_FILES}" ]]; then
  echo "Refusing to publish content because non-content files are already staged:"
  echo "${STAGED_NON_CONTENT_FILES}"
  echo
  echo "Unstage those files first, then run publish:content again."
  exit 1
fi

echo "Running checks before publish..."
npm run lint
npm run build

echo "Staging reviewed content..."
git add -A -- "${CONTENT_PATHS[@]}"

if git diff --cached --quiet -- "${CONTENT_PATHS[@]}"; then
  echo "Nothing to commit after staging content changes."
  exit 1
fi

STAGED_NON_CONTENT_FILES="$(git diff --cached --name-only | grep -vE "${ALLOWED_STAGED_PATTERN}" || true)"

if [[ -n "${STAGED_NON_CONTENT_FILES}" ]]; then
  echo "Refusing to commit because non-content files are staged:"
  echo "${STAGED_NON_CONTENT_FILES}"
  echo
  echo "Only content/ and public/uploads/ are allowed in publish:content."
  exit 1
fi

echo "Creating commit..."
git commit -m "$COMMIT_MESSAGE"
CURRENT_COMMIT="$(git rev-parse HEAD)"
PREVIOUS_COMMIT="$(git rev-parse HEAD^ 2>/dev/null || git hash-object -t tree /dev/null)"

echo "Pushing deploy content to ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}..."
bash ./scripts/sync-publishable-commit.sh "${DEPLOY_REMOTE}" "${DEPLOY_BRANCH}" "${CURRENT_COMMIT}"

echo "Sending Google job indexing notifications..."
notify_google_indexing_api "${PREVIOUS_COMMIT}" "${CURRENT_COMMIT}"

echo "Content pushed. Netlify will deploy from ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}."
