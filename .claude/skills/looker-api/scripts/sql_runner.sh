#!/usr/bin/env bash
# Run ad-hoc SQL against a Looker connection via the SQL Runner API.
#
# - Auto-logs in if LOOKER_TOKEN is unset, and auto-retries once with a fresh
#   login if the token turns out to be expired (the "slug=null" gotcha).
# - Wraps every curl call in `vet curl` when `vet` is available, per this
#   machine's use-vet convention. Falls back to bare curl only if `vet` is
#   not installed.
#
# Usage:
#   echo "$SQL" | sql_runner.sh <connection_name> -
#   sql_runner.sh <connection_name> path/to/query.sql
#
# Requires: LOOKER_BASE_URL, LOOKER_CLIENT_ID, LOOKER_CLIENT_SECRET (env)
set -euo pipefail

CONN="${1:?usage: sql_runner.sh <connection_name> <sql-file-or-'-'>}"
SRC="${2:?usage: sql_runner.sh <connection_name> <sql-file-or-'-'>}"

if [[ "$SRC" == "-" ]]; then
  SQL="$(cat)"
else
  SQL="$(cat "$SRC")"
fi

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

create_query() {
  local body
  body=$(jq -n --arg sql "$SQL" --arg conn "$CONN" '{connection_name: $conn, sql: $sql}')
  "${CURL[@]}" -sS --globoff -X POST -H "Authorization: token $LOOKER_TOKEN" \
    -H "Content-Type: application/json" -d "$body" \
    "$LOOKER_BASE_URL/api/4.0/sql_queries"
}

CREATE_RESP=$(create_query)
SLUG=$(echo "$CREATE_RESP" | jq -r '.slug // empty')

if [[ -z "$SLUG" ]]; then
  # Most likely an expired token -- refresh and retry once before giving up.
  login
  CREATE_RESP=$(create_query)
  SLUG=$(echo "$CREATE_RESP" | jq -r '.slug // empty')
fi

if [[ -z "$SLUG" ]]; then
  echo "Failed to create SQL query: $CREATE_RESP" >&2
  exit 1
fi

"${CURL[@]}" -sS --globoff -X POST -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/sql_queries/$SLUG/run/json" | jq .
