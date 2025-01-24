
set -e

git submodule init
git submodule update

# Install vim-plug
curl -fLo $HOME/.vim/autoload/plug.vim --create-dirs \
    https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim

#cp -Rv ./.* $HOME/
#cp -Rv ./* $HOME/

