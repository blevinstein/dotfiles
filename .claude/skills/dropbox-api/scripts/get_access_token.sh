#!/usr/bin/env bash
# Mints a short-lived Dropbox access token from DROPBOX_REFRESH_TOKEN,
# caching it until shortly before it expires. Prints the access token to stdout.
set -euo pipefail

: "${DROPBOX_APP_KEY:?DROPBOX_APP_KEY not set}"
: "${DROPBOX_APP_SECRET:?DROPBOX_APP_SECRET not set}"
: "${DROPBOX_REFRESH_TOKEN:?DROPBOX_REFRESH_TOKEN not set}"

CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/dropbox-skill"
CACHE_FILE="$CACHE_DIR/token.json"
mkdir -p "$CACHE_DIR"

CURL=(curl -s)
if command -v vet >/dev/null 2>&1; then
  CURL=(vet curl -s)
fi

now=$(date +%s)

if [[ -f "$CACHE_FILE" ]]; then
  cached_token=$(jq -r '.access_token // empty' "$CACHE_FILE" 2>/dev/null || true)
  cached_expiry=$(jq -r '.expires_at // 0' "$CACHE_FILE" 2>/dev/null || echo 0)
  if [[ -n "$cached_token" && "$now" -lt "$cached_expiry" ]]; then
    echo "$cached_token"
    exit 0
  fi
fi

response=$("${CURL[@]}" https://api.dropboxapi.com/oauth2/token \
  -d grant_type=refresh_token \
  -d refresh_token="$DROPBOX_REFRESH_TOKEN" \
  -d client_id="$DROPBOX_APP_KEY" \
  -d client_secret="$DROPBOX_APP_SECRET")

access_token=$(echo "$response" | jq -r '.access_token // empty')
expires_in=$(echo "$response" | jq -r '.expires_in // 0')

if [[ -z "$access_token" ]]; then
  echo "Failed to refresh Dropbox access token: $response" >&2
  exit 1
fi

# 2 min safety buffer before actual expiry
expires_at=$((now + expires_in - 120))

jq -n --arg t "$access_token" --argjson e "$expires_at" '{access_token: $t, expires_at: $e}' > "$CACHE_FILE"
chmod 600 "$CACHE_FILE"

echo "$access_token"
