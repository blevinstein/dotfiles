#!/bin/bash
# Synthesizes a peon.sh event from a Cursor hook payload and pipes it to
# peon-ping's existing sound engine.
#
# Usage: peon-notify.sh <PeonEventName>   (e.g. Stop, PermissionRequest)
#
# Deliberately fail-open and silent: if peon-ping isn't installed on this
# machine, or the input can't be parsed, just exit 0 with no output. This
# script never sets a "permission" field, so it can never affect Cursor's
# actual allow/deny/ask decision for the tool call that triggered it.
set -u

event="${1:-Stop}"

if ! command -v peon >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
  cat >/dev/null 2>&1 || true
  exit 0
fi

input=$(cat)

cwd=$(printf '%s' "$input" | jq -r '.cwd // .workspace_roots[0] // ""' 2>/dev/null)
session_id=$(printf '%s' "$input" | jq -r '.session_id // .conversation_id // ""' 2>/dev/null)
tool_name=$(printf '%s' "$input" | jq -r '.tool_name // "Shell"' 2>/dev/null)

payload=$(jq -n \
  --arg event "$event" \
  --arg tool_name "$tool_name" \
  --arg cwd "$cwd" \
  --arg session_id "$session_id" \
  '{hook_event_name: $event, tool_name: $tool_name, cwd: $cwd, session_id: $session_id}' 2>/dev/null)

[ -n "$payload" ] || exit 0

printf '%s' "$payload" | peon >/dev/null 2>&1

exit 0
