---
title: "OpenRouter for Claude Code, OpenCode, and OpenClaw"
summary: Routing Claude Code, OpenCode, and OpenClaw through one OpenRouter API
  key for unified billing, swapping in Gemini via env vars, plus a custom MCP
  server.
slug: openrouter-ai-tools
category: dev
tags: openrouter, Claude-Code, opencode, openclaw, AI, mcp
date: 2026-03-10
modified: 2026-03-10
status: published
image: openrouter-ai-tools.png
thumbnail: openrouter-ai-tools-thumb.png
imgprompt: A friendly cartoon octopus wearing glasses,
  each tentacle holding a different glowing tool or cable,
  plugging them all into a single glowing hub, cozy flat
  illustration style with a soft gradient background
keywords:
  - openrouter claude code setup
  - openrouter api key configuration
  - unified ai billing openrouter
  - openrouter opencode openclaw
  - claude code through openrouter
  - ai model pricing comparison
  - custom mcp server openrouter
---


## Table of contents

# Why one router

I run three AI tools regularly: Claude Code, OpenCode,
and OpenClaw. Each has its own API key, its own billing
dashboard, and its own model config. Anthropic bills
Claude Code. Google bills OpenClaw's Gemini usage.
OpenCode can talk to either.

That's three places to check spend, three sets of rate
limits, and no single view of what I'm burning through.
OpenRouter fixes this. It's a proxy that sits between
your tools and the model providers. You get one API key,
one billing dashboard, and the ability to swap models
without changing provider credentials.

The tradeoff is a small markup on token costs and an
extra network hop. For a personal setup where I want
visibility and flexibility, that's fine.

## Claude's token efficiencies

Anthropic's Pro and Max plans include Claude Code
usage at a steep discount compared to raw API pricing.
Pro is $20/month with generous token allowances. Max
plans scale up from there. If you only use Claude Code,
the Pro plan is the cheapest way to run it.

The problem is that those plan tokens only work with
Claude Code through Anthropic's direct API. OpenCode
and OpenClaw are third-party tools. They can call
Claude models, but not through your Pro subscription.
They hit the standard API and bill at full rate.

So the choice is: keep Claude Code on the Pro plan
(cheapest for that one tool) and manage the other two
separately, or route everything through OpenRouter and
get unified billing at API rates. I went with
OpenRouter because the visibility across all three
tools matters more to me than the per-token savings
on Claude Code alone.


# Getting an OpenRouter key

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Go to Settings > Keys and create a new API key
3. Add credits (pay-as-you-go, no minimum)

OpenRouter gave me $100 in free credits as a signup
promo. That's a lot of tokens to experiment with before
committing any money.

Set the key in your shell:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Add it to your `~/.zshrc` or `~/.bashrc` so it persists.
The same key works for every tool below.

OpenRouter's [models page](https://openrouter.ai/models)
shows per-token pricing for every model. Useful for
comparing costs before swapping models around.


# Claude Code

Claude Code normally talks directly to Anthropic's API.
To route it through OpenRouter, you override the base
URL and auth token via environment variables:

```bash
ANTHROPIC_BASE_URL="https://openrouter.ai/api" \
ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY" \
ANTHROPIC_API_KEY="" \
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
claude
```

Four variables. `ANTHROPIC_BASE_URL` points Claude Code
at OpenRouter instead of Anthropic. `ANTHROPIC_AUTH_TOKEN`
passes your OpenRouter key. `ANTHROPIC_API_KEY` must be
set to an empty string, otherwise Claude Code tries to
use it and the auth conflicts.
`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` stops
telemetry calls that would fail against OpenRouter.

That's verbose to type every time. I wrapped it in a
shell function:

```bash
# ~/.zshrc
orclaude() {
  ANTHROPIC_BASE_URL="https://openrouter.ai/api" \
  ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY" \
  ANTHROPIC_API_KEY="" \
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
  claude "$@"
}
```

Now `orclaude` launches Claude Code through OpenRouter.
Regular `claude` still uses the Anthropic API directly.

You can also swap models. Claude Code has three model
slots (Opus, Sonnet, Haiku) that you can override:

```bash
export ANTHROPIC_DEFAULT_SONNET_MODEL=\
  "google/gemini-2.5-pro"
export ANTHROPIC_DEFAULT_HAIKU_MODEL=\
  "google/gemini-2.5-flash"
```

Any model on OpenRouter that supports tool use works.
Models without tool use will break Claude Code since
it relies on tools for file reading, editing, and
command execution.


# OpenCode

OpenCode has native OpenRouter support.

## What didn't work

I tried putting the API key in `opencode.json`. It passed config validation but
OpenCode still tried to bill through its own payment system. "No payment method" error
pointing at OpenCode's billing page, not OpenRouter's.

## What worked

OpenCode picks up `OPENROUTER_API_KEY` from the environment automatically. The config
file only needs the model names. `opencode.json` goes in the project root where you
launch it, or the global `~/.config/opencode/opencode.json`.

```json
{
  "model": "openrouter/anthropic/claude-sonnet-4-6",
  "small_model": "openrouter/anthropic/claude-haiku-4-5"
}
```

The key has to be registered through OpenCode's auth system. Inside the TUI:

1. Run `/connect`
2. Search for "OpenRouter"
3. Paste your API key

After that, OpenCode routes through OpenRouter. The
`openrouter/` prefix on model names tells it which
provider to use.

