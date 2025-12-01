---
title: Mermaid Diagrams in Markdown
summary: Rendering Mermaid diagrams alongside the existing markdown and grey matter pipeline.
slug: mermaid-markdown-support
tags: markdown, mermaid, diagrams
category: development
date: 2024-08-19
modified: 2024-08-19
status: published
image: gear.png
thumbnail: gear-thumb.png
---

Co-authored with OpenAI Codex.

When I first built the blog, code fences and GitHub-flavored markdown were enough. Now that more of my architecture notes live here, I want inline diagrams that stay in sync with text. This post describes the small change I made to the rendering pipeline to support Mermaid diagrams without giving up the existing grey matter parsing.

## How the rendering works

The markdown loader still starts by parsing front matter with `gray-matter`, but the Remark pipeline now detects any fenced code block labeled `mermaid` and rewrites it into HTML with the `mermaid` class. When the blog post component hydrates on the client, it lazily imports the Mermaid runtime, initializes it, and asks it to render every `pre.mermaid` block. This keeps the static export simple while letting the browser convert diagrams to SVG after load.

The rest of the stack—table-of-contents generation, GFM extras, and the existing Prism syntax highlighting—continues unchanged. Posts that do not include a Mermaid fence keep working exactly as before.

# Mermaid feature walkthrough

Below are a few common diagram types I plan to use. Paste these snippets into any post and the blog will render them automatically.

## Flowchart

```mermaid
graph TD;
  Source[Markdown] --> Remark;
  Remark --> |HTML| Browser;
  Browser --> MermaidRuntime;
  MermaidRuntime --> |SVG| PublishedPost;
```

## Sequence diagram

```mermaid
sequenceDiagram
  participant Author
  participant Blog
  participant Mermaid
  Author->>Blog: Write markdown with mermaid fences
  Blog->>Mermaid: Request runtime initialization
  Mermaid-->>Blog: Render SVG
  Blog-->>Author: Display diagram
```

## State diagram

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Review: lint & build
  Review --> Published: merge
  Published --> Archived
```

## Class diagram

```mermaid
classDiagram
  class MarkdownService {
    +getRenderedMarkdownAndProps()
  }
  class BlogPostContentPage {
    +useEffect mermaid bootstrap
  }
  MarkdownService --> BlogPostContentPage : HTML
```

With this in place, I can embed quick sketches directly in the content without exporting PNGs or checking in binaries. The diagrams stay editable, versioned with the markdown, and render consistently alongside the rest of the post styling.
