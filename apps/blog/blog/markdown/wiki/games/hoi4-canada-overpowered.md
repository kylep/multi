---
title: "HOI4: Canada Overpowered"
summary: "Hearts of Iron 4 mod that makes Canada the most powerful nation in the game."
keywords:
  - hoi4
  - mod
  - steam-workshop
  - hearts-of-iron
scope: "HOI4 Canada Overpowered mod: what it does, how to deploy, Steam Workshop upload."
last_verified: 2026-03-25
---

![Canada Overpowered thumbnail](/images/hoi4-canada-thumbnail.png)

## What the mod does

- Adds a custom **gigalopolis** state category with 50 building slots (vanilla megalopolis has 12)
- All 25 Canadian states set to gigalopolis with 10M manpower and 500 of every resource
- Per-building caps raised to 50 (factories, dockyards, etc.)
- Canada gets **cores on all 48 US and 13 Mexican states** — full manpower, no resistance when conquered
- Vanilla buildings preserved — normal 1936 layout with 50 open slots to build into
- **"Elbows Up"** national spirit: +3 political power/day, +10% stability
- Global `MAX_SHARED_SLOTS` raised from 25 to 50

## Links

- [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=3691970032)
- Repo: `apps/mods/hoi4/`

## Deploy

```bash
apps/mods/hoi4/scripts/deploy.sh
```

Copies the mod into `~/Documents/Paradox Interactive/Hearts of Iron IV/mod/`. Launch HOI4 and enable "Canada Overpowered" in the launcher.

## Rebuild from vanilla

If vanilla game files update:

```bash
python3 apps/mods/hoi4/scripts/build.py
python3 apps/mods/hoi4/scripts/validate.py
```

## Steam Workshop upload

1. Deploy and launch HOI4
2. Enable the mod, start a game to verify
3. Launcher > Mods > Mod Tools > Upload a Mod
4. Select "Canada Overpowered", add a description, upload
5. Change visibility from Private to Public on the Workshop page
