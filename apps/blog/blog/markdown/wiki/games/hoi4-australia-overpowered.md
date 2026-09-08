---
title: "HOI4: Australia Overpowered"
summary: "Hearts of Iron 4 mod that makes Australia the most powerful nation in the game, with cores across the Pacific."
keywords:
  - hoi4
  - mod
  - steam-workshop
  - hearts-of-iron
scope: "HOI4 Australia Overpowered mod: what it does, how to deploy, Steam Workshop upload."
last_verified: 2026-09-05
---

![Australia Overpowered thumbnail](/images/hoi4-australia-thumbnail.png)

Sibling of [Canada Overpowered](/wiki/games/hoi4-canada-overpowered.html): same gigalopolis treatment, but the cores go across the Pacific instead of across North America.

## What the mod does

- Adds a custom **gigalopolis** state category with 50 building slots (vanilla megalopolis has 12)
- All 20 Australian-owned states (mainland, Tasmania, Papua, New Guinea, Bismarck, Bougainville, Nauru) set to gigalopolis with 10M manpower and 500 of every resource
- Per-building caps raised to 50 (factories, dockyards, etc.)
- Australia gets **cores on 34 Pacific island states**: New Zealand, Fiji, the Solomons, New Caledonia, Tahiti, the Japanese mandate islands, Hawaii and the US Pacific outposts, Dutch New Guinea, Easter Island and the Galapagos — full manpower, no resistance when conquered
- Vanilla buildings preserved — normal 1936 layout with 50 open slots to build into
- **"She'll Be Right"** national spirit: +3 political power/day, +25% stability, +25% war support
- Every country starts with +100 opinion of Australia
- Global `MAX_SHARED_SLOTS` raised from 25 to 50

Not cored: the Philippines, the Dutch East Indies (other than New Guinea), Japan's home islands, Okinawa and Taiwan.

## Links

- Steam Workshop: not yet uploaded
- Repo: `apps/mods/hoi4/australia-overpowered/`

## Deploy

```bash
apps/mods/hoi4/australia-overpowered/scripts/deploy.sh
```

Copies the mod into `~/Documents/Paradox Interactive/Hearts of Iron IV/mod/`. Launch HOI4 and enable "Australia Overpowered" in the launcher.

## Rebuild from vanilla

If vanilla game files update:

```bash
python3 apps/mods/hoi4/australia-overpowered/scripts/build.py
python3 apps/mods/hoi4/australia-overpowered/scripts/validate.py
```

## Steam Workshop upload

1. Deploy and launch HOI4
2. Enable the mod, start a game to verify
3. Launcher > Mods > Mod Tools > Upload a Mod
4. Select "Australia Overpowered", add a description, upload
5. Change visibility from Private to Public on the Workshop page
