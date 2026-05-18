# Test plan

Two phases:

1. **Pre-game verification** — automated, runs in seconds, catches the failure modes most likely to turn into "mod loads but silently does nothing" or "crash on new game". Run before every commit.
2. **In-game smoke test** — manual, runs once after deploy and after any mechanical change.

## Pre-game verification

```bash
python3 scripts/preflight.py
```

Reads from the local Stellaris install at `~/Library/Application Support/Steam/steamapps/common/Stellaris/`. No dotnet / CWTools required.

| # | Check | What it catches |
|---|---|---|
| C1 | Brace balance on every script file | Transformations that drop a `}` and silently corrupt the parser |
| C2 | No leaked `built_<X>` flags or `has_no_non_gate_megastructure` in generated megastructure files outside comments | Transformations that missed an occurrence |
| C3 | `mmegs_unused_flag` or `always = yes` appears in every generated file whose vanilla had a limit | The transformation didn't run on a file |
| C4 | Every top-level megastructure key in the vanilla file also exists in the override | Generator accidentally stripped an entire stage (e.g. `dyson_sphere_3`) |
| C5 | Every tech ID in `give_technology` exists in vanilla `common/technology/` | Typo'd or DLC-renamed tech (e.g. `tech_mega_art_installation` vs `tech_mega_art`) |
| C6 | Every on_action hook (e.g. `on_game_start_country`) is a real vanilla on_action | Typo in hook name that would make the entire mod a no-op |
| C7 | Every event id referenced from on_actions is defined in our events file | `events = { mmegs.1 }` referencing an undefined event |
| C8 | Every localisation YAML starts with a UTF-8 BOM | Stellaris loads YAML without BOM as literal raw keys instead of translated strings |
| C9 | `descriptor.mod` present and contains `supported_version` | Launcher won't load the mod |
| C10 | If deployed: symlink in `~/Documents/Paradox Interactive/Stellaris/mod/` resolves into this repo and the outer `.mod` descriptor has an absolute `path=` | Deploy script regression |

Exit code is non-zero on any FAIL.

## In-game smoke test

Run after `scripts/deploy.sh` succeeds and preflight is green.

1. Launch Stellaris → Paradox Launcher → Mods → enable **Multi-Megastructures + Free Tech** → Play.
2. Start a new game with **at least one AI empire**.
3. **Feature 3 (free tech):** open Research panel; all 16 megastructure techs are already researched. Use console:
   ```
   debugtooltip
   play <ai_country_id>
   ```
   Confirm the AI empire also has them researched.
4. **Feature 1 (multiple per empire):**
   - Use console `event mmegs.1` if needed to refire the grant (sanity check).
   - Build a Dyson Sphere (or use console `effect create_megastructure = { type = dyson_sphere_0 }`).
   - After completion, start a second Dyson Sphere in a *different* system. Construction option must still be available.
5. **Feature 2 (multiple per system / celestial body):**
   - In a system that already has a finished megastructure, attempt to build a different megastructure on a different celestial body in the same system. Must succeed.
   - Then attempt to build a third megastructure on the *same* celestial body. Must succeed.
6. **Error log:** tail `~/Documents/Paradox Interactive/Stellaris/logs/error.log` after starting the game. Any new `[ERROR]` entries naming our files (`mmegs_*`, `00_ring_world.txt`, etc.) is a regression.
7. **Mod conflict sanity:** disable other megastructure-affecting mods before this test — last-loaded wins on `common/megastructures/*.txt`.

## Failure handling

- **Preflight FAIL:** fix before deploying. Each FAIL line names the file and identifier involved.
- **In-game error log mentions our file:** re-run `scripts/build.py` (the vanilla source may have updated) then `scripts/preflight.py`. If still failing, the vanilla file's structure changed — review the diff between the new vanilla file and our last-known override.
- **Game crashes on load:** revert by removing the symlink at `~/Documents/Paradox Interactive/Stellaris/mod/multi-megastructures` and the outer `.mod` descriptor. Stellaris launches without the mod immediately.

## Future hardening

- **CWTools full lint.** Install dotnet + the CWTools CLI for a full Paradox-syntax linter. ~200 MB runtime; optional but covers cases preflight misses (semantic trigger/effect scope checks).
- **Save-game smoke test.** Load an existing save with the mod enabled to verify backwards-compatibility once a save format exists.
