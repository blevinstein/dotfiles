alias ls="ls -lG"
export PS1='\[\033[01;32m\]\u:\[\033[01;34m\]\w\[\033[00m\]\$ '

[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm" # Load RVM into a shell session *as a function*

export PATH=/opt/local/bin:/opt/local/sbin:$PATH # MacPorts

# Prolog
alias prolog=swipl

# Go
export GOROOT=/usr/local/go
export GOPATH=~/dev/go:$GOPATH

# LeJOS crap
export JAVA_HOME=/System/Library/Frameworks/JavaVM.framework/Versions/1.6.0/Home
export NXJ_HOME=~/lejos_nxj
#export DYLD_LIBRARY_PATH=$NXJ_HOME/bin:$DYLD_LIBRARY_PATH
export PATH=$JAVA_HOME/bin:$NXJ_HOME/bin:$PATH
#export NXT=00165313f6a4
export NXT=00165313e6db
