# Australia Overpowered — HOI4 Mod

A Hearts of Iron 4 mod that makes Australia the most powerful nation in the game. Sibling of [Canada Overpowered](../canada-overpowered/): same gigalopolis treatment, but the cores go across the Pacific instead of across North America.

## What it does

- Adds a custom **gigalopolis** state category with 50 building slots (vanilla megalopolis has 12)
- All 20 Australian-owned states (mainland, Tasmania, Papua, New Guinea, Bismarck, Bougainville, Nauru) set to gigalopolis with 10M manpower and 500 of every resource (including coal)
- Per-building caps raised to 50 (factories, dockyards, etc.)
- Australia gets **cores on 34 Pacific island states** — full manpower, no resistance when conquered:
  - New Zealand (5 states) and Western Samoa
  - British: Solomon Islands, Fiji, Gilbert Islands, Ellice Islands, Santa Cruz Islands, Pitcairn
  - French: New Caledonia, Tahiti, Vanuatu
  - Japanese mandate: Marshall Islands, Caroline Islands, Saipan, Palau, Iwo Jima, Marcus Island
  - American: Hawaii, Johnston Atoll, Midway, Wake, Guam, Phoenix Island, Line Islands, American Samoa, Attu
  - Dutch New Guinea (both states), Easter Island, Galapagos
- Vanilla buildings preserved — you start with the normal 1936 layout and build into 50 open slots
- **"She'll Be Right"** national spirit: +3 political power/day, +25% stability, +25% war support
- Every country starts with +100 opinion of Australia
- Global `MAX_SHARED_SLOTS` raised from 25 to 50

Deliberately **not** cored: the Philippines, the Dutch East Indies (other than New Guinea), Japan's home islands, Okinawa and Taiwan. Edit the state sets at the top of `scripts/build.py` to change the list.

## Building the mod

The build script copies vanilla state and country files from your Steam install and applies the modifications:

```bash
python3 scripts/build.py
```

Vanilla files are read from:
`~/Library/Application Support/Steam/steamapps/common/Hearts of Iron IV/history/`

## Validating

```bash
python3 scripts/validate.py
```

Checks every generated state file (braces, ids, provinces unchanged from vanilla, AST core present, boost values, building caps) and the Australia country file.

## Deploying to HOI4

```bash
scripts/deploy.sh
```

Copies the mod into `~/Documents/Paradox Interactive/Hearts of Iron IV/mod/`. Then launch HOI4, enable "Australia Overpowered" in the launcher, and start a game.

## Thumbnail

```bash
GEMINI_API_KEY=... node scripts/generate-thumbnail.mjs   # writes mod/thumbnail-src.png
scripts/process-thumbnail.sh                              # -> mod/thumbnail.png (512x512 RGB PNG) + blog copy
```

Any 512x512 PNG under 1MB dropped at `mod/thumbnail-src.png` works with the second step alone.

## Steam Workshop upload

1. Deploy the mod and launch HOI4
2. Enable the mod and verify it works in-game
3. In the launcher: Mods → Mod Tools → Upload a Mod
4. Select "Australia Overpowered", add a description, click Upload
5. Change visibility from Private to Public on the Workshop page
