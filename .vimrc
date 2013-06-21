syntax on
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

" au = autocmd

filetype plugin indent on

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

au BufNewFile,BufRead BUILD set filetype=build
au Filetype build call SetTab(4)
au Filetype make setlocal noexpandtab

" disable arrow keys
nnoremap <up> <nop>
nnoremap <down> <nop>
nnoremap <left> <nop>
nnoremap <right> <nop>

" iTerm2 256-color mode
set t_Co=256

" filename completion
set wildmenu
set wildignore=*.o,*~,*.pyc

" show matching brackets
set showmatch

" Pathogen
execute pathogen#infect()
" NERD Tree
nnoremap <leader>e :NERDTreeToggle<CR>

" Go
au BufNewFile,BufRead *.go set filetype=go
set rtp+=$GOROOT/misc/vim

" Google
if filereadable("/usr/share/vim/google/google.vim")
  source /usr/share/vim/google/google.vim
  Glug blaze
  Glug outline-window
  nnoremap <leader>gg :GoogleOutlineWindow<CR>
  nnoremap <leader>gc :QuickOutline 
  au Filetype blazebuild call SetTab(4)
endif
