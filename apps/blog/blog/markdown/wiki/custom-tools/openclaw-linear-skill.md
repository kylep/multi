---
title: "OpenClaw Linear Skill"
summary: "Markdown-based skill for managing Linear issues via GraphQL API, without trusting ClawHub."
keywords:
  - openclaw
  - linear
  - skill
  - graphql
related:
  - wiki/custom-tools/index.html
scope: "OpenClaw Linear skill: operations, setup, and security rationale."
last_verified: 2026-03-15
---

A markdown-based OpenClaw skill that gives agents step-by-step
`curl` commands for managing Linear issues, projects, and comments
via the Linear GraphQL API.

Source: `apps/openclaw-skills/linear/SKILL.md`

## Why not ClawHub?

ClawHub (the public skill marketplace) was compromised by the
ClawHavoc campaign in February 2026. This skill is self-hosted
to avoid supply-chain risk — it's plain markdown with curl commands,
no compiled code.

## Operations

| Operation | GraphQL | Description |
|-----------|---------|-------------|
| List teams | Query | All teams with IDs and keys |
| List issues | Query | Filter by team, status, labels |
| Get issue | Query | Single issue by ID with full details |
| Create issue | Mutation | New issue with title, description, team |
| Update issue | Mutation | Change status, assignee, etc. |
| List statuses | Query | Workflow states for a team |
| List labels | Query | All labels with IDs |
| Create label | Mutation | New label with name and color |
| List comments | Query | Comments on an issue |
| Add comment | Mutation | Post a comment to an issue |

## Requirements

- `curl` binary
- `LINEAR_API_KEY` environment variable (personal API key, no Bearer prefix)

## Rate limits

1,500 requests per hour per API key.

## Setup

The skill file is a Markdown document that agents read directly.
No installation or build step required — just ensure the env var
is set and the skill file is accessible.

For Kubernetes deployment, mount as a ConfigMap and inject the
API key via Vault.

## Related

Blog post: [Building an OpenClaw Linear Skill](/openclaw-linear-skill.html)
