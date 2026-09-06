#!/usr/bin/env bash
#
# Save the full scrollback of a tmux pane to a file.
#
# Usage: save-pane.sh [FILE] [-t TARGET_PANE]
#
#   FILE         output path (default: ~/tmux_history.txt)
#   TARGET_PANE  tmux pane to capture (default: the current pane)

set -euo pipefail

outfile="$HOME/tmux_history.txt"
target=""

while [ $# -gt 0 ]; do
  case "$1" in
    -t)
      target="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '3,9p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *)
      outfile="$1"
      shift
      ;;
  esac
done

if ! command -v tmux >/dev/null 2>&1; then
  echo "save-pane.sh: tmux not found" >&2
  exit 1
fi

if [ -z "${TMUX:-}" ] && [ -z "$target" ]; then
  echo "save-pane.sh: not inside tmux; pass -t TARGET_PANE" >&2
  exit 1
fi

# -S - starts at the beginning of the history; -J unwraps wrapped lines.
capture=(capture-pane -S - -J)
[ -n "$target" ] && capture+=(-t "$target")

tmux "${capture[@]}" \; save-buffer "$outfile" \; delete-buffer

echo "Saved pane contents to $outfile ($(wc -l < "$outfile") lines)"
