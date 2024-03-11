title: Vim Spell-Check
summary: How to enable, disable, and use spell check in Vim (version >=7).
slug: vim-spellcheck
category: development
tags: Vim
date: 2019-10-25
modified: 2019-10-25
status: published
image: vim.png
thumbnail: vim-thumb.png



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
