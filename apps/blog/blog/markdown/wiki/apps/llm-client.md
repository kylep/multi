---
title: "llm-client"
summary: "Browser-based chat UI for llama-server, OpenRouter, or any OpenAI-compatible endpoint. Next.js 16 + Tailwind v4 + shadcn/ui + zustand."
keywords:
  - llm-client
  - nextjs
  - llama-server
  - openrouter
  - chat-ui
scope: "llm-client app: where it lives online, how to develop, how it deploys."
last_verified: 2026-04-17
---

## Live

[kyle.pericak.com/apps/llm-client/](https://kyle.pericak.com/apps/llm-client/)

Static export hosted under the main blog bucket (`gs://kyle.pericak.com/apps/llm-client`).

## What it is

A browser chat UI that talks to any OpenAI-compatible `/v1/chat/completions`
endpoint — [llama-server](https://github.com/ggerganov/llama.cpp/tree/master/tools/server),
[OpenRouter](https://openrouter.ai), etc. Chats and settings live in
`localStorage`; there is no server-side storage.

Source: `apps/llm-client/`.

## Tech stack

- Next.js 16 (static export) + React 19
- Tailwind v4 + shadcn/ui + Radix primitives
- zustand with `persist` for state
- Vitest (unit) + Playwright (E2E, mocked endpoints)
- pnpm workspace

## Development

```bash
cd apps/llm-client
bin/install.sh              # first time: pnpm install + playwright browsers
bin/start-dev.sh            # dev server on :3100
bin/start-dev.sh 3200       # custom port
bin/kill-dev.sh             # stop
bin/test.sh                 # unit + E2E
```

Requires a running llama-server (or compatible) — default `http://127.0.0.1:8080`,
configurable in the UI via the "Connected to" pill.

## Deploy

```bash
cd apps/llm-client
npm run build
bin/prod-deploy.sh
```

`bin/prod-deploy.sh` rsyncs `out/` to `gs://kyle.pericak.com/apps/llm-client`
and sets `Cache-Control: no-cache,no-store,must-revalidate` on changed
files so Cloudflare picks up updates immediately.

Only Kyle deploys to prod.

## Versioning

Semver in `package.json`, injected at build via `NEXT_PUBLIC_APP_VERSION`
in `next.config.ts`, exposed through `src/lib/version.ts`. Bump patch for
fixes, minor for features, major for breaking changes.
