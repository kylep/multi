title: Installing Node.js with Ansible
summary: A straightforward approach to installing a current Node.js with Ansible
slug: nodejs-ansible
category: development
tags: Node.js,Ansible
date: 2019-12-13
modified: 2019-12-13
status: published
image: nodejs.png
thumbnail: nodejs-thumb.png


This post covers how I use Ansible to install Node.js. I googled around for a
solution to this and thought the solutions I found looked way too complicated.

---

[TOC]

---


# The Problem

In theory, installing Node.js should be as easy as running
 `apt-get install nodejs`. The problem is that Node.js versions seem to move
pretty quickly and the one distributed by Cannonical in Ubuntu Bionic is
already too old to run some applications. In my case I was trying to install
`firebase-tools`, the CLI for Google Firebase, and it wouldn't run with Apt's
version of the package.


## What about NVM?

NVM, or Node Version Manager, is a nice little application for installing
various versions of Node.js. It kind of reminds me of python virtualenv.
The problem with NVM is that it relies on setting environment variables and
defining the `nvm` function using the `.bashrc` file. Ansible doesn't read
that file when it runs.

In theory, the Ansible `npm` module supports accepting an executable path,
specifically to support NVM, but I had to do some ugly shell commands to
collect that path and even afterwards it wouldn't actually work. Specifically
running the `npm` binary deployed by NVM without scoping the `.bashrc` file
throws stack traces instead of installing your app.


## chris-lea/node.js

A lot of the sites I found were adding the Apt PPA `'ppa:chris-lea/node.js'`.
I don't know what that is, but it doesn't sit well with me. Just seems like
something that wont age well, might be insecure, and is probably fragile.

To make matters worse, when I tried it out it didn't seem to support Bionic.


## curl *x* | bash

Some examples I saw mentioned just curling various URLs and piping them to bash
to run a script.
Sometimes I'm OK with doing this, but that sort of installation method doesn't
really seem appropriate for an Ansible playbook. If nothing else it'd be hard
to make those tasks idempotent. Plus, we can do better.


---


# The Solution

If you look at the [nodesource/distributions GitHub page](https://github.com/nodesource/distributions),
they have some really nice documentation in their `README.md`. Under the
**Manual Installation** section you can see that they have a nice, stable
looking Apt repository URL. This worked great for me, and is trivial to
set up Ansible to work with.


---


# Ansible Example

## Add nodesource repository to Apt's sources.list

```yaml
- name: "Add nodejs apt key"
  apt_key:
    url: https://deb.nodesource.com/gpgkey/nodesource.gpg.key
    state: present

- name: "Add nodejs 13.x ppa for apt repo"
  apt_repository:
    repo: deb https://deb.nodesource.com/node_13.x bionic main
    update_cache: yes
```

## Install Node.js

```yaml
- name: "Install nodejs"
  apt:
    update_cache: yes
    name: nodejs
    state: present
```

## Use NPM normally

With this version of Node.js, I was able to install and run the application.

```yaml
- name: "Install NPM-distributed command-line tools"
  npm:
    global: yes
    name: "{{ item }}"
  with_items:
    - firebase-tools
```
