" --- Syntax & Display ---
syntax on                   " Enable syntax highlighting
set number                  " Show line numbers
set ruler                   " Show cursor position in the status bar

" --- Search ---
set hlsearch                " Highlight all search matches
set ignorecase              " Case-insensitive search
set incsearch               " Show matches as you type

" --- Key Mappings ---
inoremap jk <ESC>           " Map 'jk' in insert mode to Escape

" --- Indentation ---
set autoindent              " Keep indentation from previous line
set smartindent             " Auto-indent after {, etc.
set tabstop=4               " Tab display width
set shiftwidth=4            " Indent width for >> and auto-indent
set expandtab               " Use spaces instead of tabs

" --- Scrolling & Splits ---
set scrolloff=8             " Keep 8 lines visible above/below cursor
set splitright              " Open vertical splits to the right
set splitbelow              " Open horizontal splits below

" --- Undo & Clipboard ---
set undofile                " Persistent undo across sessions
set mouse=a                 " Enable mouse support
set clipboard=unnamedplus   " Use system clipboard for yank/paste

" --- UI ---
set signcolumn=yes          " Always show the sign column (prevents layout shift)

" --- Cursor Shape (terminal escape codes) ---
let &t_EI = "\<Esc>[1 q"   " Normal mode: block cursor
let &t_SR = "\<Esc>[3 q"   " Replace mode: underline cursor
let &t_SI = "\<Esc>[5 q"   " Insert mode: blinking bar cursor

" --- Whitespace Visualization ---
set listchars=eol:¬,tab:⇥¤,trail:~,extends:>,precedes:<,space:·,nbsp:␣
set list                    " Show invisible characters using the above symbols
hi SpecialKey ctermfg=236 guifg=#303030   " Dim color for tabs, trailing spaces, etc.
hi NonText ctermfg=236 guifg=#303030      " Dim color for end-of-line markers, etc.

" --- Restore Cursor Position ---
" Return to last edit position when opening files
autocmd BufReadPost *
     \ if line("'\"") > 0 && line("'\"") <= line("$") |
     \   exe "normal! g`\"" |
     \ endif
