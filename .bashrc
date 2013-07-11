# If not running interactively, don't do anything
[ -z "$PS1" ] && return

# Linux only
if [[ `uname` == 'Darwin' ]]; then
  return
fi

# don't put duplicate lines or lines starting with space in the history.
# See bash(1) for more options
HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# If set, the pattern "**" used in a pathname expansion context will
# match all files and zero or more directories and subdirectories.
shopt -s globstar

# make less more friendly for non-text input files, see lesspipe(1)
#[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# Add an "alert" alias for long running commands.  Use like so:
#   sleep 10; alert
alias alert='notify-send --urgency=low -i "$([ $? = 0 ] && echo terminal || echo error)" "$(history|tail -n1|sed -e '\''s/^\s*[0-9]\+\s*//;s/[;&|]\s*alert$//'\'')"'

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
if [ -f /etc/bash_completion ] && ! shopt -oq posix; then
    . /etc/bash_completion
fi

# changes shared with .bash_profile on OSX
if [ -f ~/.bash_compat ]; then
  . ~/.bash_compat
fi

# add detail and color to ls
alias ls="ls -Al --color=auto"
# add color to grep
alias grep="grep --color=auto"

# 256 colors
export TERM='xterm-256color'

# open
alias open='gnome-open'

# Google stuff
# Perforce setup
export P4DIFF='vimdiff -f -R'
# Java
#export PATH="/usr/local/buildtools/java/jdk7-64/bin:$PATH"
export CLASSPATH="/google/src/cloud/blevinstein/java_dev/google3/java"
# eclimd
export ECLIPSE_HOME='/usr/local/google/users/blevinstein/eclipse38/testing'
export PATH="$PATH:$ECLIPSE_HOME"
