# changes shared with .bashrc on Linux
if [ -f ~/.bash_compat ]; then
  . ~/.bash_compat
fi

# add detail and color to file listings
alias ls="ls -AlG"

[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm" # Load RVM into a shell session *as a function*

export PATH=/opt/local/bin:/opt/local/sbin:$PATH # MacPorts

# Prolog
alias prolog=swipl

# Go
export GOROOT=/usr/local/go
export GOPATH=~/dev/go:$GOPATH

# Android
export PATH=~/android-sdk-macosx/tools:$PATH
export PATH=~/android-sdk-macosx/platform-tools:$PATH
export CLASSPATH=~/android-sdk-macosx/sources/android-17:$CLASSPATH
