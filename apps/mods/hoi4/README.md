# Canada Overpowered — HOI4 Mod

A Hearts of Iron 4 mod that makes Canada the most powerful nation in the game.

## What it does

- Adds a custom **gigalopolis** state category with 50 building slots (vanilla megalopolis has 12)
- All 25 Canadian states set to gigalopolis with 10M manpower and 500 of every resource
- Per-building caps raised to 50 (factories, dockyards, etc.)
- Canada gets **cores on all US (48) and Mexican (13) states** — full manpower, no resistance when conquered
- Vanilla buildings preserved — you start with the normal 1936 layout and build into 50 open slots
- **"Elbows Up"** national spirit: +3 political power/day, +10% stability
- Global `MAX_SHARED_SLOTS` raised from 25 to 50

## Building the mod

The build script copies vanilla state files from your Steam install and applies modifications:

```bash
python3 scripts/build.py
```

Vanilla files are read from:
`~/Library/Application Support/Steam/steamapps/common/Hearts of Iron IV/history/states/`

## Validating

Run the validation script to check all state files for correctness:

```bash
python3 scripts/validate.py
```

## Deploying to HOI4

The deploy script copies the mod into your HOI4 mod directory:

```bash
scripts/deploy.sh
```

Then launch HOI4, enable "Canada Overpowered" in the launcher, and start a game.

## Thumbnail

Replace `mod/thumbnail.png` with a 520x520 PNG (under 1MB) before uploading to Steam Workshop.

## Steam Workshop upload

1. Deploy the mod and launch HOI4
2. Enable the mod and verify it works in-game
3. In the launcher: Mods → Mod Tools → Upload a Mod
4. Select "Canada Overpowered", add a description, click Upload
5. Change visibility from Private to Public on the Workshop page
