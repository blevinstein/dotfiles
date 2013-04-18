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

filetype plugin indent on

function! SetTab(width)
  let &l:softtabstop = a:width
  let &l:tabstop = a:width
  let &l:shiftwidth = a:width
endfunction
call SetTab(2) " defaults

au BufNewFile,BufRead *.go set filetype=go

autocmd Filetype make setlocal noexpandtab
autocmd FileType java call SetTab(4)

" disable arrow keys
nnoremap <up> <nop>
nnoremap <down> <nop>
nnoremap <left> <nop>
nnoremap <right> <nop>

set t_Co=256 " iTerm2 256-color mode

" Pathogen
execute pathogen#infect()
" Ctrl-P
nnoremap ; :CtrlPBuffer<CR>
" NERD Tree
nnoremap \e :NERDTreeToggle<CR>

" Go
set rtp+=$GOROOT/misc/vim