Note: OpenCode shows a warning when you select
OpenRouter saying requests "will often be routed to
subpar providers." That feels like they're trying to just sell their own model hosting.


# OpenClaw

OpenClaw has native OpenRouter support. The model
reference format is `openrouter/<provider>/<model>`,
same as OpenCode.

In OpenClaw's home directory, `openclaw.json`, for the K8s setup
`/home/node/.openclaw/openclaw.json` (the PVC mount). For a local install it'd be
`~/.openclaw/openclaw.json.`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: {
        primary: "openrouter/anthropic/claude-sonnet-4-6"
      },
    },
  },
}
```

Or use the CLI:

```bash
openclaw onboard \
  --auth-choice apiKey \
  --token-provider openrouter \
  --token "$OPENROUTER_API_KEY"
```

Since my OpenClaw runs in K8s with secrets injected via
Vault, I added `OPENROUTER_API_KEY` to the Vault secret
and updated the Vault Agent template to export it. Same
pattern as the
[Linear API key](/openclaw-linear-skill.html) from the
previous post.

After redeploying, I cleared my OpenClaw agent's sessions (OpenClaw
caches the model config per session) and asked what
model it was running:

```text
Claude: What model are you running on?
Pai: I'm running on Claude Sonnet 4.6 via OpenRouter
  (openrouter/anthropic/claude-sonnet-4-6).
```

Previously Pai ran Gemini 2.5 Flash through Google's
API directly. Now it's Claude Sonnet 4.6 through
OpenRouter. Same Vault-injected credentials pattern,
different model, one billing dashboard.

The Linear skill still works through the new model.
Pai listed my teams and issues the same as before.
The skill's curl commands don't care which model is
driving the agent.


# Custom OpenRouter Usage MCP

With everything routed through OpenRouter, I wanted
to check my spend without leaving the terminal. OpenRouter
has a billing API, so I built a small
[MCP server](https://github.com/kylep/multi/tree/main/apps/mcp-servers/openrouter)
that queries it.

The server has two tools. `get_usage` calls the
`/api/v1/key` endpoint and returns daily, weekly, monthly,
and total spend plus remaining credits. `get_model_pricing`
calls `/api/v1/models` and shows per-million-token costs,
with an optional filter to search by model name.

The whole thing is one TypeScript file using the MCP SDK
with stdio transport. It reads `OPENROUTER_API_KEY` from
the environment, same key the other tools already use.

## Registering it

In `~/.claude.json`, under the project's `mcpServers`:

```json
"openrouter": {
  "type": "stdio",
  "command": "node",
  "args": [
    "/path/to/openrouter-mcp/build/index.js"
  ]
}
```

No `env` block needed. Claude Code spawns it as a child
process, which inherits the shell environment.

## Usage output

After restarting Claude Code, I asked it to check my
OpenRouter usage:

```text
Key: sk-or-v1-3fd...374
Free tier: no

Usage:
  Today:  $0.5467
  Week:   $0.5467
  Month:  $0.5467
  Total:  $0.5467

Credit limit:
  Limit:     $200.0000
  Remaining: $199.4533
```

That $0.55 is from a few hours of Claude Code and
OpenCode use. The $200 limit is what I set on the key
in OpenRouter's dashboard.

The pricing tool is useful for comparing models before
switching. Searching "claude-sonnet-4" shows all the
Sonnet variants and their per-million-token rates side
by side.

## Model pricing snapshot

Pulled from `get_model_pricing` on 2026-03-10:

| Model | Prompt | Completion | Context |
|-------|--------|------------|---------|
| openai/gpt-5.4-pro | $30.00/M | $180.00/M | 1050k |
| openai/gpt-5.4 | $2.50/M | $15.00/M | 1050k |
| openai/gpt-5.3-codex | $1.75/M | $14.00/M | 400k |
| openai/gpt-5.2-pro | $21.00/M | $168.00/M | 400k |
| openai/gpt-5.1 | $1.25/M | $10.00/M | 400k |
| anthropic/claude-opus-4.6 | $5.00/M | $25.00/M | 1000k |
| anthropic/claude-sonnet-4.6 | $3.00/M | $15.00/M | 1000k |
| anthropic/claude-haiku-4.5 | $1.00/M | $5.00/M | 200k |
| anthropic/claude-opus-4 | $15.00/M | $75.00/M | 200k |
| anthropic/claude-sonnet-4 | $3.00/M | $15.00/M | 200k |
| google/gemini-3.1-pro-preview | $2.00/M | $12.00/M | 1049k |
| google/gemini-2.5-pro | $1.25/M | $10.00/M | 1049k |
| google/gemini-2.5-flash | $0.30/M | $2.50/M | 1049k |
| google/gemini-2.5-flash-lite | $0.10/M | $0.40/M | 1049k |
| deepseek/deepseek-v3.2 | $0.25/M | $0.40/M | 164k |
| deepseek/deepseek-r1-0528 | $0.45/M | $2.15/M | 164k |
| meta-llama/llama-4-maverick | $0.15/M | $0.60/M | 1049k |
| mistralai/mistral-large-2512 | $0.50/M | $1.50/M | 262k |
| qwen/qwen3.5-397b-a17b | $0.39/M | $2.34/M | 262k |
| qwen/qwen3-coder-plus | $0.65/M | $3.25/M | 1000k |

Prices are per million tokens. These change often.
Check OpenRouter's models page for current rates.
