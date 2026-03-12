---
title: "OpenClaw MVP"
summary: Setting up OpenClaw as a self-hosted AI agent on
  macOS, connected to Telegram.
slug: openclaw-mvp
category: dev
tags: openclaw, telegram, linear, ai, self-hosted
date: 2026-03-08
modified: 2026-03-08
status: published
image: openclaw-mvp.png
thumbnail: openclaw-mvp-thumb.png
imgprompt: A cute cartoon lobster wearing headphones, sitting
  at a small desk with a phone showing chat bubbles, cozy home
  office vibe, flat illustration style
---


# What OpenClaw is

[OpenClaw](https://openclaw.ai/) is wildly popular and kind of confusing. From what I
can tell before starting, other than being a first-class security concern, it's meant
to be a tool that lets you connect to your ai agents over chat tools like WhatsApp.

It runs locally, you bring your own API key (Anthropic, OpenAI,
DeepSeek), and your data stays on your machine (until you screw up). The gateway
connects to messaging platforms like Telegram, Signal, WhatsApp,
Discord, and apparently about 20 others.


# Install on macOS

Prerequisites: Node.js 22+ and an API key for your chosen
model provider (more on that next).

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


# Picking a model

The onboard wizard asks which model to use. OpenClaw supports
a long list of providers, but here are the ones that matter
for a personal assistant:

| Model | Input / Output (per 1M tokens) | Good for |
|-------|-------------------------------|----------|
| Claude Haiku 4.5 | $1 / $5 | Cheap daily driver |
| Claude Sonnet 4.6 | $3 / $15 | Solid middle ground |
| Claude Opus 4.6 | $5 / $25 | Best reasoning |
| GPT-5 | $1.25 / $10 | Strong alternative |
| GPT-4o Mini | $0.15 / $0.60 | Budget OpenAI |
| Gemini 2.5 Flash | Free (250 req/day) / ~$0.30 paid | Free option |
| Gemini 3 Pro | $2 / $12 | Strong reasoning |
| DeepSeek (via Ollama) | Free (local) | Fully offline |

## Can you use your $20/month subscription?

**ChatGPT Plus/Pro:** No. The subscription doesn't include API
access. You need a separate OpenAI API key with pay-as-you-go
billing.

**Claude Pro ($20/mo):** Not anymore. Early on, people found a
workaround using OAuth tokens from the Claude Code CLI.
Anthropic shut that down in January 2026. You need a separate
Anthropic API key.

**Claude Max ($200/mo) and Claude Code subscription:** Same
story. The setup-token auth path existed briefly but Anthropic
scoped the tokens so they only work with the official Claude
Code client.

## Trying Gemini's model

Apparently Google's Gemini API has a free tier, I tried it out. Gemini 2.5 Flash gets
250 requests/day free. For texting a bot a few times a day to manage issues, that's ok.

Annoyingly there are a bunch of 2.5 options. No idea if they all have free tiers.

I initially picked `google/gemini-2.5-flash-preview-09-2025` during the wizard and
gave it my api key using the `Paste API key now` option. Sadly that had an error

```test
models/gemini-2.5-flash-preview-09-2025 is not found for API version v1beta,
```
Fixing it was a pain in the ass, their `/model` and `/models` tools TUI setup was jank
af and just didnt work.

```bash
/exit
openclaw configure
```

I tried to switch the model up to `google/gemini-2.5-flash`.

Note that this thing stays running in the background
```bash
➜  ~ ps aux | grep openclaw
kp               39009   0.1  1.0 444980720 173456   ??  R    11:03AM   0:07.97 openclaw-gateway
```

Re-open the TUI with `openclaw tui` if you end up out of it.


## Connect Telegram

I paused here to install Telegram on my MacBook. It's pretty easy if you already have
it on your phone, you just scan a QR code.

During the quick start it recommends you use Telegram. I chose to use
`Telegram (Bot API)`. Then I followed the instructions:

```text
◇  Telegram bot token ───────────────────────────────────────────────────────────────────╮
│                                                                                        │
│  1) Open Telegram and chat with @BotFather                                             │
│  2) Run /newbot (or /mybots)                                                           │
│  3) Copy the token (looks like 123456:ABC...)                                          │
│  Tip: you can also set TELEGRAM_BOT_TOKEN in your env.                                 │
│  Docs: https://docs.openclaw.ai/telegram  │
│  Website: https://openclaw.ai                                                          │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────╯
```

The /newbot prompt had me name it. Then I got the key to give OpenClaw.

## Set up Search

I chose to use Gemini since I'm giving it that API key anyways. Plus, Google's gotta be
the best at search, right? It's like, their thing. Suprisingly it asked again for
`Gemini (Google Search) API key`. I just gave it the same key as before.

## Sketchy Skills Time

Then I got to here and just proceeed. There was some news about malware in the skills.
```text
◇  Skills status ─────────────╮
│                             │
│  Eligible: 8                │
│  Missing requirements: 43   │
│  Unsupported on this OS: 0  │
│  Blocked by allowlist: 0    │
│                             │
├─────────────────────────────╯
```

## Places API
What, why?
```text
◆  Set GOOGLE_PLACES_API_KEY for goplaces?
│  ○ Yes / ● No
```

## Gemini for nano banana
I mean yeah but I already gave it this key twice, kinda annoying.
```text
◆  Set GEMINI_API_KEY for nano-banana-pro?
│  ● Yes / ○ No
```
## The other keys it wants
... It wants a lot of keys, just start saying no.

## Hooks

I don't trust boot-md yet.
```text
◆  Enable hooks?
│  ◻ Skip for now
│  ◻ 🚀 boot-md
│  ◼ 📎 bootstrap-extra-files (Inject additional workspace bootstrap files via glob/path patterns)
│  ◼ 📝 command-logger (Log all command events to a centralized audit file)
│  ◼ 💾 session-memory (Save session context to memory when /new or /reset command is issued)
```

## Node wants to find devices on local networks
MacOS popup. Yeah, nah. This is already probably the least secure thing I've ever done
on purpose.


## Hatch the bot

I love a good TUI.

```text
◆  How do you want to hatch your bot?
│  ● Hatch in TUI (recommended)
│  ○ Open the Web UI
│  ○ Do this later
```



# Talk to the bot on Telegram

The BotFather sends you a link to your bot account. I clicked it, hit start, and that
sent /start to it. It immediately told me OpenClaw: access not configured. Love it.
I copied its whole message and just dumped it into the TUI for OC to sort it out.

Aand, it's that error again:
```text
LLM error: {
"error": {
"code": 404,
"message": "models/gemini-2.5-flash-preview-09-2025 is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.",
"status": "NOT_FOUND"
}
}
```

Turns out changing the model doesn't stick unless you restart the gateway.
Entertainingly I asked it to restart the gateway in the TUI. It killed the gateway and
then immediately went unresponsive, not having a gateway to work with.

Restarting it... `openclaw gateway`: Conveniently that opens it in the foreground, it
looks great in tmux.


## Set up the tone and such
When the messaging finally works on Telegram it'll ask you for an identity and tone.
It's kind of fun.


# Shutdown Procedure

Don't wanna leave this thing running until it's secured.

```bash
# Stop the gateway
openclaw gateway stop

# Verify nothing is still running
ps aux | grep openclaw
pkill -f openclaw-gateway
```


# What's next

I wanted to set this up with Linear, but honestly I don't love it runing flat on my
Macbook. I'm gonna [put it in K8s](/openclaw-k8s.html) and producitonize this now
that I've got the MVP figured out.
