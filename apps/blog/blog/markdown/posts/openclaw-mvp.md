---
title: "OpenClaw MVP"
summary: Setting up OpenClaw as a self-hosted AI agent on
  macOS, connected to Telegram, managing Linear issues from
  my phone.
slug: openclaw-mvp
category: dev
tags: openclaw, telegram, linear, ai, self-hosted
date: 2026-03-07
modified: 2026-03-07
status: published
image: openclaw-mvp.png
thumbnail: openclaw-mvp-thumb.png
imgprompt: A cute cartoon lobster wearing headphones, sitting
  at a small desk with a phone showing chat bubbles, cozy home
  office vibe, flat illustration style
---


I wanted an AI I could text from my phone that does real things.
Not a chatbot, not a wrapper around ChatGPT. Something that
manages my Linear issues when I'm away from a laptop. OpenClaw
does that, and it runs on my Mac.


# What OpenClaw is

[OpenClaw](https://openclaw.ai/) is an open-source agent
runtime by Peter Steinberger, originally published in late 2025
under the name Clawdbot. It went through a couple renames
(trademark issues, lobster branding) and landed on OpenClaw in
January 2026. It hit 247k GitHub stars in its first few months.

It runs locally, you bring your own API key (Anthropic, OpenAI,
DeepSeek), and your data stays on your machine. The gateway
connects to messaging platforms like Telegram, Signal, WhatsApp,
Discord, and about 20 others. You text it, it does things.


# Install on macOS

Prerequisites: Node.js 22+ and an Anthropic API key (or
OpenAI, but I'm using Claude).

The recommended install uses their script:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

That handles Node detection and installs the `openclaw` CLI.
If you want to skip the wizard and install the binary only:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
```

Then run the onboarding wizard separately:

```bash
openclaw onboard
```

The wizard walks through gateway setup, workspace directory,
and API key config. Everything lives in `~/.openclaw/`.

Verify the install:

```bash
openclaw doctor   # check for config issues
openclaw status   # gateway status
```


# Connect Telegram

1. Open Telegram, message `@BotFather`
2. Run `/newbot`, follow the prompts, save the token
3. Edit `~/.openclaw/openclaw.json` and add the Telegram
   channel:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "YOUR_TOKEN",  // from BotFather
      dmPolicy: "pairing",
    },
  },
}
```

4. Start the gateway:

```bash
openclaw gateway
```

5. Open Telegram and message your bot. It will reply with a
   pairing code.

6. Approve the pairing in your terminal:

```bash
openclaw pairing approve telegram <CODE>
```

Pairing codes expire after one hour. Only you know the bot
token, and pairing adds a second layer on top of that. For a
single-owner setup, you could also use `dmPolicy: "allowlist"`
with your numeric Telegram user ID in `allowFrom` for more
durable access control.


# The useful part: Linear from Telegram

Install the Linear skill from ClawHub:

```bash
clawhub install linear
```

Create a Linear API key at
**linear.app > Settings > Account > Security > Personal API
keys**. Add it to your OpenClaw credentials:

```bash
# Store the key where OpenClaw expects it
mkdir -p ~/.openclaw/credentials
cat > ~/.openclaw/credentials/linear.json << 'EOF'
{
  "apiKey": "lin_api_YOUR_KEY_HERE"
}
EOF
```

Restart the gateway, then text your bot.

**Note:** I wrote this post before running the full setup on my
M1. These are expected interactions based on the Linear skill
docs, not verified terminal output.

Expected conversations:

> **Me:** What issues are assigned to me?
>
> **Bot:** You have 3 issues assigned:
> 1. ENG-142 - Fix deploy timeout (In Progress)
> 2. ENG-138 - Update API docs (Todo)
> 3. ENG-131 - Add rate limiting (Backlog)

> **Me:** Create an issue on ENG: blog post needs OpenClaw
> screenshots
>
> **Bot:** Created ENG-145: "Blog post needs OpenClaw
> screenshots" (Todo)

> **Me:** Move ENG-142 to Done
>
> **Bot:** Updated ENG-142 to Done.

That's the whole point. I'm on the couch, I remember something
needs doing, I text the lobster. No laptop required.


# What's next

This is the MVP. I haven't tried skills beyond Linear yet.
The [ClawHub registry](https://clawhub.ai/) has thousands of
them. I also want to see how well it handles multi-step tasks
where it needs to chain tool calls together, like "create an
issue, assign it to me, and set it to high priority" in one
message.

The gateway needs to stay running on my Mac for this to work,
which means the laptop can't sleep. A Mac Mini or a Raspberry
Pi would be a better long-term home for it.
