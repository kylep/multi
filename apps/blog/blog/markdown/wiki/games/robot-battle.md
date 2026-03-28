---
title: "Robot Battle"
summary: "Browser-based turn-based robot combat game. Buy weapons, fight enemies, level up."
keywords:
  - game
  - typescript
  - vite
  - browser-game
scope: "Robot Battle web game: how to develop, test, deploy, and extend."
last_verified: 2026-03-28
---

## Play

[Play Robot Battle](/games/robot-battle/index.html)

## What it is

A turn-based robot combat game played in the browser. Name your robot,
buy weapons and gear from a shop, then fight increasingly tough enemies
to earn money and XP. Built by Kyle, Oliver, and Lucas.

Ported from the Python CLI game at `apps/games/robotext-battle/` to
TypeScript at `apps/games/robot-battle/`.

## Tech stack

- Vite + TypeScript (vanilla, no framework)
- Vitest for unit tests
- Playwright for E2E tests
- Hosted as a static page on the blog

## Development

```bash
cd apps/games/robot-battle
npm install
npm run dev          # dev server on :5173
npx vitest run       # unit tests (61 tests)
npx playwright test  # E2E tests (28 tests)
```

## Deploy to blog

```bash
cd apps/games/robot-battle
bin/deploy-to-blog.sh
```

This builds the game and copies the output to `apps/blog/blog/public/games/robot-battle/`.
The game is then served at `/games/robot-battle/index.html` on the blog.

## Architecture

The engine is pure TypeScript functions operating on plain objects (no classes).
All game state is JSON-serializable. The UI layer (`src/ui/`) wraps the
engine with a browser terminal interface.

```
src/engine/   — pure logic (battle, shop, AI, data loading)
src/ui/       — DomTerminal + screen modules (game, menu, battle, shop, inspect)
src/data/     — JSON game data (config, items, enemies)
spec/         — game design and engine specs
tests/unit/   — vitest unit tests
tests/e2e/    — playwright E2E tests
```

## Game data

Items, enemies, and config live in `src/data/*.json`. To add a new weapon,
gear, consumable, or enemy, edit the corresponding JSON file. The game
reloads data on startup.

## Extending

- **New enemy**: add to `src/data/enemies.json`, reference existing items
- **New item**: add to `src/data/items.json` under weapons/gear/consumables
- **New screen**: add `src/ui/screens/yourscreen.ts`, wire into `menu.ts`
