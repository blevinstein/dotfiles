#!/usr/bin/env bash
# Installs base CLI tools via brew (macOS), apt (Ubuntu), or dnf (Fedora/Nobara).

set -euo pipefail

COMMON=(ripgrep fzf jq tmux curl wget git)

if [[ "$(uname)" == Darwin ]]; then
  if ! command -v brew >/dev/null; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  for brew_bin in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    [[ -x "$brew_bin" ]] && eval "$("$brew_bin" shellenv)" && break
  done
  # ssh client and server ship with macOS
  brew install "${COMMON[@]}" node sqlite vim uv

  # iTerm2 reads its settings from the dotfiles repo; run before first launch
  defaults write com.googlecode.iterm2 PrefsCustomFolder -string "$HOME/.config/iterm2-prefs"
  defaults write com.googlecode.iterm2 LoadPrefsFromCustomFolder -bool true

elif command -v apt-get >/dev/null; then
  sudo apt-get update
  sudo apt-get install -y "${COMMON[@]}" \
    nodejs npm sqlite3 vim openssh-client openssh-server

elif command -v dnf >/dev/null; then
  sudo dnf install -y "${COMMON[@]}" \
    nodejs npm sqlite vim-enhanced openssh-clients openssh-server

else
  echo "No supported package manager found (brew, apt-get, dnf)" >&2
  exit 1
fi

# uv isn't packaged by apt, and by dnf only on some releases
if ! command -v uv >/dev/null && [[ ! -x "$HOME/.local/bin/uv" ]]; then
  # ~/.local/bin is already on PATH via .bash_linux
  curl -LsSf https://astral.sh/uv/install.sh | env UV_NO_MODIFY_PATH=1 sh
fi
