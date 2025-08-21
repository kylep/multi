---
title: Automating Blog Images with OpenAI
summary: Using Codex and DALL·E to create blog title art on the fly
slug: ai-generated-blog-images
category: ai
tags: AI, OpenAI, Blog
date: 2024-05-30
modified: 2024-05-30
status: published
image: ai-generated-blog-images.png
thumbnail: ai-generated-blog-images-thumb.png
---

Keeping visual assets in sync with blog posts can be a chore. To make publishing easier, this site now checks each markdown post during the build. If an image or thumbnail is missing, a prompt is built from the post title and content and sent to OpenAI's image API. The returned art is saved alongside the post and a 70×70 thumbnail is produced.

This automation was coded with Codex and lives in a small script that runs before `npm run build`. You can read the full discussion and code on [GitHub issue #9](https://github.com/kylep/multi/issues/9).

