---
title: "Linear MCP"
summary: "Linear project management MCP server. Enables AI agents to create, update, and query issues, projects, and milestones directly."
keywords:
  - linear
  - mcp
  - project-management
  - issue-tracking
related:
  - wiki/mcp/playwright
  - wiki/openclaw/linear-skill
  - linear-mcp
scope: "Covers Linear MCP server capabilities and usage. Does not cover Linear's web UI or API directly."
last_verified: 2026-03-10
---


The Linear MCP server connects AI tools to Linear project management.
Agents can create issues, update status, query backlogs, and manage
projects without leaving the coding environment.

## Key Tools

- `save_issue`: create or update issues (title, description, priority,
  labels, assignee)
- `list_issues`: query with filters (assignee, state, team, project)
- `get_issue`: fetch full issue details
- `save_project`, `list_projects`: manage projects
- `list_teams`, `get_team`: team information
- `save_comment`, `list_comments`: issue discussion

## Usage Patterns

- Sprint planning: AI reviews backlog and suggests priorities
- Task tracking: auto-create issues from TODO comments or PR reviews
- Status updates: query issue state during development

## Related Blog Posts

- [Linear MCP: Planning with Robots](/linear-mcp.html): setup and
  workflow integration
