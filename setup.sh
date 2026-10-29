#!/usr/bin/env bash

set -e

./install-packages.sh

git submodule init
git submodule update

# Install vim-plug
curl -fLo $HOME/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim

cp -Rv ./.* $HOME/
cp -Rv ./* $HOME/

# install deps for each node tool
for lockfile in $HOME/tools/*/package-lock.json; do
  (cd "$(dirname "$lockfile")" && npm ci)
done

