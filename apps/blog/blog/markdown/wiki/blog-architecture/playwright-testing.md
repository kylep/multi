---
title: "Playwright Testing"
summary: "E2E test setup using Playwright. Tests navigation, post rendering, heading anchors, and mobile responsiveness against the dev server."
keywords:
  - playwright
  - testing
  - e2e
  - end-to-end
  - test-automation
related:
  - wiki/mcp/playwright
  - wiki/blog-architecture
  - playwright-mcp
scope: "Covers the Playwright test framework setup for the blog. Does not cover Playwright MCP server (see wiki/mcp/playwright)."
last_verified: 2026-03-10
---

# Playwright Testing

End-to-end tests verify the blog renders correctly. Tests run against
the Next.js dev server on localhost:3000.

## Configuration

Config file: `blog/playwright.config.ts`

- Test directory: `blog/tests/playwright/`
- Base URL: `http://localhost:3000`
- Reuses existing dev server if running
- Auto-starts dev server via `npm run dev` if needed

## Test Suites

### Navigation (`navigation.spec.ts`)
- Home link returns to index
- Blog link navigates to `/index1.html`
- Wiki link navigates to `/wiki.html`
- About link navigates to `/about.html`

### Post Rendering (`post.spec.ts`)
- Title renders correctly
- Metadata visible (dates, tags)
- Content headings and code blocks render
- Heading IDs match text for anchor navigation
- Hash navigation scrolls to target heading
- No console errors on page load

### Wiki (`wiki.spec.ts`)
- Wiki index shows section tree
- Section pages show child links
- Leaf pages render content
- Mobile viewport rendering

## Running Tests

```bash
cd apps/blog/blog
npx playwright test
```

## Guidelines

- Tests complete in under 1 minute total
- Prefer assertions over waits
- No sleeps
- Test what the user sees, not implementation details
