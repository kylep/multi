---
title: "OpenRouter for Claude Code, OpenCode, and OpenClaw"
summary: Configuring three AI coding tools to route through
  OpenRouter so I can control model spend in one place.
slug: openrouter-ai-tools
category: dev
tags: openrouter, Claude-Code, opencode, openclaw, AI
date: 2026-03-09
modified: 2026-03-09
status: published
image: openrouter-ai-tools.png
thumbnail: openrouter-ai-tools-thumb.png
imgprompt: A friendly cartoon octopus wearing glasses,
  each tentacle holding a different glowing tool or cable,
  plugging them all into a single glowing hub, cozy flat
  illustration style with a soft gradient background
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

OpenCode has native OpenRouter support, but the setup
isn't what I expected.

## What didn't work

I tried putting the API key in `opencode.json`:

```json
{
  "provider": {
    "openrouter": {
      "options": {
        "apiKey": "sk-or-v1-..."
      }
    }
  },
  "model": "openrouter/anthropic/claude-sonnet-4-6"
}
```

This passed config validation but OpenCode still tried
to bill through its own payment system. "No payment
method" error pointing at OpenCode's billing page, not
OpenRouter's.

## What worked

OpenCode picks up `OPENROUTER_API_KEY` from the
environment automatically. The config file only needs
the model names:

```json
{
  "model": "openrouter/anthropic/claude-sonnet-4-6",
  "small_model": "openrouter/anthropic/claude-haiku-4-5"
}
```

But the key still has to be registered through
OpenCode's auth system. Inside the TUI:

1. Run `/connect`
2. Search for "OpenRouter"
3. Paste your API key

After that, OpenCode routes through OpenRouter. The
`openrouter/` prefix on model names tells it which
provider to use.

Note: OpenCode shows a warning when you select
OpenRouter saying requests "will often be routed to
subpar providers." That's partly true (OpenRouter does
use third-party hosting) and partly an upsell for
OpenCode Zen, their own paid hosting. You can pin
provider routing on OpenRouter's side if quality
matters for specific models.


# OpenClaw

OpenClaw has native OpenRouter support. The model
reference format is `openrouter/<provider>/<model>`,
same as OpenCode.

In `openclaw.json`:

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

After redeploying, I cleared Pai's sessions (OpenClaw
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
