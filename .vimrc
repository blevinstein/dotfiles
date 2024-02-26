set nocompatible

" Pathogen
runtime bundle/vim-pathogen/autoload/pathogen.vim
let g:pathogen_disabled = []
call pathogen#infect()
syntax on
filetype plugin indent on

colors twilight256

set textwidth=0 " don't automatically wrap lines
" UI
set ruler
set number
" indentation
set autoindent
set shiftround
" search
set incsearch
set hlsearch
set ignorecase
set smartcase
set gdefault
" tabs
set smarttab
set expandtab
" fix backspace
set backspace=indent,eol,start

" set leader
let mapleader = ','
let g:mapleader = ','

" set encoding and standard filetypes
set encoding=utf8

" disable backup
set nobackup
set nowb
set noswapfile

function! SetTab(width)
  let &l:softtabstop = a:width
  let &l:tabstop = a:width
  let &l:shiftwidth = a:width
endfunction
au BufNewFile,BufReadCmd call SetTab(2) " default

" wrap lines longer than max length
set formatoptions+=t

function! SetMaxLen(width)
  let &l:textwidth = a:width
  let &l:colorcolumn = a:width + 1
endfunction
au BufNewFile,BufReadCmd call SetMaxLen(100) " default

au Filetype c,cpp call SetTab(2)
au Filetype css call SetTab(2)

au Filetype dart call SetMaxLen(80)

au Filetype go call SetTab(2)

au Filetype html call SetMaxLen(100)
au Filetype html call SetTab(2)

au Filetype java call SetTab(2)
au Filetype java call SetMaxLen(100)

au Filetype javascript call SetTab(2)
au Filetype typescript call SetTab(2)
au Filetype javascript call SetMaxLen(100)
au Filetype javascriptreact call SetTab(2)
au Filetype typescriptreact call SetTab(2)

au Filetype json call SetTab(2)

au Filetype kotlin call SetTab(4)

au Filetype make setlocal noexpandtab

au Filetype python call SetTab(2)
au Filetype python call SetMaxLen(100)

au Filetype scala call SetMaxLen(80)

au Filetype scss call SetTab(2)

au Filetype sh call SetTab(2)

au Filetype solidity call SetTab(2)

au Filetype soy call SetMaxLen(100)

au Filetype text call SetTab(2)

au Filetype xml call SetMaxLen(100)

au Filetype proto call SetTab(2)
au Filetype proto call SetMaxLen(100)

" iTerm2 256-color mode
set t_Co=256

" filename completion
set wildmenu
set wildignore=*.o,*~,*.pyc

" show matching brackets
set showmatch

" Go
au BufNewFile,BufRead *.go set filetype=go
set rtp+=$GOROOT/misc/vim

" racket
au BufNewFile,BufRead *.rkt set filetype=racket

" Processing
au BufNewFile,BufRead *.pde set filetype=java

" Scala
au BufNewFile,BufRead *.sbt set filetype=scala

" Arduino
au BufNewFile,BufRead *.ino set filetype=c

au BufNewFile,BufRead *.sh set filetype=sh

" Make highlighting for html not suck
au BufNewFile,BufRead *.html set filetype=html

au BufNewFile,BufRead *.ts set filetype=typescript
au BufNewFile,BufRead *.js set filetype=typescript
"au BufNewFile,BufRead *.jsx set filetype=javascriptreact
"au BufNewFile,BufRead *.tsx set filetype=javascriptreact

" Code Folding
set nofoldenable " disable folding
" shortcut for folding, e.g. 1<leader>z to set foldlevel=1
noremap <silent> <leader>z :<C-U>exe "set foldlevel=".count<CR>

" localvimrc
let g:localvimrc_sandbox = 0
let g:localvimrc_whitelist = "^.*$"

" Commenting blocks of code.
autocmd FileType c,cpp,java,scala let b:comment_leader = '// '
autocmd FileType sh,ruby,python   let b:comment_leader = '# '
autocmd FileType vim              let b:comment_leader = '" '
autocmd FileType javascript       let b:comment_leader = '// '
" NERDCommenter
let g:NERDCompactSexyComs = 1
let g:NERDSpaceDelims = 1
let g:NERDTrimTrailingWhitespace = 1

" Shortcut for trailertrash.vim
noremap <leader>tt :TrailerTrim<CR>

" Allow for computer-specific differences
if filereadable(expand("~/.vimrc_local"))
  source ~/.vimrc_local
endif

