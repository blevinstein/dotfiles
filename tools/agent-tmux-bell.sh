#!/bin/bash
# Rings a terminal bell in the current tmux pane so tmux's built-in
# monitor-bell flags the containing window in the status bar. Used as an
# agent hook (Cursor + Claude Code) to flag panes waiting on input/approval.
#
# Relies entirely on tmux defaults (monitor-bell on, window-status-bell-style
# reverse) -- no ~/.tmux.conf changes needed. No-ops cleanly outside tmux.
cat >/dev/null 2>&1 || true

[ -n "${TMUX:-}" ] && [ -n "${TMUX_PANE:-}" ] || exit 0

pane_tty=$(tmux display-message -p -t "$TMUX_PANE" '#{pane_tty}' 2>/dev/null) || exit 0
[ -n "$pane_tty" ] && printf '\a' > "$pane_tty" 2>/dev/null

exit 0
