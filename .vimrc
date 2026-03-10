syntax on
set number
set hlsearch
set ignorecase
set incsearch
set ruler
inoremap jk <ESC>
let &t_EI = "\<Esc>[1 q"
let &t_SR = "\<Esc>[3 q"
let &t_SI = "\<Esc>[5 q"
set listchars=eol:¬,tab:⇥¤,trail:~,extends:>,precedes:<,space:·,nbsp:␣
set list
hi SpecialKey ctermfg=236 guifg=#303030
hi NonText ctermfg=236 guifg=#303030

" Return to last edit position when opening files (You want this!)
autocmd BufReadPost *
     \ if line("'\"") > 0 && line("'\"") <= line("$") |
     \   exe "normal! g`\"" |
     \ endif
