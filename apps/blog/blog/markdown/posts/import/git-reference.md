title: Git Reference Page
summary: Deleting a file after it's been pushed to to a remote git repository
slug: git reference
tags: Git
category: reference pages
date: 2019-09-06
modified: 2019-12-04
status: published
image: git.png
thumbnail: git-thumb.png


**This is a Reference Page:** Reference pages are collections of short bits
of information that are useful to look up but not long or interesting enough to
justify having their own dedicated post.

This page covers how to do some things in Git.

---

[TOC]

---


# Use Vim for commits

Ugh, Nano. Kidding, but seriously here's how to use Vim instead.

```bash
git config --global core.editor "vim"
```


---


# Rename Branch

```bash
# Check out the branch to rename
git checkout development
# Rename the branch
git branch -m master
# Push the change
git push origin :development master
```

If you're using BitBucket and it fails to delete the branch, it might be set
as your MAIN branch. You need to change that before it can be deleted. You can
change it in the settings page.


---

# Roll Back Merge

If you do a git merge and its really ugly, you might want to undo that.

First you did the commit

```bash
git checkout master
git merge --squash development
```

Then you got a TON of `CONFLICT` messages and a really dirty state.

## Option 1: Abort the merge

This one's my preference. There might be a few `~` files left over to `rm`
manually.

```bash
git merge --abort
```

## Option 2: Reset to the last commit

First, get the commit right before this one from git log
```bash
git log -n 1
```

Copy the commit hash

```bash
git reset --hard <commit hash>
```

You may need to clean up some files after that.

**extra**
Usually, the next thing you wanna do is try the merge again with
`--stattheirs`, or

```bash
git merge --squash --strategy-option=theirs development
```


---

# Delete a File From Git History

It's important to note, as GitHub highlights [in their documentation](https://help.github.com/en/articles/removing-sensitive-data-from-a-repository),
if you've uploaded a secret password or something, you still need to change it.

The file I removed was called `sqldata.json`, and it was in my project root.
From the project root, I ran:

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch sqldata.json" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

## If you don't push with --force

When I tried to push, though, I got an error. I'd forgotten to use `--force`.

```bash
To https://github.com/kylep/jsc2f.git
 ! [rejected]        master -> master (non-fast-forward)
 error: failed to push some refs to 'https://github.com/kylep/jsc2f.git'
 hint: Updates were rejected because the tip of your current branch is behind
 hint: its remote counterpart. Integrate the remote changes (e.g.
 hint: 'git pull ...') before pushing again.
 hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

Then, when I tried to pull, I got

```bash
From https://github.com/kylep/jsc2f
 + ca7d7cc...710d37b master     -> origin/master  (forced update)
 fatal: refusing to merge unrelated histories
```

If you're getting errors like that, maybe you need to run push with `--force`.

```bash
git push origin --force --all
```

