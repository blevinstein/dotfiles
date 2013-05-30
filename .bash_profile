alias ls="ls -AlG --color=auto"
export PS1='\[\033[01;32m\]\u:\[\033[01;34m\]\w\[\033[00m\]\$ '

[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm" # Load RVM into a shell session *as a function*

export PATH=/opt/local/bin:/opt/local/sbin:$PATH # MacPorts

# Prolog
alias prolog=swipl

# Go
export GOROOT=/usr/local/go
export GOPATH=~/dev/go:$GOPATH
