#!/usr/bin/env bash
# Validate a project's LookML on a given git branch via the Looker API,
# without touching the Looker UI.
#
# - Switches the API session to the dev workspace, checks out the branch,
#   resets Looker's copy of it to the remote (i.e. what was just pushed),
#   then runs the LookML validator and prints the result.
# - Wraps every curl call in `vet curl` when `vet` is available, per this
#   machine's use-vet convention. Falls back to bare curl only if `vet` is
#   not installed.
#
# Usage:
#   validate_lookml.sh <project_id> <branch_name>
#
# Requires: LOOKER_BASE_URL, LOOKER_CLIENT_ID, LOOKER_CLIENT_SECRET (env)
#
# DANGER: reset_to_remote discards any unpushed changes in Looker's own dev
# workspace for that branch.
set -euo pipefail

PROJECT="${1:?usage: validate_lookml.sh <project_id> <branch_name>}"
BRANCH="${2:?usage: validate_lookml.sh <project_id> <branch_name>}"

if command -v vet >/dev/null 2>&1; then
  CURL=(vet curl)
else
  CURL=(curl)
fi

login() {
  LOOKER_TOKEN=$("${CURL[@]}" -sS --globoff -X POST \
    --data-urlencode "client_id=$LOOKER_CLIENT_ID" \
    --data-urlencode "client_secret=$LOOKER_CLIENT_SECRET" \
    "$LOOKER_BASE_URL/api/4.0/login" | jq -r '.access_token')
}
[[ -z "${LOOKER_TOKEN:-}" ]] && login

# Dev workspace is required to switch git branches / run validate.
"${CURL[@]}" -sS --globoff -X PATCH -H "Authorization: token $LOOKER_TOKEN" \
  -H "Content-Type: application/json" -d '{"workspace_id":"dev"}' \
  "$LOOKER_BASE_URL/api/4.0/session" >/dev/null

"${CURL[@]}" -sS --globoff -X PUT -H "Authorization: token $LOOKER_TOKEN" \
  -H "Content-Type: application/json" -d "{\"name\":\"$BRANCH\"}" \
  "$LOOKER_BASE_URL/api/4.0/projects/$PROJECT/git_branch" >/dev/null

"${CURL[@]}" -sS --globoff -X POST -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/projects/$PROJECT/reset_to_remote" >/dev/null

"${CURL[@]}" -sS --globoff -X POST -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/projects/$PROJECT/validate" | jq .
