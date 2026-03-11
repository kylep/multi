---
title: "Blog Architecture"
summary: "Technical architecture of kyle.pericak.com: Next.js 14 static export, markdown-to-HTML pipeline, Playwright testing, and deployment."
keywords:
  - blog
  - nextjs
  - static-site
  - architecture
  - markdown
related:
  - wiki/devops
  - wiki/mcp/playwright
scope: "Covers the blog's technical implementation. Does not cover blog content or writing style."
last_verified: 2026-03-10
---

# Blog Architecture

kyle.pericak.com is a statically exported Next.js 14 site. Markdown
files are processed at build time into HTML pages. The site is deployed
as static files with no server-side rendering at runtime.

## Key Characteristics

- Static HTML export (no Node.js server in production)
- All internal links end in `.html`
- Material-UI (MUI) for components and responsive layout
- Responsive breakpoint at 600px (mobile/desktop)
- Sidebar with categories and tags on desktop, below content on mobile
