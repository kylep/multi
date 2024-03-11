title: Github Pages: Basics
summary: Building a simple page for your Git project using GitHub Pages
slug: github-pages
category: development
tags: Git
date: 2020-02-27
modified: 2019-10-25
status: published
image: git.png
thumbnail: git-thumb.png


---

**Note**: There are a lot of ways to do this, I'm only documenting the approach
I chose. For instance, I'm using the master branch and `docs/`, but you can use
another branch too.

---


# Initial Setup

## CNAME file

Pick a domain name. When I was writing this post, I was setting up the GitHub
Pages site for [Breqwatr Deployment Tool](http://bwdt.breqwatr.com), so I used
`bwdt.breqwatr.com`.

Create a file in your project's master branch named `docs/CNAME`, and put your
desired FQDN in that file. Push it to master.


## CNAME DNS Entry

I'm using CloudFlare, so I logged in there and made a new CNAME entry pointing
`bwdt.breqwatr.com` to `breqwatr.github.io`.


## Repository Setup

As the repository owner, open the repo up in GitHub and go to the Settings
page. Look for the GitHub Pages option.

- Set your source to `master branch /docs folder`.
- Choose a theme
- Confirm custom domain in the "custom domain" field


---

# Write the config file

Pull the changes GitHub made to your registry, then edit `docs/_config.yml`.

Give your page a title and description.

```yaml
theme: jekyll-theme-slate
title: Breqwatr Deployment Tool
description: A private cloud deployment and management toolkit
```


---

# Write Content

Create a file named `docs/index.md` and write your page content here.

GitHub Pages will link this `index.md` file to the `/` path of your chosen
domain.

The content is written in Markdown, which is really intuitive and carries over
nicely from any `README.md` files you'll have written before.


## Sub-pages

GitHub Pages supports breaking your content up into more than one static page.
Create a new content file such as `installation.md`, and GitHub Pages will
host it with a slug of `/installation`.

From the index file, link to your new secondary file using Markdown. Here's an
example of linking to an installation guide from a table of contents list.

```text
Table of contents

- [Installation](/installation.html)
```
