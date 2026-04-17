---
title: Vim Spell-Check
summary: Enable Vim's built-in spell checker with :set spell spelllang=en_ca, jump
  between misspellings with ]s and [s, and fix, add, or flag words using z=, zg, zw.
slug: vim-spellcheck
category: development
tags: Vim
date: 2019-10-25
modified: 2019-10-25
status: published
image: vim.png
thumbnail: vim-thumb.png
keywords:
  - vim spell check
  - enable spell check vim
  - vim spellcheck commands
  - vim spelling suggestions
  - vim spelllang
---



As of Vim7, spell-checking is a built-in feature.


The spell checker will highlight incorrectly spelled words in red.
Light blue highlights indicate words which are only found in another dictionary
(such as "color" from `en_us`).


---


# Commands

## Enable/Disable

Enable spellcheck

- `set` for all buffers, `setlocal` for the current one
- `en_ca` will use Canadian spelling.

```text
:set spell spelllang=en_ca
:setlocal spell spelllang=en_ca
```

Or if you're not picky, the `spelllang` argument can be omitted. I'm not sure
what the default is, but I figure it's probable `en` which uses all the English
dictionaries together.

```
:set spell
```

Disable spellcheck:

```text
:set nospell
```


## Using Spell-Check

Move to the next misspelled word

```
]s
```
previous misspelled word

```
[s
```

Highlight a misspelled word. Show possible replacements.
Press return with no input to go back.

```
z=
```

Accept the spelling of a word:
```text
zg
```

Mark a word's spelling as wrong
```text
zw
```
