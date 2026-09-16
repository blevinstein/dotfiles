---
name: dropbox-api
description: Read and write files in Dropbox via the Dropbox HTTP API v2, using OAuth refresh-token credentials. Use when the user asks to list, search, download, upload, move, delete, or share files/folders in Dropbox, or mentions Dropbox paths or shared links.
---

# Dropbox API

## Prerequisites

Three env vars must be set:

| Variable | Purpose |
|---|---|
| `DROPBOX_APP_KEY` | OAuth `client_id`, from the app's Settings tab in the [App Console](https://www.dropbox.com/developers/apps) |
| `DROPBOX_APP_SECRET` | OAuth `client_secret`, same tab |
| `DROPBOX_REFRESH_TOKEN` | Long-lived refresh token from the one-time OAuth authorization (see "One-time setup" below) |

Verify before use:

```bash
echo "DROPBOX_APP_KEY=${DROPBOX_APP_KEY:+set}" "DROPBOX_APP_SECRET=${DROPBOX_APP_SECRET:+set}" "DROPBOX_REFRESH_TOKEN=${DROPBOX_REFRESH_TOKEN:+set}"
```

If any are missing, stop and follow "One-time setup" below rather than guessing at credentials.

## GUARDRAILS — writing to Dropbox

**Never upload, overwrite, move, rename, delete, or create/modify shared links or folders without explicit user instruction for that specific action.** Reading, listing, searching, and downloading are fine to do proactively. Before any write, confirm the target path with the user; after any write, report the resulting path (or shared link) back to them.

## Getting an access token

Access tokens expire after 4 hours. Use the helper script rather than reimplementing the refresh dance — it mints a fresh token from `DROPBOX_REFRESH_TOKEN` and caches it (with expiry) in `~/.cache/dropbox-skill/token.json` so repeated calls in a session don't re-hit the token endpoint:

```bash
ACCESS_TOKEN=$(~/.claude/skills/dropbox-api/scripts/get_access_token.sh)
```

## Making API calls

Three endpoint styles, on two domains — get this right or calls silently fail:

| Style | Domain | Args passed via | Body |
|---|---|---|---|
| RPC | `api.dropboxapi.com` | JSON request body | JSON response |
| Content-upload | `content.dropboxapi.com` | `Dropbox-API-Arg` header | binary request body; JSON response |
| Content-download | `content.dropboxapi.com` | `Dropbox-API-Arg` header | binary response body; JSON in `Dropbox-API-Result` response header |

```bash
# RPC example — list a folder ("" is root, not "/")
curl -s -X POST https://api.dropboxapi.com/2/files/list_folder \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"path": "/Reports"}' | jq '.entries[] | {name, path_display, ".tag"}'

# Content-download example
curl -s -X POST https://content.dropboxapi.com/2/files/download \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header 'Dropbox-API-Arg: {"path": "/Reports/q3.pdf"}' \
  -o q3.pdf

# Content-upload example (guardrail: confirm target path with user first)
curl -s -X POST https://content.dropboxapi.com/2/files/upload \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --header 'Dropbox-API-Arg: {"path": "/Reports/q3.pdf", "mode": "add", "autorename": true}' \
  --header "Content-Type: application/octet-stream" \
  --data-binary @q3.pdf | jq .
```

Parse responses with `jq`. Fall back to `python3 -c "import sys,json; ..."` only if `jq` is unavailable.

## Common endpoints

| Task | Endpoint | Style |
|---|---|---|
| List folder | `/2/files/list_folder` (+ `/2/files/list_folder/continue` for pagination) | RPC |
| Get metadata | `/2/files/get_metadata` | RPC |
| Search | `/2/files/search_v2` | RPC |
| Download | `/2/files/download` | Content-download |
| Upload (< 150 MB) | `/2/files/upload` | Content-upload |
| Create folder | `/2/files/create_folder_v2` | RPC |
| Move/rename | `/2/files/move_v2` | RPC |
| Delete | `/2/files/delete_v2` | RPC |
| Create shared link | `/2/sharing/create_shared_link_with_settings` | RPC |
| List shared links | `/2/sharing/list_shared_links` | RPC |
| Current account info | `/2/users/get_current_account` | RPC |

Full reference: https://developers.dropbox.com/documentation/http/documentation — fetch the specific endpoint's doc page before building a request body from memory; argument shapes (e.g. `WriteMode`, `SearchOptions`) are verbose and easy to get subtly wrong.

## Gotchas

- Root path is `""`, not `"/"`. Paths are case-insensitive but case-preserving; use `path_lower` for comparisons.
- `401` → access token expired or revoked; re-run `get_access_token.sh` (it forces a refresh since the cached one clearly failed).
- Most Dropbox API errors (bad path, conflict, malformed arg) come back as **HTTP 409**, not the 4xx you'd expect from the error type — always inspect the JSON `error` field in the body, not just the status code.
- `list_folder` truncates large folders; check `has_more` and page with `/2/files/list_folder/continue` using the returned `cursor`.
- Scopes are locked in at the App Console's Permissions tab (must click **Submit**) and only take effect on **new** OAuth authorizations — changing scopes doesn't retroactively upgrade an existing refresh token; re-run step 4–6 of "One-time setup" below to pick up new scopes.

## One-time setup

1. Create an app at the [App Console](https://www.dropbox.com/developers/apps): **Scoped access** → **Full Dropbox** → name it → Create.
2. Permissions tab: check `account_info.read`, `files.metadata.read`, `files.metadata.write`, `files.content.read`, `files.content.write`, `sharing.read`, `sharing.write` → **Submit**.
3. Settings tab: copy **App key** (`client_id`) and **App secret** (`client_secret`). Leave Redirect URIs blank — the no-redirect flow below avoids needing a local server.
4. Authorize (code is shown on-page for copy/paste since no `redirect_uri` is set):
   ```bash
   open "https://www.dropbox.com/oauth2/authorize?client_id=$DROPBOX_APP_KEY&response_type=code&token_access_type=offline"
   ```
5. Exchange the code once for a refresh token:
   ```bash
   curl -s https://api.dropboxapi.com/oauth2/token \
     -d code=<CODE_FROM_PAGE> -d grant_type=authorization_code \
     -d client_id="$DROPBOX_APP_KEY" -d client_secret="$DROPBOX_APP_SECRET" | jq .
   ```
6. Store the three values (`DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REFRESH_TOKEN`) in the appropriate bash init scripts or other key storage.

The button labeled "Generate" on the app's Settings page is a shortcut that skips this whole flow but only produces a short-lived (4h) access token with no refresh token — fine for a one-off manual test, useless for a durable skill.
