---
title: "Agent Icons"
summary: "How to generate Discord profile icons for the agent team using generate-agent-icon.mjs."
keywords:
  - icons
  - discord
  - avatars
  - image-generation
related:
  - wiki/agent-team/index.html
scope: "Agent icon generation: script usage, theme, and agent-to-animal mapping."
last_verified: 2026-03-15
---

## Script

`apps/blog/blog/scripts/generate-agent-icon.mjs` generates 512x512 Discord-ready
profile icons for each agent. It uses the same image generation providers and
env vars as the blog's `generate-images.mjs`.

### Usage

```bash
cd apps/blog/blog
node scripts/generate-agent-icon.mjs <agent-name>
```

Override the provider with `IMAGE_MODEL`:

```bash
IMAGE_MODEL=gemini-3-pro node scripts/generate-agent-icon.mjs journalist
```

### Env vars

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI (gpt-image-1.5) |
| `GEMINI_API_KEY` | Gemini 3 Pro / 2.5 Flash / 2.0 Flash |
| `BFL_API_KEY` | Black Forest Labs (Flux 2 Max) |
| `IMAGE_MODEL` | Provider selector (default: `openai`) |

### Output

Images are saved to `apps/blog/blog/public/images/agent-<name>.png`.

## Theme: Geometric Animal Totems

All agent icons share a consistent visual theme — each agent is represented
by a geometric animal portrait on a dark charcoal background with bright
accent colors. The animals are chosen to reflect each agent's role.

| Agent | Animal | Why |
|-------|--------|-----|
| Journalist | Owl | Observation, wisdom, nocturnal vigilance |
| Publisher | Lion | Authority, leadership, commanding presence |
| Analyst | Fox | Curiosity, sharp analysis, cunning |
| Synthesizer | Octopus | Multi-armed, connects many sources at once |
| PRD Writer | Bowerbird | Builds elaborate, purposeful structures to align |
| Researcher | Bloodhound | Relentless pursuit, nose for details |
| Reviewer | Hawk | Piercing eye, catches what others miss |
| QA | Beaver | Meticulous builder, structural integrity |
| Security Auditor | Pangolin | Natural armor, defensive posture |

### Style spec

- Minimalist flat vector portrait
- Dark charcoal background (#1a1a2e)
- Bright accent colors, no gradients
- Centered bust, subject fills 70% of frame
- Friendly and professional tone
- No text, shadows, textures, or transparency
