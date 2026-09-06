#!/usr/bin/env bash
#
# Save the full scrollback of a tmux pane to a file, the clipboard, or stdout.
#
# Usage: save-pane.sh [FILE|-] [-c] [-t TARGET_PANE]
#
#   FILE         output path (default: ~/tmux_history.txt)
#   -            write to stdout instead, for piping
#   -c           copy to the system clipboard instead of writing a file
#   -t TARGET_PANE  tmux pane to capture (default: the current pane)

set -euo pipefail

outfile="$HOME/tmux_history.txt"
target=""
sink="file"

while [ $# -gt 0 ]; do
  case "$1" in
    -c|--clipboard)
      sink="clipboard"
      shift
      ;;
    -)
      sink="stdout"
      shift
      ;;
    -t)
      target="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '3,11p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *)
      outfile="$1"
      sink="file"
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

# Capture the pane and write it to stdout.
# -S - starts at the beginning of the history; -J unwraps wrapped lines.
capture_pane() {
  local capture=(capture-pane -S - -J)
  [ -n "$target" ] && capture+=(-t "$target")
  tmux "${capture[@]}" \; save-buffer - \; delete-buffer
}

# Copy stdin to the system clipboard, using whichever tool this box has.
# tmux's own OSC 52 (load-buffer -w) is the last resort but the most portable:
# it goes through the terminal emulator, so it works over ssh with no X/Wayland.
copy_to_clipboard() {
  if command -v wl-copy >/dev/null 2>&1; then
    wl-copy
  elif command -v xclip >/dev/null 2>&1; then
    xclip -selection clipboard
  elif command -v xsel >/dev/null 2>&1; then
    xsel --clipboard --input
  elif command -v pbcopy >/dev/null 2>&1; then
    pbcopy
  elif command -v clip.exe >/dev/null 2>&1; then
    clip.exe
  else
    tmux load-buffer -w - \; delete-buffer
  fi
}

case "$sink" in
  stdout)
    capture_pane
    ;;
  clipboard)
    capture_pane | copy_to_clipboard
    echo "Copied pane contents to the clipboard" >&2
    ;;
  file)
    capture_pane > "$outfile"
    echo "Saved pane contents to $outfile ($(wc -l < "$outfile") lines)"
    ;;
esac
