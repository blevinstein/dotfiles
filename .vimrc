set nocompatible

" Pathogen
runtime bundle/vim-pathogen/autoload/pathogen.vim
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
call SetTab(2) " defaults

au Filetype make setlocal noexpandtab

au Filetype html call SetTab(2)
au Filetype java call SetTab(2)
au Filetype xml call SetTab(4)
au Filetype ruby call SetTab(2)
au Filetype racket call SetTab(2)
au Filetype python call SetTab(2)

" disable arrow keys
nnoremap <up> <nop>
nnoremap <down> <nop>
nnoremap <left> <nop>
nnoremap <right> <nop>

" quick save
nnoremap <leader>w :wa<CR>
" quick quit
nnoremap <leader>q :qa<CR>

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

" Code Folding
set foldmethod=indent
set foldlevelstart=20 " disable most folding by default
" shortcut for folding, e.g. 1<leader>z to set foldlevel=1
noremap <silent> <leader>z :<C-U>exe "set foldlevel=".count<CR>

" localvimrc
let g:localvimrc_sandbox = 0
let g:localvimrc_whitelist = "^.*$"

" Commenting blocks of code.
autocmd FileType c,cpp,java,scala let b:comment_leader = '// '
autocmd FileType sh,ruby,python   let b:comment_leader = '# '
autocmd FileType vim              let b:comment_leader = '" '
noremap <silent> <leader>cc :<C-B>silent <C-E>s/^/<C-R>=escape(b:comment_leader,'\/')<CR>/<CR>:nohlsearch<CR>
noremap <silent> <leader>cu :<C-B>silent <C-E>s/^\V<C-R>=escape(b:comment_leader,'\/')<CR>//e<CR>:nohlsearch<CR>

" Allow for computer-specific differences
if filereadable(expand("~/.vimrc_local"))
  source ~/.vimrc_local
endif
