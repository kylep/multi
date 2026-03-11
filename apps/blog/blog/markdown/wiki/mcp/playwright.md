---
title: "Playwright MCP"
summary: "Browser automation MCP server. Enables AI agents to navigate pages, take screenshots, inspect accessibility trees, and verify rendered output."
keywords:
  - playwright
  - mcp
  - browser-automation
  - testing
  - screenshots
related:
  - wiki/mcp/linear
  - wiki/blog-architecture/playwright-testing
  - playwright-mcp
scope: "Covers Playwright MCP server setup and usage for AI-driven browser verification. Does not cover Playwright test framework usage (see wiki/blog-architecture/playwright-testing)."
last_verified: 2026-03-10
---


The Playwright MCP server gives AI agents direct browser control.
Primary use case: verifying rendered output during development.

## Key Tools

- `browser_navigate`: load a URL
- `browser_take_screenshot`: capture the current viewport
- `browser_snapshot`: read the accessibility tree (structured text)
- `browser_click`, `browser_fill_form`: interact with elements
- `browser_wait_for`: wait for selectors or navigation
- `browser_console_messages`: check for JS errors

## Verification Workflow

1. Start dev server (`bin/start-dev-bg.sh`)
2. Navigate to the page under test
3. Take screenshot to visually inspect
4. Use snapshot to programmatically check text/structure
5. Fix issues, rebuild if needed, repeat
6. Close browser and kill dev server when done

## Related Blog Posts

- [Playwright MCP: Claude Code Verifying Its Own Work](/playwright-mcp.html):
  setup guide and workflow
