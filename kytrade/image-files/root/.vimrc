" syntax highlighting
syntax on

" Maintain undo history between sessions
" " don't forget to run mkdir ~/.vim/undodir
set undofile
set undodir=~/.vim/undodir
" " fix undo in vi mode
set nocompatible

" tab settings
set tabstop=2 shiftwidth=2 expandtab
autocmd FileType python setlocal shiftwidth=4 tabstop=4 expandtab
autocmd FileType javascript setlocal shiftwidth=2 tabstop=2 expandtab
autocmd FileType html setlocal shiftwidth=2 tabstop=2 expandtab

" enable auto indentation
set autoindent

" disable word wrap
set nowrap

" line length ruler at 88 chars (mostly for pep8)
set colorcolumn=88
highlight colorcolumn ctermbg=darkyellow ctermfg=black

" Make trailing whitespace show up as bright red
highlight ExtraWhitespace ctermbg=red guibg=red
match ExtraWhitespace /\s\+$/

" easier controls to directionally switch between vim panes like we do in tmux
map <C-j> <C-W>j
map <C-k> <C-W>k
map <C-h> <C-W>h
map <C-l> <C-W>l

" use dark background theme
set bg=dark

" ------------------------ Plugins --------------------------------
"
" Plugins - Managed by Vim-Plug
" " To install the plugins configured below, open vim and run:
" " :PlugInstall

" Specify plugins directory
" " - Avoid using standard Vim directory names like 'plugin'
" call plug#begin('~/.vim/plugged')


" Fugitive: Git wrapper to make merge conflicts easier to resolve
" Plug 'tpope/vim-fugitive'


" Vim-virtualenv: Makes ALE use the current venv's python
" ...Did not help.
" Plug 'jmcantrell/vim-virtualenv'


" ALE: Asynchronous Lint Engine. (Requires Vim8)
" let g:ale_lint_on_text_changed = 'normal'
" let g:ale_lint_on_enter = 1
" let g:ale_completion_enabled = 1
" For python to work, run this outside a venv. Requires python-pip.
" " pip install pylint
" " pip install flake8
" For javascript to work, run this. Requires NPM be installed.
" " npm install -g jshint
" For CSS files to work, run this. Requires NPM be installed
" " npm install -g stylelint
" For HTML, tidy doesn't work well with angular's custom tags and props
" Nothing obvious comes up that will work well with its templates...
" let g:ale_linters = {'css': ['stylelint'], 'javascript': ['jshint'], 'python': ['flake8', 'pylint'], 'html': []}
" let g:ale_html_tidy_options = '-q -e -language en -config ~/.vim/tidy.conf'
" let g:ale_python_flake8_executable = 'python3'
" Plug 'w0rp/ale'


" DISABLED FOR NOW - NOT WORKING RIGHT
" Black: Automatically format your code
" Use :Black to format the entire file
" let g:black_linelength = 80
" Plug 'psf/black', { 'branch': 'stable' }


" Initialize plugin system
" call plug#end()
"
"
" ------------------------ /Plugins -------------------------------
