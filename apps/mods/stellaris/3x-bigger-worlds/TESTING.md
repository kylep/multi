# Testing — 3x Bigger Worlds

## Pre-game (automated)

Run from `apps/mods/stellaris/3x-bigger-worlds/`:

```bash
python3 scripts/preflight.py
```

| Check | What it verifies |
| ----- | ---------------- |
| C1    | Brace balance on every generated `.txt` (a single dropped `}` corrupts the entire file as far as Stellaris is concerned). |
| C2    | Symmetric drift: every top-level `d_*` key in vanilla `common/deposits/<file>` is present in our same-named override (catches deletions, which would silently remove a deposit from world generation) AND the override has no `d_*` keys absent from vanilla (catches the build.py-introduced-a-bogus-key failure mode). |
| C3    | `zz_bworlds_planet_sizes.txt` defines all six expected variables (`@habitable_planet_{min,max}_size`, `@habitable_moon_{min,max}_size`, `@DISTRICTS_FROM_SR_DEPOSITS{,_SMALL}`) at `MULTIPLIER * vanilla` (multiplier read from `build.py`, vanilla read from local install — drift between either side and the override fails this check). |
| C4    | For every deposit file, the sequence of positive `district_*_max_add` / `district_*_min_add` / `planet_max_districts_add` values and the sequence of `produces = { N }` values match the vanilla sequence multiplied by `MULTIPLIER`. This is the spot check that the regex transform actually ran and ran correctly across every file. |
| C5    | Negative `district_*_max_add` / `planet_max_districts_add` values appear the same number of times in the override as in vanilla (blockers preserved byte-for-byte — same regex shape as C4 so the policy stays symmetric). |
| C6    | All `localisation/**/*.yml` files start with a UTF-8 BOM. Stellaris silently renders raw keys instead of localized strings when the BOM is missing. (No-op currently — the mod ships no localisation files.) |
| C7    | `descriptor.mod` exists and contains a `supported_version` line. |
| C8    | If deployed, the symlink under `~/Documents/Paradox Interactive/Stellaris/mod/` resolves into this repo and the outer `.mod` file has an absolute `path=`. |
| C9    | `thumbnail.png` exists, has valid PNG magic bytes (`89 50 4E 47 0D 0A 1A 0A`), parses an IHDR chunk reporting exactly 512×512, has no alpha channel (color_type ∈ {0, 2, 3} — greyscale / RGB / palette, not 4 or 6), and is < 1 MB. Strengthened from "real PNG + <1MB" after the Multi-Megastructures Workshop upload broke on a JPEG-with-`.png`-extension; the dimension and alpha checks also catch the next-most-likely failure modes (wrong-aspect crops and transparency artefacts in the Workshop preview). |
| —     | `scripts/process-thumbnail.sh` is the canonical way to produce a compliant `mod/thumbnail.png` from any source image — drop `thumbnail-src.<ext>` (PNG / JPEG / WebP / TIFF) in the `mod/` dir and run it; the script re-encodes to real PNG, pads to 512×512, strips alpha, and copies to `apps/blog/blog/public/images/stellaris-3x-bigger-worlds-thumbnail.png` for the wiki page. C9 enforces what this script produces. |

A green run (`9 check(s) passed`) is required before launching the game.

The current `mod/thumbnail.png` is a **placeholder** (copied from the Multi-Megastructures mod for shape compliance). It must be replaced with 3x-Bigger-Worlds-themed art before Workshop upload — see the README "Thumbnail" section for the workflow.

## In-game (manual)

1. Launch Stellaris → Paradox Launcher → Mods → enable **3x Bigger Worlds** → Play.
2. Start a new game with default galaxy settings.
3. **Planet size.** Open the home planet. Size should read **75** (vanilla starting capital = 25). Open the surveyed neighbour systems — habitable planets should be in the 36–75 range, moons 30–45.
4. **Planetary deposit district adds.** Click a planetary feature on the home planet ("Mineral Fields", "Bountiful Plains", "Geothermal Vent", etc.). The tooltip should show `+3 Max Mining Districts` (or farming / generator), not `+1`. Spot-check 3 different features across at least 2 planets.
5. **Orbital deposit yields.** Find an uncolonizable body with a mineral / energy / research deposit shown in the system view (the small numbers around the planet icon). A vanilla `d_minerals_2` deposit yields `2`; under this mod the same deposit yields `6`. Survey 4–5 systems to confirm a spread of tripled values, not just one.
6. **Strategic resource districts.** Build a zone on a planet with an SR deposit ("Crystalline Caverns", etc.). The district that gets unlocked should add 9 max instead of 3.
7. **Error log.** Tail `~/Documents/Paradox Interactive/Stellaris/logs/error.log` for ~30 in-game days. Unresolved `@variable` references, missing deposit IDs, or "could not find" errors here mean the override is dropping something.
8. **Save compatibility.** Save, exit, reload. Planet sizes and deposit values should persist exactly (planet size is fixed at galaxy generation; deposits re-evaluate from definitions on load).

## After a Stellaris patch

1. `python3 scripts/build.py` — regenerates every override against the new vanilla files.
2. `python3 scripts/preflight.py` — must still pass (especially C2 and C4; vanilla key drift or new deposit fields without numeric values would surface here).
3. Update `supported_version` in `mod/descriptor.mod` to match the new patch.
4. Repeat in-game checks 3–7.
