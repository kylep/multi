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
keywords:
  - openclaw custom skill tutorial
  - linear graphql api skill
  - clawhavoc malicious skills
  - build your own openclaw skill
  - ai agent linear integration
  - self-hosted ai agent security
---


## Table of contents

# Why I don't trust the skill marketplace

In the [K8s post](/openclaw-k8s.html) I mentioned wanting
to connect OpenClaw to Linear for issue tracking. The
obvious path is ClawHub, OpenClaw's public skill
marketplace. Install a community skill, set your API key,
done. I didn't do that.

In February 2026, a campaign called
[ClawHavoc](https://cybersecuritynews.com/clawhavoc-poisoned-openclaws-clawhub/)
compromised ClawHub. Researchers at Trend Micro and Antiy
documented over 1,184 malicious skills that had been
published to the registry. The skills looked legitimate,
had normal names and descriptions, and passed ClawHub's
automated checks. They distributed
[Atomic macOS Stealer](https://www.trendmicro.com/en_us/research/26/b/openclaw-skills-used-to-distribute-atomic-macos-stealer.html),
a credential harvester targeting Keychain, browser
passwords, and crypto wallets.

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
and audit every line. The Linear skill I need is about 150
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
  "requires": {"bins": ["curl"],
  "env": ["LINEAR_API_KEY"]}}}
---
```

OpenClaw checks these requirements at load time. If `curl`
isn't on PATH, or `LINEAR_API_KEY` isn't set, the skill
doesn't load. No runtime errors, no mysterious failures.


# The skill

I had Claude write a Linear skill covering the operations
I actually use: listing issues, creating and updating them,
managing labels, and adding comments. The full skill lives
at `apps/openclaw-skills/linear/SKILL.md` in my monorepo.

Linear's API is GraphQL-only. No REST endpoints. Every
request is a POST to `https://api.linear.app/graphql` with
a JSON body containing the query. The skill uses `curl`
for HTTP. One API key, no OAuth dance.

The auth header is `Authorization: $LINEAR_API_KEY`.
Linear personal API keys don't use a `Bearer` prefix.

Here's what listing issues looks like:

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issues(filter: { team: \
    { key: { eq: \"PER\" } } }, first: 25) \
    { nodes { id identifier title \
    state { name } } } }"}'
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
    { success issue { id identifier url } } }"}'
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

I described what I wanted at a high level, and Claude
handled the GraphQL query syntax, the jq filters, and the
escape sequences. I reviewed the output. The whole thing
took one conversation.

The skill lives in my monorepo under version control. If
Linear changes their API or I need a new operation, I
update one file.


# Loading it into K8s

Getting the skill into the running OpenClaw pod took more
work than writing it. The skill file needs to end up in
the right directory inside the container, the API key
needs to be injected, and OpenClaw needs to discover it.

## Injecting the API key

I added the Linear API key to Vault alongside the existing
Gemini and Telegram secrets, then updated the Vault Agent
template to export it:

```text
{{- with secret "secret/openclaw" -}}
export GEMINI_API_KEY="{{ .Data.data.gemini_api_key }}"
export TELEGRAM_BOT_TOKEN="..."
{{ if .Data.data.linear_api_key }}
export LINEAR_API_KEY="{{ .Data.data.linear_api_key }}"
{{ end }}
{{- end }}
```

## Mounting the skill

I stored the SKILL.md in a ConfigMap and mounted it into
the init container. ConfigMap mounts use symlinks
internally, and OpenClaw's skill loader rejects symlinked
paths as a security measure. So the init container copies
the file onto the PVC as a regular file:

```yaml
initContainers:
  - name: config-seed
    command: ["sh", "-c"]
    args:
      - |
        # ... existing config seed logic ...
        # Copy skills onto PVC workspace
        mkdir -p /data/workspace/skills/linear
        cp /skill-src/linear/SKILL.md \
          /data/workspace/skills/linear/SKILL.md
    volumeMounts:
      - name: linear-skill
        mountPath: /skill-src/linear
        readOnly: true
```

The key detail: skills must live under the workspace
directory (`<workspace>/skills/`), not just anywhere on
the filesystem. OpenClaw's skill discovery only scans
three locations: bundled, managed (`~/.openclaw/skills`),
and workspace. I initially tried `extraDirs` and the
managed path. Neither worked until I put it in the
workspace.

## The jq problem

The original skill required both `curl` and `jq` in its
`requires.bins` frontmatter. The OpenClaw container has
`curl` but not `jq`. The skill gating check runs at
startup: missing binary means the skill silently doesn't
load. Claude dropped `jq` from the requirements. The agent
is smart enough to parse JSON responses on its own using
the `node` binary that's already in the container.

## Stale sessions

After all that, I asked Pai what skills it had. Still
three. OpenClaw snapshots eligible skills when a session
starts and reuses that list for the session's lifetime.
The `openclaw agent --message` CLI command was reusing an
existing session from before the skill was loaded.
Clearing the sessions directory forced a fresh snapshot:

```bash
rm -rf /home/node/.openclaw/agents/main/sessions/*
```

After that, the skill appeared.


# Talking to Pai (Pericak AI)

With the skill loaded, Claude Code talked to Pai (the
OpenClaw agent running Gemini 2.5 Flash) through
`kubectl exec`, using the same pattern from the
[K8s post](/openclaw-k8s.html).

```text
Claude: List my Linear teams using the linear skill.
Pai: Your Linear teams are:
  - Pericak (Key: PER)

Claude: List my Linear issues for team PER.
Pai: Here are the Linear issues for team PER:
  - PER-10: ... (State: Backlog)
  - PER-9: ... (State: Todo)
  - PER-8: ... (State: Todo)
  - PER-7: ... (State: Todo)
  - PER-6: ... (State: Todo)
  - PER-5: ... (State: Todo)
  ...
```

That's real output (titles redacted). Pai read the
skill's curl commands, called the Linear GraphQL API
with the Vault-injected API key, and returned my actual
issues. The full chain: Claude Code runs `kubectl exec`,
which calls the `openclaw agent` CLI, which sends the
message to Gemini 2.5 Flash, which reads the skill, runs
curl against Linear's API, and returns the result.

Two AIs, two different models, coordinating through a
Kubernetes pod with Vault-injected secrets and a
hand-written skill file. The whole thing is auditable
from end to end.
