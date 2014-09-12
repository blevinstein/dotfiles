#!/usr/bin/env bash
# OS-specific bash settings
if [[ `uname` == 'Darwin' ]]; then
  source ~/.bash_osx
fi
if [[ `uname` == 'Linux' ]]; then
  source ~/.bash_linux
fi

# multiple-OS compatible bash settings
source ~/.bash_compat

# local settings
if [ -a ~/.bash_local ]; then
  source ~/.bash_local
fi
