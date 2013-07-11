if [[ `uname` == 'Darwin' ]]; then
  source ~/.bash_osx
  source ~/.bash_compat
fi

if [[ `uname` == 'Linux' ]]; then
  source ~/.bash_linux
  source ~/.bash_compat
fi
