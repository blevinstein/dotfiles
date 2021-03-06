#!/usr/bin/env bash

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# multiple-OS compatible bash settings
source ~/.bash_compat

# OS-specific bash settings
if [[ `uname` == 'Darwin' ]]; then
  source ~/.bash_osx
fi
if [[ `uname` == 'Linux' ]]; then
  source ~/.bash_linux
fi

# local settings
if [ -a ~/.bash_local ]; then
  source ~/.bash_local
fi
