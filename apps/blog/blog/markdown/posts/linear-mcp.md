---
title: "Linear MCP: From Tab-Switching to Flow"
summary: Connecting AI coding tools directly to Linear for seamless project management.
slug: linear-mcp
category: ai
tags: Linear, MCP, Claude-Code, Cursor, AI
date: 2026-03-06
modified: 2026-03-06
status: published
image: linear-mcp.png
thumbnail: linear-mcp-thumb.png
imgprompt: The Linear Logo; a blue circle, top-right-half solid blue, bott-left-half the same blue but striped with 3 black diagonal lines along the lower left half oriented from top-left to bottom-right
---


# WARNING

This blog post, unlike all my others, is currently entirely AI generated. It's a test
of using [OpenCode agentic swarms](/local-opencode-setup). I'll go through it
later this week and de-slop things.

---

Linear's official MCP server launched in May 2025. It connects your Linear workspace directly to Claude, Cursor, Windsurf, Codex, and other AI tools. No more copy-pasting issue details into your AI assistant.

I've been using it for a few weeks now. Here's what it does and how to set it up.

## What you get

Linear's MCP server exposes:

- **Issues**: create, list, get, update, delete
- **Projects**: manage projects and updates
- **Teams**: list teams and users
- **Milestones**: create and edit
- **Initiatives**: manage strategic initiatives
- **Labels and statuses**: query available options
- **Comments**: add with markdown

The February 2026 update added initiatives, milestones, project updates, and labels. Product planning workflows now work too.

## Setup

Linear hosts the MCP server at `https://mcp.linear.app/mcp`. Use that endpoint, not the old SSE one which is deprecated.

### Cursor

1. `Ctrl/Cmd + Shift + P` → "Open MCP Settings"
2. Add:

```json
{
  "mcpServers": {
    "linear": {
      "url": "https://mcp.linear.app/mcp"
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add --transport http linear-server https://mcp.linear.app/mcp
```

Restart and authenticate via OAuth.

## Using it

Ask your AI tool:

- "What issues are assigned to me this sprint?"
- "Show me blocked tickets"
- "Create a bug ticket for login timeout, high priority"
- "How are the Q1 roadmap initiatives progressing?"

You can self-assign issues with "me" as assignee, add comments with markdown, and filter by cycle.

One practical example: I'm working on a feature, hit a blocker, and ask "is there a related issue for the auth API?" My AI assistant queries Linear and finds the context I need. No tab switch. No lost momentum.

## Why it matters

Manual copy-paste between Linear and your AI tool adds up fast. With MCP:

- AI reads current data, not your memory
- Agents can create issues and update status autonomously  
- Product managers keep initiatives in sync without leaving their AI tool

The traditional workflow is dead. This is the new way.

## What's next

Linear added initiatives and milestones in February 2026. More is coming: cycles, custom views, automated status transitions.

Five minutes of setup. Try it.
