---
title: "Markdown Pipeline"
summary: "Blog markdown processing: gray-matter for frontmatter, remark plugins for GFM/TOC/Mermaid/slug generation, static path generation from file system."
keywords:
  - markdown
  - remark
  - gray-matter
  - build-pipeline
  - static-generation
related:
  - wiki/blog-architecture
scope: "Covers the MarkdownService build pipeline. Does not cover wiki processing (WikiService) or image generation."
last_verified: 2026-03-10
---


The blog's build pipeline converts markdown files to static HTML pages
using Next.js static generation.

## Processing Chain

1. `MarkdownService` reads all `.md` files from `markdown/posts/`
2. `gray-matter` parses YAML frontmatter into metadata objects
3. `remark` processes markdown through a plugin chain:
   - `remarkGfm`: GitHub Flavored Markdown (tables, strikethrough, tasklists)
   - `remarkSlug`: adds ID attributes to headings for anchor links
   - `remarkToc`: generates table of contents from `### Table of contents`
   - `remarkMermaidToHtml`: converts mermaid code blocks to renderable HTML
   - `remarkHtml`: final HTML conversion
4. Dates are serialized as `YYYY-MM-DD` strings using UTC methods

## Static Generation

- `getStaticPaths()` generates routes for all posts, categories, tags,
  and paginated index pages
- `getStaticProps()` provides page-specific data (content, metadata,
  sidebar counts)
- Catch-all route `[...route].js` handles all paths

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| title | Yes | Page title |
| slug | Auto | Generated from filename |
| category | Yes | Single category (dev, ai) |
| tags | Yes | Comma-separated |
| date | Yes | YYYY-MM-DD |
| status | Yes | published or draft |
| summary | No | One-sentence description |
| modified | No | Last modified date |
| image | No | Header image filename |
| thumbnail | No | 75x75 index thumbnail |
| imgprompt | No | AI image generation prompt |

## Key File

`blog/utils/MarkdownService.js`: singleton service, computed once at
build time, with dev-mode file watcher for hot reload.
