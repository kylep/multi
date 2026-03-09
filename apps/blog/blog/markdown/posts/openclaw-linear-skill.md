---
title: "Writing My Own OpenClaw Skill for Linear"
summary: Building a custom Linear skill for OpenClaw instead
  of trusting the public skill marketplace.
slug: openclaw-linear-skill
category: dev
tags: openclaw, Linear, security, AI, self-hosted
date: 2026-03-09
modified: 2026-03-09
status: published
image: openclaw-linear-skill.png
thumbnail: openclaw-linear-skill-thumb.png
imgprompt: A cute cartoon lobster holding a clipboard with
  checkboxes, standing next to a small kanban board with
  colorful sticky notes, cozy flat illustration style
---


## Table of contents

# Why I don't trust the skill marketplace

In the [K8s post](/openclaw-k8s.html) I mentioned wanting
to connect OpenClaw to Linear for issue tracking. The
obvious path is ClawHub, OpenClaw's public skill
marketplace. Install a community skill, set your API key,
done. I didn't do that.

In February 2026, a campaign called ClawHavoc compromised
ClawHub. Researchers at Trend Micro and Snyk documented
over 1,184 malicious skills that had been published to the
registry. The skills looked legitimate, had normal names
and descriptions, and passed ClawHub's automated checks.
They distributed Atomic macOS Stealer, a credential
harvester targeting Keychain, browser passwords, and crypto
wallets.

The publishing bar was low. A one-week-old GitHub account
was enough to push a skill to ClawHub. No code review, no
signing, no sandbox. Once installed, a skill runs inside
the agent process with access to every environment variable
the agent has. That includes API keys, tokens, and anything
else injected via Vault or config.

This is the same pattern that hit npm, PyPI, and VS Code
extensions. A package registry with low friction publishing
and high-privilege execution is a target. ClawHub is no
different.

My approach: write the skill myself, keep it in my repo,
and audit every line. The Linear skill I need is maybe 150
lines of markdown. That's a small surface to own compared
to trusting a stranger's code with my credentials.


# How OpenClaw skills work

An OpenClaw skill is a directory with a `SKILL.md` file.
The file has YAML frontmatter (name, description, required
tools and environment variables) and a markdown body with
instructions the agent follows.

There's no compiled code. No dependencies to install. No
background process. The agent reads the markdown, learns
what commands are available, and executes them via bash
when you ask it to. If you want to audit a skill, you read
one file.

Compare this to MCP servers, which are running processes
that the agent connects to over a transport protocol. MCP
servers can do more (stateful connections, streaming), but
they're also harder to audit and have a larger attack
surface. For something like "list my Linear issues," a
static document with curl commands is plenty.

The frontmatter declares what the skill needs:

```yaml
---
name: linear
description: Manage Linear issues, projects,
  and comments via the Linear GraphQL API.
metadata: {"openclaw": {"emoji": "📐",
  "requires": {"bins": ["curl", "jq"],
  "env": ["LINEAR_API_KEY"]}}}
---
```

OpenClaw checks these requirements at load time. If `curl`
or `jq` aren't on PATH, or `LINEAR_API_KEY` isn't set,
the skill doesn't load. No runtime errors, no mysterious
failures.


# The skill

I had Claude write a Linear skill covering the operations
I actually use: listing issues, creating and updating them,
managing labels, and adding comments. The full skill lives
at `apps/openclaw-skills/linear/SKILL.md` in my monorepo.

Linear's API is GraphQL-only. No REST endpoints. Every
request is a POST to `https://api.linear.app/graphql` with
a JSON body containing the query. The skill uses `curl`
for HTTP and `jq` to parse responses. One API key, no
OAuth dance.

The auth header is just `Authorization: $LINEAR_API_KEY`.
Linear personal API keys don't use the `Bearer` prefix.
I got this wrong initially by copying patterns from other
APIs.

Here's what listing issues looks like:

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issues(filter: { team: \
    { key: { eq: \"PER\" } } }, first: 25) \
    { nodes { id identifier title \
    state { name } } } }"}' \
  | jq '.data.issues.nodes'
```

And creating an issue:

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "mutation { issueCreate(input: \
    { teamId: \"TEAM_UUID\", \
    title: \"Issue title\", \
    description: \"Issue description\" }) \
    { success issue { id identifier url } } }"}' \
  | jq '.data.issueCreate'
```

The skill also covers workflow statuses. Changing an
issue's status in Linear means looking up the target
state's UUID first, then passing it to `issueUpdate`. The
agent chains these naturally: list statuses, find the one
named "Todo", grab its ID, update the issue.

This matches the workflow I described in the
[Linear MCP post](/linear-mcp.html). Nightly agents create
Suggestion issues in Backlog, I promote the good ones to
Todo, working agents pick them up. The skill gives OpenClaw
the same Linear access that Claude Code gets through its
MCP server.

The full skill is about 150 lines of markdown. Ten
operations with copy-paste curl commands and a few compound
examples at the end. I read every line.


# One AI writing tools for another

Claude Code (Opus 4.6) wrote this skill. It read the
Trello skill as a pattern, checked the Linear GraphQL API
docs, and produced a skill that follows the same structure.
One AI building capabilities for another AI.

This isn't a novel observation, but it's worth noting as
a workflow. I described what I wanted at a high level, and
Claude handled the GraphQL query syntax, the jq filters,
and the escape sequences. I reviewed the output. The whole
thing took one conversation.

The skill lives in my monorepo under version control. If
Linear changes their API or I need a new operation, I
update one file.


# Installing it

Point OpenClaw at the skill directory. The simplest way
is `skills.load.extraDirs` in `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "load": {
      "extraDirs": ["/path/to/openclaw-skills"]
    }
  }
}
```

OpenClaw scans subdirectories for `SKILL.md` files, so it
picks up `linear/SKILL.md` automatically. You can also
symlink the skill directory into your workspace's `skills/`
folder.

Before loading the skill into OpenClaw, test the curl
commands standalone. Set `LINEAR_API_KEY` in your shell
and run the "List teams" query. If you get JSON back with
your team name, the skill will work.

```bash
export LINEAR_API_KEY="lin_api_..."
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ teams { nodes { id name } } }"}' \
  | jq '.data.teams.nodes'
```

Once it loads, ask OpenClaw to list your teams or create
an issue. The agent reads the skill, picks the right curl
command, substitutes your values, and runs it.
